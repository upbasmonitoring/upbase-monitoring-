import HealingLog from '../models/HealingLog.js';
import Monitor from '../models/Monitor.js';
import User from '../models/User.js';
import { mergeBranch, rollbackBranch } from '../services/githubService.js';
import { addIncidentEvent } from '../services/incidentService.js';
import { validateFix as pipelineValidator } from '../services/validationService.js';

/**
 * Fix Controller: Operations for Ralph Diagnostics Dashboard
 */

// @desc    Get latest fix for a monitor
// @route   GET /api/fixes/:monitorId
export const getFixByMonitorId = async (req, res) => {
    try {
        const fix = await HealingLog.findOne({ 
            monitor: req.params.monitorId,
            outcome: { $in: ['suggestion_generated', 'in_progress'] } 
        }).sort({ startedAt: -1 }).populate('monitor');

        if (!fix) {
            return res.status(404).json({ message: 'No active fix found for this monitor' });
        }

        res.json(fix);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Merge a fix branch into main
// @route   POST /api/fixes/:id/merge
export const mergeFix = async (req, res) => {
    try {
        const fix = await HealingLog.findById(req.params.id).populate('monitor');
        if (!fix) return res.status(404).json({ message: 'Fix not found' });

        const monitor = fix.monitor;

        // 1. IDEMPOTENCY: Prevent duplicate merge
        if (monitor.lastFixStatus === 'MERGED' || monitor.lastFixStatus === 'SUCCESS') {
            return res.json({ success: true, message: 'Fix already merged or in progress.' });
        }

        // 2. CONCURRENCY: Prevent simultaneous merges
        if (monitor.mergeInProgress) {
            return res.status(409).json({ message: 'A merge operation is already in progress for this repository.' });
        }

        const user = await User.findById(req.user._id).select('+github.accessToken');
        const token = user?.github?.accessToken;

        if (!token) return res.status(401).json({ message: 'GitHub access token not found' });

        const { owner, repo, branch = 'main' } = monitor.githubRepo || {};
        const fixBranch = 'fix/ralph-auto-fix';

        try {
            // SET LOCK
            monitor.mergeInProgress = true;
            await monitor.save();

            console.log(`[FIX-CONTROLLER] 🧊 Merging fix into ${branch} for ${repo}...`);

            const success = await mergeBranch(token, owner, repo, branch, fixBranch, `[Ralph] User approved fix for: ${monitor.name}`);

            if (success) {
                fix.outcome = 'fix_applied';
                fix.completedAt = new Date();
                await fix.save();

                monitor.lastFixStatus = 'MERGED';
                monitor.mergedAt = new Date();
                monitor.productionVerified = false;
                monitor.rollbackDone = false; // Reset for post-merge cycle
                monitor.mergeInProgress = false; // RELEASE LOCK
                await monitor.save();

                await addIncidentEvent(monitor._id, 'AI_FIX_MERGED', `User manually merged the Ralph Auto-Fix. Starting post-merge validation...`);

                res.json({ success: true, message: 'Fix merged. Initiating production verification...' });
            } else {
                monitor.mergeInProgress = false; // RELEASE LOCK
                await monitor.save();
                res.status(500).json({ message: 'Merge failed due to conflict or permissions.' });
            }
        } catch (err) {
            monitor.mergeInProgress = false; // RELEASE LOCK
            await monitor.save();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Perform post-merge validation (Production URLs)
// @route   POST /api/fixes/:id/post-merge-validate
export const postMergeValidate = async (req, res) => {
    try {
        const fix = await HealingLog.findById(req.params.id).populate('monitor');
        if (!fix) return res.status(404).json({ message: 'Fix not found' });

        const monitor = await Monitor.findById(fix.monitor._id);
        
        // --- HARDENING: WARMUP DELAY (20s) ---
        // Allow Render/Cloudflare to hydrate the new build
        console.log(`[POST-MERGE] Warming up production stack for 20s...`);
        await new Promise(r => setTimeout(r, 20000));

        // --- HARDENING: RETRY LOGIC (3 Attempts) ---
        let validation = { success: false };
        for (let i = 0; i < 3; i++) {
            console.log(`[POST-MERGE] Validating production (Attempt ${i + 1}/3)...`);
            validation = await pipelineValidator({
                frontendUrl: monitor.url,
                backendUrl: monitor.apiUrl,
                monitor
            });

            if (validation.success) break;
            
            if (i < 2) {
                console.warn(`[POST-MERGE] Attempt ${i + 1} failed. Retrying in 10s...`);
                await new Promise(r => setTimeout(r, 10000));
            }
        }

        if (validation.success) {
            monitor.lastFixStatus = 'SUCCESS';
            monitor.productionVerified = true;
            
            // --- SECURITY: UPDATE STABLE SHA ONLY ON SUCCESS ---
            // If the repo info exists, we should track this new commit as the new "stable" base
            // For now we assume the merge commit is the new stable
            await monitor.save();

            await addIncidentEvent(monitor._id, 'POST_MERGE_SUCCESS', `Production URLs verified. System is stable.`);
            res.json({ success: true, message: 'Fix verified and production is stable.' });
        } else {
            // --- IDEMPOTENT ROLLBACK ---
            if (monitor.rollbackDone) {
                return res.status(500).json({ message: "Post-merge failure detected, but rollback was already executed." });
            }

            console.error(`[POST-MERGE] 🚨 PRODUCTION FAILURE DETECTED! TRIGGERING ROLLBACK.`);
            
            const user = await User.findById(req.user._id).select('+github.accessToken');
            const { owner, repo, branch = 'main', lastReleaseSha } = monitor.githubRepo || {};
            
            if (lastReleaseSha) {
                monitor.rollbackDone = true; // Set before execution to prevent double-hits
                await monitor.save();

                const rolledBack = await rollbackBranch(user.github.accessToken, owner, repo, branch, lastReleaseSha);
                
                if (rolledBack) {
                    monitor.lastFixStatus = 'POST_MERGE_FAILED';
                    monitor.productionVerified = false;
                    await monitor.save();

                    await addIncidentEvent(monitor._id, 'POST_MERGE_ROLLBACK', `Production failed validation after merge. System ROLLED BACK to stable SHA: ${lastReleaseSha.substring(0, 7)}.`);
                    return res.status(500).json({ 
                        success: false, 
                        message: "Fix merged but failed verification. Production ROLLED BACK for safety." 
                    });
                }
            }

            res.status(500).json({ success: false, message: "Production validation failed. Manual intervention required." });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Reject a fix
// @route   POST /api/fixes/:id/reject
export const rejectFix = async (req, res) => {
    try {
        const fix = await HealingLog.findById(req.params.id);
        if (!fix) return res.status(404).json({ message: 'Fix not found' });

        fix.outcome = 'fix_rejected';
        fix.completedAt = new Date();
        await fix.save();

        const monitor = await Monitor.findById(fix.monitor);
        monitor.lastFixStatus = 'IDLE';
        monitor.autoFixAttempted = false;
        await monitor.save();

        res.json({ success: true, message: 'Fix rejected successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

import Monitor from '../models/Monitor.js';
import User from '../models/User.js';
import HealingLog from '../models/HealingLog.js';
import { generateFix } from './aiService.js';
import { getCommitDiff, createBranch, pushCommit, guessFailingFilePath, getFileContent } from './githubService.js';
import { validateFix as aiFixValidator } from '../utils/fixValidator.js';
import { validateFix as pipelineValidator } from './validationService.js';
import { addIncidentEvent } from './incidentService.js';
import { sendWhatsAppAlert } from './whatsappService.js';

/**
 * Ralph Auto-Fix Service: Orchestration Layer
 * Executes the "Diagnose -> Fix -> Deploy" workflow safety protocol.
 */
export const triggerAutoFix = async (monitorId, errorMessage, htmlSample) => {
    try {
        const monitor = await Monitor.findById(monitorId);
        if (!monitor) return { step: "auto-fix", status: "failed", message: "Monitor not found" };

        // STACK RULE: MAX 1 auto-fix attempt per failure
        if (monitor.autoFixAttempted) {
            console.log(`[AUTO-FIX] Skipping: Fix already attempted for this failure cycle on ${monitor.name}.`);
            return { step: "auto-fix", status: "skipped", message: "Already attempted" };
        }

        const user = await User.findById(monitor.user).select('+github.accessToken');
        const token = user?.github?.accessToken;
        const { owner, repo, branch = 'main' } = monitor.githubRepo || {};

        if (!token || !owner || !repo) {
            console.error(`[AUTO-FIX] Missing GitHub credentials for ${monitor.name}`);
            return { step: "auto-fix", status: "failed", message: "Missing GitHub credentials" };
        }

        console.log(`[AUTO-FIX] 🛠️ Initiating Ralph Auto-Fix for ${monitor.name}...`);
        
        // 1. Mark as attempted (Immediate update to prevent race conditions)
        monitor.autoFixAttempted = true;
        monitor.lastFixStatus = 'PENDING';
        await monitor.save();

        // 1.1 Create Initial Healing Log
        const healingLog = await HealingLog.create({
            user: user._id,
            monitor: monitor._id,
            project: monitor.project,
            trigger: 'auto',
            outcome: 'in_progress',
            aiFix: { attempted: true, status: 'pending' }
        });

        // 2. Fetch Debugging Data (Commit Diff)
        const lastCommitSha = monitor.githubRepo.lastReleaseSha; // We track this during deployments
        
        let diff = '';
        if (lastCommitSha) {
            diff = await getCommitDiff(token, owner, repo, lastCommitSha);
            console.log(`[AUTO-FIX] Fetched recent commit diff (SHA: ${lastCommitSha.substring(0, 7)})`);
        } else {
            console.warn(`[AUTO-FIX] No lastReleaseSha found. AI will attempt fix without diff context.`);
        }

        // 3. AI Generation
        const aiResponse = await generateFix({
            error: errorMessage,
            html: htmlSample.substring(0, 2000), // STACK RULE: Limit input to 2000 chars
            diff: diff || "Diff not available"
        });

        // 4. AI-Level Static Validation (Confidence check)
        if (!aiFixValidator(aiResponse)) {
            console.error(`[AUTO-FIX] ❌ Static validation failed for ${monitor.name}. Skipping push.`);
            monitor.lastFixStatus = 'FAILED';
            await monitor.save();
            
            healingLog.aiFix.status = 'failed';
            healingLog.aiFix.message = 'AI Fix static validation (confidence) failed';
            healingLog.outcome = 'healing_failed';
            await healingLog.save();

            return { step: "auto-fix", status: "failed", message: "AI Fix static validation failed" };
        }

        // 4.1 Fetch Original Code for Visualization
        const path = guessFailingFilePath(errorMessage);
        const originalCode = await getFileContent(token, owner, repo, branch, path);

        // 5. GitHub Workflow (Branching + Pushing)
        const fixBranch = 'fix/ralph-auto-fix'; // STACK RULE: ALWAYS new branch
        const branchCreated = await createBranch(token, owner, repo, branch, fixBranch);
        
        if (!branchCreated) {
            monitor.lastFixStatus = 'FAILED';
            await monitor.save();
            return { step: "auto-fix", status: "failed", message: "GitHub branch creation failed" };
        }

        // Identify file to fix
        const commitMsg = `[Ralph Auto-Fix] Resolve issue: ${errorMessage.substring(0, 50)}`;

        const commitId = await pushCommit(token, owner, repo, fixBranch, path, aiResponse.fixedCode, commitMsg);

        if (commitId) {
            // Update Log with code specifics
            healingLog.aiFix.filePath = path;
            healingLog.aiFix.originalCode = originalCode;
            healingLog.aiFix.fixedCode = aiResponse.fixedCode;
            healingLog.aiFix.commitSha = commitId;
            healingLog.aiFix.status = 'success';
            await healingLog.save();
            await addIncidentEvent(monitor._id, 'AI_FIX_APPLIED', `Ralph Auto-Fix applied to branch ${fixBranch}. Commit hash: ${commitId.substring(0, 7)}`);
            console.log(`[AUTO-FIX] ✅ Fix pushed to ${fixBranch}. Initiating validation pipeline...`);

            // 6. VALIDATION PIPELINE (V4 Upgrade: Multi-Endpoint)
            // Mock preview URL logic: usually a Vercel/Netlify preview URL
            // For production validation, we verify both the Frontend and its Backend API
            const previewUrl = `https://${repo}-git-${fixBranch.replace('/', '-')}-${owner}.vercel.app`; 
            const backendUrl = monitor.apiUrl; // Get optional backend API from monitor
            
            const validation = await pipelineValidator({ 
                frontendUrl: previewUrl, 
                backendUrl: backendUrl, 
                monitor 
            });
            
            monitor.fixTestedAt = new Date();
            
            if (validation.success) {
                monitor.lastFixStatus = 'VALIDATED';
                monitor.fixValidated = true;
                await monitor.save();

                healingLog.outcome = 'suggestion_generated';
                healingLog.completedAt = new Date();
                await healingLog.save();

                await addIncidentEvent(monitor._id, 'AI_FIX_VALIDATED', `Validation pipeline PASSED. Fix is stable and safe for review.`);
                
                // Notify User
                const phone = user.integrations?.phone || user.phone;
                if (phone) {
                    const notifyMsg = `PULSEWATCH: FIX VALIDATED ✅\n\nRalph has generated and VALIDATED a fix for *${monitor.name}*.\n\nBranch: ${fixBranch}\nPreview: ${previewUrl}\n\nManual review required before merge.`;
                    await sendWhatsAppAlert(phone, notifyMsg);
                }

                return { 
                    step: "validation", 
                    status: "success", 
                    message: "Fix generated and validated in preview environment.",
                    previewUrl,
                    metrics: validation.metrics
                };
            } else {
                monitor.lastFixStatus = 'FAILED';
                monitor.fixValidated = false;
                await monitor.save();

                healingLog.outcome = 'healing_failed';
                healingLog.aiFix.message = `Validation failed: ${validation.reason}`;
                await healingLog.save();

                await addIncidentEvent(monitor._id, 'AI_FIX_FAILED', `Validation pipeline FAILED: ${validation.reason}`);
                
                return { 
                    step: "validation", 
                    status: "failed", 
                    message: `Validation failed: ${validation.reason}`,
                    metrics: validation.metrics
                };
            }
        } else {
            monitor.lastFixStatus = 'FAILED';
            await monitor.save();
            return { step: "auto-fix", status: "failed", message: "Failed to push commit" };
        }

    } catch (err) {
        console.error(`[AUTO-FIX] ❌ Critical Error: ${err.message}`);
        return { step: "auto-fix", status: "failed", message: err.message };
    }
};

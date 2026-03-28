import Monitor from '../models/Monitor.js';
import MonitorLog from '../models/MonitorLog.js';
import Deployment from '../models/Deployment.js';
import User from '../models/User.js';
import { addIncidentEvent } from './incidentService.js';
import { attemptRollback } from '../selfHealingService.js';
import { sendRalphDiagnosticAlert } from './alertService.js';

/**
 * Ralph Service: Autonomous AI Self-Healing Integration
 * Manages the lifecycle of the "Ralph Loop" (Diagnose -> RCA -> Remediation)
 */

export const triggerRalphLoop = async (monitorId, forceManual = false) => {
    try {
        const monitor = await Monitor.findById(monitorId);
        if (!monitor) return;

        // --- 🧊 AI COOLDOWN SYSTEM (V3) ---
        // Manual Commands (WhatsApp) BYPASS the cooldown.
        if (!forceManual) {
            const COOLDOWN = 10 * 60 * 1000; // 10 min
            const lastAttempt = monitor.lastRalphAnalysisAt || monitor.lastRollbackAt;
            
            if (lastAttempt && (Date.now() - new Date(lastAttempt).getTime() < COOLDOWN)) {
                console.log(`[RALPH] AI Cooldown in effect for ${monitor.name}. Site still failing, but skipping redundant RCA.`);
                return;
            }
        } else {
            console.log(`[RALPH] Manual Trigger (Override) for ${monitor.name}. Bypassing AI Cooldown.`);
        }

        // Immediately update to block redundancy & parallel loop race conditions
        monitor.lastRalphAnalysisAt = new Date();
        monitor.ralphStatus = 'ANALYZING';
        await monitor.save();

        // 2. Add to Incident Timeline
        await addIncidentEvent(monitor._id, 'RALPH_TRIGGERED', 'Ralph initiated self-healing via intelligent protocol. Analyzing root cause...');

        // 3. Diagnostic Ingestion
        const diagnostics = await collectDiagnostics(monitor._id);
        console.log(`[RALPH] Collected ${diagnostics.logs.length} log entries for RCA.`);

        // --- Log Creation (Phase 1) ---
        const { runRalphIntelligence } = await import('./ralphIntelligence.js');
        const intelligence = await runRalphIntelligence(monitor._id, diagnostics);
        
        const { default: HealingLog } = await import('../models/HealingLog.js');
        const healingLog = await HealingLog.create({
            user: monitor.user,
            monitor: monitor._id,
            project: monitor.project || "Default", 
            trigger: 'auto',
            analysis: {
                cause: intelligence.cause,
                impact: intelligence.impact,
                suggestion: intelligence.suggestion,
                aiAnalysis: intelligence.aiAnalysis,
                severity: intelligence.severity
            }
        });

        // --- RALPH INSIGHT INTEGRATION ---
        // Also create a Smart Insight so it shows up in the 'Monitor Details' sidebar
        const { default: Insight } = await import('../models/Insight.js');
        await Insight.create({
            monitor: monitor._id,
            user: monitor.user,
            type: 'ANOMALY',
            message: `[RALPH ANALYSIS] ${intelligence.cause}: ${intelligence.suggestion}`,
            severity: intelligence.severity,
            data: { analysis: intelligence }
        });

        if (intelligence) {
            console.log(`[RALPH-INTEL] Ralph Analysis: ${intelligence.cause}`);
            await addIncidentEvent(monitor._id, 'RALPH_INTELLIGENCE', `Analysis complete. Cause: ${intelligence.cause}. Suggestion: ${intelligence.suggestion}`);
        }

        // Daily Counter Reset check (Synchronize state)
        const lastRollback = monitor.lastRollbackAt ? new Date(monitor.lastRollbackAt) : null;
        const isNewDay = !lastRollback || lastRollback.toDateString() !== new Date().toDateString();
        const isFirstRollback = (monitor.rollbackTodayCount || 0) < 1 || isNewDay;

        const rca = {
            summary: intelligence?.cause || "System Anomaly",
            confidence: intelligence?.confidence || 0.5,
            remediation: intelligence?.remediation || "ROLLBACK", // Default to ROLLBACK if AI is unsure
            localization: null
        };

        // 5. Autonomic Remediation - (Feature 4.4)
        // If it's the 1st rollback of the day, we proceed RELIABLY even with low AI confidence.
        if (rca && (rca.confidence >= 0.7 || isFirstRollback)) {
            console.log(`[RALPH] Attempting remediation. Confidence: ${rca.confidence}. First of day: ${isFirstRollback}`);
            
            // Force ROLLBACK for the first silent trigger if AI didn't specify
            if (isFirstRollback && rca.remediation === 'MANUAL') {
                rca.remediation = 'ROLLBACK';
            }

            // Link remediation attempt to logging
            if (rca.remediation === 'ROLLBACK') {
                healingLog.rollback.attempted = true;
                await healingLog.save();
            }

            await executeRemediation(monitor._id, rca, healingLog._id);
        } else {
            healingLog.outcome = 'healing_failed'; // Low confidence & not first of day
            healingLog.completedAt = new Date();
            await healingLog.save();
            
            console.log(`[RALPH] Diagnosis confidence low (${rca?.confidence || 0}). Manual review required.`);
            await updateRalphStatus(monitor._id, 'IDLE', 'RCA completed with low confidence. Awaiting manual intervention.');
        }
        
    } catch (err) {
        console.error(`[RALPH-ERROR] Failed to trigger Ralph Loop: ${err.message}`);
        await updateRalphStatus(monitorId, 'IDLE', `Error in Ralph Loop: ${err.message}`);
    }
};

/**
 * Perform Root Cause Analysis
 * Communicates with Gemini to analyze logs and correlate with deployments.
 */
export const performRCA = async (monitorId, diagnostics) => {
    try {
        await updateRalphStatus(monitorId, 'ANALYZING', 'Analyzing diagnostic bundle with AI...');

        // Import incidentService dynamically to avoid circular dependencies if any
        const { analyzeIncidentWithRalph } = await import('./incidentService.js');
        
        const analysis = await analyzeIncidentWithRalph(monitorId, diagnostics);
        
        if (analysis) {
            await updateRalphStatus(monitorId, 'STABILIZING', `RCA Analysis Complete: ${analysis.summary.substring(0, 100)}...`);
            return analysis;
        }

        return null;
    } catch (err) {
        console.error(`[RALPH-RCA-ERROR] RCA failed: ${err.message}`);
        return null;
    }
};

/**
 * Autonomic Action Center
 * Executes the remediation strategy based on AI recommendation.
 */
export const executeRemediation = async (monitorId, rca, healingLogId = null) => {
    try {
        const monitor = await Monitor.findById(monitorId);
        if (!monitor) return;

        // --- 1-Auto-then-Approve Daily Policy (V3.2) ---
        // 1. Daily Counter Reset
        const now = new Date();
        const lastRollback = monitor.lastRollbackAt ? new Date(monitor.lastRollbackAt) : null;
        const isNewDay = !lastRollback || lastRollback.toDateString() !== now.toDateString();
        
        if (isNewDay && monitor.rollbackTodayCount > 0) {
            console.log(`[RALPH] Resetting daily rollback counter for ${monitor.name}.`);
            monitor.rollbackTodayCount = 0;
            // monitor.autoHealPaused = false; // Optional: Auto-resume on new day
        }

        const isFirstRollback = (monitor.rollbackTodayCount || 0) < 1;
        
        // 2. Evaluation Decision
        // Bypass all checks for manual commands (forceManual = true from WhatsApp 'APPROVE' or 'ROLLBACK')
        const needsAuthorization = !isFirstRollback && monitor.autoHealPaused;

        if (needsAuthorization) {
            console.log(`[RALPH] Limit (1/day) hit & Autopilot paused. Sending approval request for ${monitor.name}.`);
            
            // Send WhatsApp 'APPROVE' alert
            const user = await User.findById(monitor.user);
            const phone = user?.integrations?.phone || user?.phone;
            // WhatsApp 'APPROVE' alert disabled as per user request (Only alerts now)
            await addIncidentEvent(monitor._id, 'USER_APPROVAL_REQUIRED', `Auto rollback limit (1/day) reached. Manual authorization required (Dashboard).`);
            await updateRalphStatus(monitorId, 'IDLE', 'Awaiting manual authorization for additional rollback.');
            return;
        }

        // 3. Inform of status
        console.log(`[RALPH] Executing ${isFirstRollback ? 'AUTOMATIC 1ST-ROLLBACK' : 'AUTHORIZED ROLLBACK'} for ${monitor.name}.`);
        await updateRalphStatus(monitorId, 'REMEDIATING', `Ralph Autopilot: Executing ${rca.remediation} sequence (${isFirstRollback ? 'Silent Auto' : 'Authorized'}).`);

        if (rca.remediation === 'ROLLBACK') {
            const user = await User.findById(monitor.user).select('+github.accessToken');
            const token = user?.github?.accessToken;
            const { owner, repo, branch } = monitor.githubRepo || {};

            if (!token || !owner || !repo) {
                await updateRalphStatus(monitorId, 'IDLE', 'Rollback failed: Missing GitHub credentials.');
                return;
            }

            console.log(`[RALPH-ACTION] Ralph initiated self-healing via intelligent rollback protocol for ${owner}/${repo}`);
            const result = await attemptRollback(token, owner, repo, branch, monitor.url);

            if (healingLogId) {
                const HealingLog = (await import('../models/HealingLog.js')).default;
                const hLog = await HealingLog.findById(healingLogId);
                if (hLog) {
                    hLog.rollback.status = result.status === 'success' ? 'success' : 'failed';
                    hLog.rollback.message = result.message;
                    hLog.rollback.commitSha = result.commitSha;
                    hLog.outcome = result.status === 'success' ? 'healed_by_rollback' : 'healing_failed';
                    hLog.completedAt = new Date();
                    await hLog.save();
                }
            }

            if (result.status === 'success') {
                // Update Reliability Stats & Counters
                monitor.rollbackTodayCount = (monitor.rollbackTodayCount || 0) + 1;
                monitor.lastRollbackAt = new Date();
                await monitor.save();
                
                console.log(`[RALPH] Rollback Counter Incremented: ${monitor.rollbackTodayCount}/day for ${monitor.name}.`);
                
                await updateRalphStatus(monitorId, 'STABILIZING', `Self-healing successful! Service restored to stable commit ${result.commitSha.substring(0,7)}.`);
                await addIncidentEvent(monitor._id, 'RALPH_REMEDIATION_SUCCESS', `Ralph initiated self-healing via intelligent rollback protocol. Outage neutralized.`);
            }
 else {
                await updateRalphStatus(monitorId, 'IDLE', `Rollback failed: ${result.message}`);
                await addIncidentEvent(monitor._id, 'RALPH_REMEDIATION_FAILED', `Ralph attempted rollback but encountered an error: ${result.message}`);
            }
        }
 else if (rca.remediation === 'HOTFIX') {
            const loc = rca.localization;
            const fixMsg = loc 
                ? `Ralph suggests a fix in ${loc.file} (lines ${loc.lines}): ${loc.fixSuggestion}`
                : 'Ralph recommended a HOTFIX. Manual code review of the poison commit is required.';
            
            await updateRalphStatus(monitorId, 'IDLE', 'HOTFIX recommended. Ralph has drafted a fix strategy.');
            await addIncidentEvent(monitor._id, 'RALPH_ADVISORY', fixMsg);
        } else {
            await updateRalphStatus(monitorId, 'IDLE', 'Manual intervention required as per AI recommendation.');
        }

    } catch (err) {
        console.error(`[RALPH-REMEDIATION-ERROR] ${err.message}`);
        await updateRalphStatus(monitorId, 'IDLE', `Remediation Error: ${err.message}`);
    }
};

/**
 * Update Ralph Status
 * Helper to transition through Loop states (ANALYZING, REMEDIATING, STABILIZING, IDLE)
 */
export const updateRalphStatus = async (monitorId, status, message) => {
    try {
        const monitor = await Monitor.findById(monitorId);
        if (!monitor) return;

        monitor.ralphStatus = status;
        await monitor.save();

        if (message) {
            await addIncidentEvent(monitor._id, 'RALPH_UPDATE', message);
        }
        
        console.log(`[RALPH] 状态更新: ${status} - ${message || 'No message'}`);
    } catch (err) {
        console.error(`[RALPH-ERROR] Failed to update Ralph status: ${err.message}`);
    }
};

/**
 * Collect Diagnostics
 * Pulls the last 50 lines of logs and the failing HTTP response body.
 */
export const collectDiagnostics = async (monitorId) => {
    try {
        const logs = await MonitorLog.find({ monitor: monitorId })
            .sort({ checkedAt: -1 })
            .limit(50);
        
        const lastFailure = logs.find(l => l.status === 'DOWN');

        // Get deployments from the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const deployments = await Deployment.find({
            monitor: monitorId,
            createdAt: { $gte: oneHourAgo }
        }).sort({ createdAt: -1 });
        
        return {
            logs: logs.map(l => ({
                time: l.checkedAt,
                status: l.status,
                code: l.statusCode,
                error: l.errorMessage,
                responseTime: l.responseTime
            })),
            lastFailure: lastFailure ? {
                body: lastFailure.responseBody,
                code: lastFailure.statusCode,
                error: lastFailure.errorMessage
            } : null,
            deployments: deployments.map(d => ({
                sha: d.commitSha,
                message: d.message || d.commitMessage,
                time: d.createdAt,
                status: d.status
            }))
        };
    } catch (err) {
        console.error(`[RALPH-ERROR] Diagnostic collection failed: ${err.message}`);
        return { logs: [], lastFailure: null, deployments: [] };
    }
};

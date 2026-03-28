import express from 'express';
import crypto from 'crypto';
import Monitor from '../models/Monitor.js';
import Deployment from '../models/Deployment.js';
import { checkSingleMonitor } from '../services/monitorService.js';
import { sendDiscordAlert } from '../services/alertService.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Section 3: GitHub Webhook Receiver
 * Handles Push & Deployment Status events.
 */
router.post('/github', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    
    try {
        const bodyStr = req.body.toString();
        if (!bodyStr) {
            console.error('[GIT-WEBHOOK] Empty body received');
            return res.status(400).send('Empty body');
        }

        const body = JSON.parse(bodyStr);
        const repoFullName = body.repository?.full_name;
        
        console.log(`[GIT-WEBHOOK] Event: ${event} for ${repoFullName}`);

        if (!repoFullName) {
            console.warn('[GIT-WEBHOOK] Missing repository name in payload');
            return res.sendStatus(400);
        }

        const [owner, repoName] = repoFullName.split('/');
        
        // 1. Identify linked monitors
        const monitors = await Monitor.find({ 
            'githubRepo.owner': owner, 
            'githubRepo.repo': repoName 
        });

        if (monitors.length === 0) {
            console.log(`[GIT-WEBHOOK] No monitors linked to ${repoFullName}.`);
            return res.sendStatus(200);
        }

        // 2. Handle Events for each monitor
        for (const monitor of monitors) {
            
            // Push Event: New Commit Details (Section 3)
            if (event === 'push') {
                const branch = body.ref?.split('/').pop();
                const latestCommit = body.after;
                const commitMessage = body.head_commit?.message;

                console.log(`[GIT-WEBHOOK] Processing PUSH for ${monitor.name} on ${branch}`);

                if (branch === monitor.githubRepo.branch) {
                    monitor.githubRepo.lastReleaseSha = latestCommit;
                    monitor.githubRepo.lastReleaseAt = new Date();
                    
                    // PRO: Update deployment tracking for self-healing
                    monitor.lastDeploymentAt = new Date();
                    monitor.rollbackTodayCount = 0; // Reset for new release
                    
                    await monitor.save();

                    // Store commit history
                    await Deployment.create({
                        monitor: monitor._id,
                        repo: repoFullName,
                        branch: branch,
                        commitSha: latestCommit || 'unknown',
                        commitMessage: commitMessage || 'No message',
                        status: 'PENDING'
                    });
                    console.log(`[GIT-WEBHOOK] Saved Deployment record (PENDING) for ${monitor.name}`);
                }
            }

            // Deployment Status Event (Section 3)
            if (event === 'deployment_status') {
                const { state, target_url, description } = body.deployment_status;
                const commitSha = body.deployment.sha;

                console.log(`[GIT-WEBHOOK] Deployment status update: ${state} for ${monitor.name}`);

                const deployment = await Deployment.findOne({ commitSha: commitSha, monitor: monitor._id });
                
                if (deployment) {
                    deployment.status = (state === 'success') ? 'SUCCESS' : 
                                      (state === 'failure' || state === 'error' ? 'FAIL' : 'PENDING');
                    deployment.deployUrl = target_url;
                    deployment.finishedAt = new Date();
                    
                    if (state === 'success') {
                        const healthStatusType = await checkSingleMonitor(monitor);
                        deployment.healthStatus = (healthStatusType === 'UP' || healthStatusType === 'online') ? 'OK' : 'FAIL';
                        
                        if (deployment.healthStatus === 'FAIL') {
                            deployment.status = 'FAIL'; // Re-flag as failed due to health check
                            deployment.impact.push({
                                monitor: monitor._id,
                                status: 'DOWN',
                                detectedAt: new Date()
                            });
                            
                            const user = await User.findById(monitor.user);
                            if (user) await sendDiscordAlert(user, monitor, 'DOWN_AFTER_DEPLOY');
                        }
                    }

                    await deployment.save();
                    console.log(`[GIT-WEBHOOK] Updated Deployment record to ${state} for ${monitor.name}`);
                }
            }
        }
        res.sendStatus(200);
    } catch (err) {
        console.error(`[GIT-WEBHOOK-ERROR] CRASH: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

export default router;

import Incident from '../models/Incident.js';
import Deployment from '../models/Deployment.js';
import User from '../models/User.js';
import Monitor from '../models/Monitor.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Incident Operations Service
 * Managed the lifecycle of active monitor outages
 */

export const getOrCreateActiveIncident = async (monitorId, userId, initialSeverity = 'LOW') => {
    let incident = await Incident.findOne({ monitor: monitorId, status: 'OPEN' });

    if (!incident) {
        incident = await Incident.create({
            monitor: monitorId,
            user: userId,
            status: 'OPEN',
            severity: initialSeverity,
            startedAt: new Date(),
            timeline: [{
                type: 'DOWN_DETECTED',
                message: `Monitor reported DOWN status. Initializing incident with ${initialSeverity} severity.`,
                timestamp: new Date()
            }]
        });
        console.log(`[INCIDENT] New incident opened for monitor: ${monitorId} (Severity: ${initialSeverity})`);

        // --- NEW: Deployment Correlation ---
        try {
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
            const recentDeploy = await Deployment.findOne({
                monitor: monitorId,
                createdAt: { $gte: tenMinsAgo },
                status: 'SUCCESS' // Or pending
            }).sort({ createdAt: -1 });

            if (recentDeploy) {
                console.log(`[INCIDENT-IMPACT] Correlation found! Deployment ${recentDeploy.commitSha.slice(0,7)} likely caused this outage.`);
                
                // Update Deployment Impact
                recentDeploy.impact.push({
                    monitor: monitorId,
                    status: 'DOWN',
                    detectedAt: new Date()
                });
                recentDeploy.status = 'FAIL'; // Flag the deployment as problematic
                await recentDeploy.save();

                // Link Incident to Deployment
                incident.deployment = recentDeploy._id;

                // Add to Incident Timeline
                incident.timeline.push({
                    type: 'DEPLOYMENT_IMPACT',
                    message: `Initial failure correlated with recent deployment of commit ${recentDeploy.commitSha.slice(0,7)}.`,
                    timestamp: new Date()
                });
                await incident.save();
            }
        } catch (err) {
            console.error(`[INCIDENT-CORRELATION] Failed: ${err.message}`);
        }
    }

    return incident;
};

export const updateIncidentSeverity = async (monitorId, newSeverity) => {
    try {
        const incident = await Incident.findOne({ monitor: monitorId, status: 'OPEN' });
        if (!incident) return null;

        const severityMap = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
        const currentRank = severityMap[incident.severity] || 0;
        const newRank = severityMap[newSeverity] || 0;

        if (newRank > currentRank) {
            incident.severity = newSeverity;
            incident.timeline.push({
                type: 'RALPH_UPDATE',
                message: `Incident escalated to ${newSeverity} severity.`,
                timestamp: new Date()
            });
            await incident.save();
            console.log(`[INCIDENT] Escalated to ${newSeverity} for monitor: ${monitorId}`);
        }
        return incident;
    } catch (err) {
        console.error(`[INCIDENT-ERROR] Failed to update severity: ${err.message}`);
        return null;
    }
};

export const addIncidentEvent = async (monitorId, type, message) => {
    try {
        const incident = await Incident.findOne({ monitor: monitorId, status: 'OPEN' });
        if (!incident) return null;

        incident.timeline.push({
            type,
            message,
            timestamp: new Date()
        });

        await incident.save();
        return incident;
    } catch (err) {
        console.error(`[INCIDENT-ERROR] Failed to add event: ${err.message}`);
        return null;
    }
};

export const resolveIncident = async (monitorId) => {
    try {
        const incident = await Incident.findOne({ monitor: monitorId, status: 'OPEN' });
        if (!incident) return null;

        incident.status = 'RESOLVED';
        incident.resolvedAt = new Date();
        incident.timeline.push({
            type: 'RECOVERED',
            message: 'Monitor returned to UP status. Incident auto-resolved.',
            timestamp: new Date()
        });

        // --- New: Generate AI RCA ---
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            
            const eventSummary = incident.timeline.map(e => `[${e.timestamp.toISOString()}] ${e.type}: ${e.message}`).join('\n');
            const prompt = `
                Perform a brief Root Cause Analysis (RCA) for a monitoring incident.
                TIMELINE OF EVENTS:
                ${eventSummary}
                
                Identify:
                1. Why it went down (brief)
                2. How it was eventually fixed
                Limit to 2-3 impact-driven sentences for a DevOps dashboard.
            `;
            const result = await model.generateContent(prompt);
            incident.aiRca = result.response.text().trim();
        } catch (aiErr) {
            console.warn(`[INCIDENT-AI] RCA failed: ${aiErr.message}`);
        }

        // --- New: Heuristic Fallback if AI fails ---
        if (!incident.aiRca) {
            const hasHealing = incident.timeline.some(e => e.type.includes('HEALING') || e.type.includes('ROLLBACK'));
            incident.aiRca = hasHealing 
                ? "Incident resolved via automated recovery interventions (Self-healing/Rollback) after confirmed service disruption."
                : "Incident auto-resolved after service returned to stable state. Monitoring confirmed restoration.";
        }

        await incident.save();
        console.log(`[INCIDENT] Incident resolved for monitor: ${monitorId}`);
        return incident;
    } catch (err) {
        console.error(`[INCIDENT-ERROR] Failed to resolve incident: ${err.message}`);
        return null;
    }
};

/**
 * Send an alert with deduplication logic
 */
export const sendIncidentAlert = async (monitorId, alertData) => {
    try {
        const incident = await Incident.findOne({ monitor: monitorId, status: 'OPEN' });
        if (!incident) return false;

        if (incident.alertSent) {
            console.log(`[ALERT] 🛡️ Deduplication: Alert already sent for active incident on ${monitorId}.`);
            return true;
        }

        // --- MOCK ALERT LOGIC (Replace with real logic like Discord/Email) ---
        console.log(`[ALERT] 🚨 CRITICAL: Sending alert for ${monitorId}...`);
        
        incident.alertSent = true;
        incident.timeline.push({
            type: 'ALERT_SENT',
            message: `External alert dispatched to configured channels.`,
            timestamp: new Date()
        });
        
        await incident.save();
        return true;
    } catch (err) {
        console.error(`[ALERT-ERROR] Failed to send alert: ${err.message}`);
        return false;
    }
};

export const getMonitorIncidents = async (monitorId) => {
    return await Incident.find({ monitor: monitorId }).sort({ startedAt: -1 }).limit(10);
};

export const getProjectIncidents = async (projectId) => {
    try {
        const monitors = await Monitor.find({ project: projectId });
        const monitorIds = monitors.map(m => m._id);
        return await Incident.find({ monitor: { $in: monitorIds } })
            .populate('monitor')
            .sort({ startedAt: -1 })
            .limit(20);
    } catch (err) {
        console.error(`[INCIDENT-ERROR] Failed to fetch project incidents: ${err.message}`);
        return [];
    }
};


/**
 * Ralph AI Analysis: Root Cause Analysis
 * Uses Gemini to examine logs, errors, and deployments to find the "Poison" commit.
 */
export const analyzeIncidentWithRalph = async (monitorId, bundle) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const { logs, lastFailure, deployments } = bundle;

        const logContext = logs.slice(0, 50).map(l => 
            `[${l.time}] ${l.status} (${l.code}) - ${l.error || 'No error message'}`
        ).join('\n');

        const deployContext = deployments.length > 0 
            ? deployments.map(d => `[${d.time}] Commit: ${d.sha.substring(0,7)} - ${d.message} (Status: ${d.status})`).join('\n')
            : 'No recent deployments found.';

        const prompt = `
            You are "Ralph," an autonomous Site Reliability Engineer.
            Analyze the following diagnostic bundle for a service outage.
            
            DIAGNOSTIC BUNDLE:
            - FAILURE DATA: ${JSON.stringify(lastFailure)}
            - RECENT LOGS (last 50):
            ${logContext}
            - RECENT DEPLOYMENTS:
            ${deployContext}
            
            TASK:
            1. Identify the most likely Root Cause (is it a bug, infra, timeout, etc?).
            2. Correlate with a deployment if applicable. Identify the specific "Poison" commit.
            3. Provide a confidence score (0.0 to 1.0).
            4. Suggest a remediation type: ROLLBACK, HOTFIX, or MANUAL.
            
            FORMAT YOUR RESPONSE AS JSON:
            {
                "summary": "Brief explanation of the root cause",
                "rootCause": "BUG | INFRA | DATA",
                "poisonCommit": "SHA_HERE or null",
                "confidence": 0.XX,
                "remediation": "ROLLBACK | HOTFIX | MANUAL",
                "explanation": "Detailed technical reasoning"
            }
        `;

        console.log(`[RALPH-AI] Sending diagnostic bundle to Gemini for analysis...`);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean up markdown markers if Gemini adds them
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        // --- Code Localization Add-on ---
        // If we found a poison commit, add it to the incident metadata
        const incident = await Incident.findOne({ monitor: monitorId, status: 'OPEN' }).populate('monitor');
        if (incident) {
            incident.timeline.push({
                type: 'RALPH_ANALYSIS',
                message: `Ralph Analysis: ${analysis.summary} (Confidence: ${Math.round(analysis.confidence * 100)}%). Core recommendation: ${analysis.remediation}.`,
                timestamp: new Date()
            });
            
            // Save analysis results for the UI
            incident.aiRca = analysis.explanation;

            // If a poison commit is found and confidence is high, perform localization
            if (analysis.poisonCommit && analysis.poisonCommit !== 'null' && analysis.confidence > 0.6) {
                console.log(`[RALPH-LOCALIZER] Attempting to localize poison lines for commit ${analysis.poisonCommit.substring(0,7)}`);
                const localization = await localizePoisonLines(monitorId, analysis.poisonCommit, bundle.lastFailure);
                if (localization) {
                    analysis.localization = localization;
                    incident.timeline.push({
                        type: 'RALPH_LOCALIZATION',
                        message: `Ralph Localizer: Identified potential fault in ${localization.file} at lines ${localization.lines}. Reason: ${localization.reason}`,
                        timestamp: new Date()
                    });
                }
            }

            await incident.save();
        }

        return analysis;
    } catch (err) {
        console.error(`[RALPH-ANALYSIS-ERROR] Failed: ${err.message}`);
        return {
            summary: "AI Analysis failed due to technical error.",
            confidence: 0,
            remediation: "MANUAL"
        };
    }
};

/**
 * Code Localizer: Pinpoint the exact lines causing the failure
 * Fetches the diff from GitHub and uses Gemini to find the "Poison" lines.
 */
export const localizePoisonLines = async (monitorId, commitSha, lastFailure) => {
    try {
        const monitor = await Monitor.findById(monitorId);
        if (!monitor || !monitor.githubRepo?.owner || !monitor.githubRepo?.repo) {
            console.warn(`[RALPH-LOCALIZER] Monitor or GitHub repo missing for monitor ${monitorId}`);
            return null;
        }

        const user = await User.findById(monitor.user).select('+github.accessToken');
        if (!user || !user.github?.accessToken) {
            console.warn(`[RALPH-LOCALIZER] GitHub access token missing for user ${monitor.user}`);
            return null;
        }

        const { owner, repo } = monitor.githubRepo;
        console.log(`[RALPH-LOCALIZER] 🔍 Probing diff for ${owner}/${repo} at ${commitSha.substring(0,7)}`);

        // Fetch the commit details (including files and patches)
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}`, {
            headers: {
                Authorization: `Bearer ${user.github.accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        const files = response.data.files;
        if (!files || files.length === 0) {
            console.log(`[RALPH-LOCALIZER] No files found in commit ${commitSha}`);
            return null;
        }

        // Prepare context for Gemini: only relevant file changes (first few files if many)
        // Focus on .js, .ts, .py etc. files
        const relevantFiles = files.filter(f => !f.filename.match(/\.(md|txt|json|yml|yaml|png|jpg|jpeg|gif|svg)$/i));
        const filesToAnalyze = relevantFiles.length > 0 ? relevantFiles : files;
        const diffContext = filesToAnalyze.slice(0, 3).map(f => `FILE: ${f.filename}\nPATCH:\n${f.patch}`).join('\n\n');

        if (!diffContext) {
             console.log(`[RALPH-LOCALIZER] No diff content to analyze for ${commitSha}`);
             return null;
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `
            You are "Ralph," an autonomous Site Reliability Engineer specializing in code localization.
            You have identified commit ${commitSha} as the likely "Poison" commit causing a service outage.
            
            FAILURE DATA (HTTP Response/Error):
            ${JSON.stringify(lastFailure)}
            
            DIFF DATA FOR COMMIT ${commitSha}:
            ${diffContext}
            
            TASK:
            1. Analyze the diff and correlate it with the failure data (e.g. status code, error message).
            2. Identify the specific file and line range(s) that most likely introduced the bug.
            3. Provide a brief technical reason for the fault.
            4. Suggest a specific code fix (the actual line change if possible).
            
            FORMAT YOUR RESPONSE AS VALID JSON ONLY:
            {
                "file": "path/to/problematic_file.js",
                "lines": "12-25",
                "reason": "Brief technical explanation of the fault",
                "fixSuggestion": "Provide the exact code change or specific instruction to fix it."
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        
        try {
            const localization = JSON.parse(cleanJson);
            console.log(`[RALPH-LOCALIZER] Localization complete for ${localization.file}`);
            return localization;
        } catch (parseErr) {
            console.error(`[RALPH-LOCALIZER-JSON-ERROR] Failed to parse Gemini response: ${responseText}`);
            return null;
        }

    } catch (err) {
        console.error(`[RALPH-LOCALIZER-ERROR] Failed to localize: ${err.message}`);
        return null;
    }
};

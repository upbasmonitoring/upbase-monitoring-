import Monitor from '../models/Monitor.js';
import Deployment from '../models/Deployment.js';
import MonitorLog from '../models/MonitorLog.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini Deep Analysis Engine
 * Uses AI to provide technical insights and solutions.
 */
const getGeminiDeepAnalysis = async (diagnostics) => {
    try {
        if (!process.env.GEMINI_API_KEY) return "AI Analysis Unavailable: No API Key provided.";

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const { logs, lastFailure } = diagnostics;
        const logContext = logs.slice(0, 10).map(l => `[${l.checkedAt}] ${l.status}: ${l.errorMessage}`).join('\n');

        const prompt = `
            You are "Ralph Intelligence", a Senior Site Reliability Engineer.
            Analyze this website failure telemetry:
            
            URL: ${diagnostics.url}
            LAST ERROR: ${lastFailure?.errorMessage}
            HTTP CODE: ${lastFailure?.code}
            RECENT LOGS:
            ${logContext}

            Provide a technical Root Cause Analysis (RCA) and a specific actionable solution.
            Keep it professional, high-tech, and under 100 words.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error(`[GEMINI-ERROR] ${err.message}`);
        return "Deep Analysis failed: AI network timeout.";
    }
};

/**
 * Ralph Intelligence (Hybrid Engine: Rule-Based + Gemini AI)
 * Determines the cause, impact, and suggestion for a failure.
 */
export const runRalphIntelligence = async (monitorId, diagnostics) => {
    try {
        const monitor = await Monitor.findById(monitorId);
        const { logs, lastFailure, deployments } = diagnostics;

        // --- PHASE 1: RULE-BASED FAST ANALYSIS ---
        let res = {
            cause: "Unknown Internal Error",
            impact: "Service unavailable for users.",
            suggestion: "Contact support or check logs.",
            aiAnalysis: "Analysing...", 
            severity: "HIGH",
            confidence: 0.5,
            reremediation: "MANUAL"
        };

        const now = Date.now();
        const lastDeploy = deployments && deployments.length > 0 ? deployments[0] : null;
        const deployTimeStr = lastDeploy ? new Date(lastDeploy.time).getTime() : 0;
        const timeSinceDeploy = (now - deployTimeStr) / (1000 * 60); // minutes

        if (lastFailure && (lastFailure.error?.includes('SENTINEL_IQ') || lastFailure.errorMessage?.includes('SENTINEL_IQ'))) {
            console.log(`[RALPH-INTEL] Ghost-200 (Sentinel IQ) detected. Responding with Rule-Based ROLLBACK.`);
            res.cause = "Stealth Failure Detected (Ghost-200)";
            res.impact = "Page content is broken or shows errors despite 200 OK status.";
            res.suggestion = "Rollback to the last confirmed stable version.";
            res.severity = "CRITICAL";
            res.confidence = 0.92;
            res.reremediation = "ROLLBACK";
        } else if (lastDeploy && timeSinceDeploy <= 45) { // Increased window from 15 to 45 mins
            res.cause = `Recent Deployment (${lastDeploy.sha?.substring(0, 7) || 'Unknown'})`;
            res.impact = "New code changes likely broke the application logic.";
            res.suggestion = "Perform an immediate rollback to restore service.";
            res.severity = "CRITICAL";
            res.confidence = 0.95;
            res.reremediation = "ROLLBACK";
        } else if (lastFailure && lastFailure.code >= 500) {
            res.cause = `Server Crash (HTTP ${lastFailure.code})`;
            res.impact = "The application server is returning fatal errors.";
            res.suggestion = "Restart the process and verify deployment health.";
            res.severity = "HIGH";
            res.confidence = 0.85;
            res.reremediation = "RESTART";
        } else if (lastFailure && (lastFailure.code === 401 || lastFailure.code === 403)) {
            res.cause = "Access Restriction / Auth Fail";
            res.impact = "Security protocols are blocking the monitor pulse.";
            res.suggestion = "Check credentials and firewall rules.";
            res.severity = "MEDIUM";
            res.confidence = 0.9;
            res.reremediation = "MANUAL";
        }

        // --- PHASE 2: GEMINI DEEP ANALYSIS (Parallel Processing) ---
        // Enhanced error identification and solution
        res.aiAnalysis = await getGeminiDeepAnalysis(diagnostics);

        return res;
    } catch (err) {
        console.error(`[RALPH-INTEL-ERROR] ${err.message}`);
        return null;
    }
};

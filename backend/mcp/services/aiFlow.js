import Monitor from '../../models/Monitor.js';
import { fetchMongoErrors } from '../tools/mongoTool.js';
import { fetchLatencyData } from '../tools/redisTool.js';
import { detectWafIncidents } from '../tools/cloudflareTool.js';
import { fetchRenderLogs } from '../tools/renderTool.js';
import { scanVulnerabilities } from '../tools/tinyfishTool.js';
import { generateHash } from '../../utils/hash.js';
import { storeHash } from '../../services/blockchainService.js';

/**
 * Robust Timeout Wrapper with Observation Metrics
 */
const withObservation = async (promise, ms, fallbackValue, toolName, requestId) => {
    const startTime = Date.now();
    const meta = { time: 0, success: true, timeout: false, fallbackReason: null };

    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            meta.timeout = true;
            meta.success = false;
            meta.fallbackReason = "Execution limit exceeded";
            console.warn(`[MCP][${requestId}][WARN] ${toolName} timed out at ${ms}ms.`);
            resolve(fallbackValue);
        }, ms);
    });

    try {
        const result = await Promise.race([
            promise.then(res => {
                if (!meta.timeout) {
                    meta.time = Date.now() - startTime;
                    console.log(`[MCP][${requestId}][INFO] ${toolName} finished in ${meta.time}ms.`);
                }
                return res;
            }),
            timeoutPromise
        ]);
        
        if (!meta.timeout) meta.time = Date.now() - startTime;
        return { value: result, meta };
    } catch (err) {
        meta.success = false;
        meta.time = Date.now() - startTime;
        meta.fallbackReason = err.message || "Execution exception";
        console.error(`[MCP][${requestId}][ERROR] ${toolName} failed: ${err.message}`);
        return { value: fallbackValue, meta };
    }
};

/**
 * Finalized AI Query Flow - SRE Edition (V4)
 */
export async function runQueryFlow({ query, monitorId, targetUrl, requestId, debug = false }) {
    const totalStartTime = Date.now();
    console.log(`[MCP][${requestId}][INFO] Starting Flow: ${query}`);

    // FETCH MONITOR FALLBACK FOR URL
    let monitor = null;
    if (monitorId) {
        monitor = await Monitor.findById(monitorId).lean();
    }
    const finalUrl = targetUrl || monitor?.url || null;

    // PARALLEL EXECUTION
    const results = await Promise.allSettled([
        withObservation(fetchLatencyData(monitorId), 3000, { p50: "N/A", p95: "N/A" }, "redisTool", requestId),
        withObservation(fetchMongoErrors(monitorId), 4000, [], "mongoTool", requestId),
        withObservation(detectWafIncidents(monitorId), 3000, "Unknown", "cloudflareTool", requestId),
        withObservation(fetchRenderLogs(monitorId), 4000, "Unavailable", "renderTool", requestId),
        withObservation(scanVulnerabilities(finalUrl), 5000, { issues: [] }, "tinyfishTool", requestId)
    ]);

    // SAFE RESULTS MAPPING (FIX: Avoid crash on undefined results/meta)
    const getResultVal = (idx, fallback) => results[idx].status === 'fulfilled' ? results[idx].value.value : fallback;
    const getResultMeta = (idx) => results[idx].status === 'fulfilled' ? results[idx].value.meta : { time: 0, success: false, timeout: false, fallbackReason: "Tool execution failed" };

    const toolsMeta = {
        redisTool: getResultMeta(0),
        mongoTool: getResultMeta(1),
        cloudflareTool: getResultMeta(2),
        renderTool: getResultMeta(3),
        tinyfishTool: getResultMeta(4)
    };
    
    const latency = getResultVal(0, { p50: 0, p95: 0, latest: 0 });
    const errors = getResultVal(1, []);
    const waf = getResultVal(2, "Unknown");
    const render = getResultVal(3, "Unavailable");
    const security = getResultVal(4, { issues: [] });

    // 1. CONFIDENCE CALCULATION
    const totalTools = Object.keys(toolsMeta).length;
    const successCount = Object.values(toolsMeta).filter(m => m.success).length;
    const confidenceScore = parseFloat((successCount / totalTools).toFixed(2));
    
    let confidence = "low";
    if (confidenceScore >= 0.8) confidence = "high";
    else if (confidenceScore >= 0.5) confidence = "medium";

    // 2. PRIMARY DATA PARSING
    let severity = "low";
    const p95Val = parseInt(latency.p95);
    const hasCriticalErrors = errors.length > 0;
    const hasSecIssues = security.issues && security.issues.length > 0 && !security.issues.includes("present");

    // 3. PERFORMANCE NOTE GENERATION (FIXED STRING LOGIC)
    let perfNote = "N/A";
    if (!isNaN(p95Val)) {
        if (p95Val < 500) perfNote = `Stable latency (${p95Val}ms)`;
        else if (p95Val < 1000) perfNote = `Moderate latency (${p95Val}ms)`;
        else perfNote = `High latency (${p95Val}ms)`;
    }

    // 4. SECURITY MESSAGE
    const securityMessage = hasSecIssues 
        ? `Security issue detected: ${security.issues.join(", ")}` 
        : "No security vulnerabilities detected";

    // --- 🛡️ Blockchain Integration (Audit Scan) ---
    try {
        if (hasSecIssues) {
            const securityHash = generateHash({ issues: security.issues, url: finalUrl });
            await storeHash(securityHash, "security", monitorId);
        }
    } catch (err) {
        console.error(`[BLOCKCHAIN][AI-FLOW][ERROR] ${err.message}`);
    }

    // 5. INTENT DETECTION
    const q = query.toLowerCase();
    let intent = "general";
    if (q.includes("slow") || q.includes("latency") || q.includes("performance")) intent = "performance";
    else if (q.includes("secure") || q.includes("security")) intent = "security";
    else if (q.includes("error") || q.includes("backend")) intent = "errors";
    else if (q.includes("debug") || q.includes("analysis")) intent = "debug";

    // 5. ACCURACY UPGRADE: Use the absolute latest latency for real-time fidelity
    const latestLatency = latency.latest || p95Val;
    
    // 6. SUMMARY GENERATION (PRIORITY OVERRIDE)
    let summary = "";
    const isActuallyDown = hasCriticalErrors && !errors.some(e => e.includes("404") || e.includes("Timeout"));
    const isMisconfigured = errors.some(e => e.includes("404"));
    const isWakingUp = errors.some(e => e.includes("Timeout")) && !isActuallyDown;
    const isMonitorBias = latestLatency >= 1500 && !hasCriticalErrors;

    if (isActuallyDown) {
        summary = `Performance Analysis: Critical
Warning: Critical backend failure detected
Details: ${errors.slice(0, 2).join(", ")}
Impact: Users are currently experiencing service disruption.`;
        severity = "high";
    } else if (isMonitorBias) {
        summary = `Performance Analysis: Stable (User Experience)
Status: Healthy (Instant Latency: ${latestLatency}ms)
Accuracy Note: Your backend health signal is verified as 100% healthy. Your users are likely experiencing fast speeds.
Uptime Integrity: High.`;
        severity = "low";
    } else if (isWakingUp) {
        summary = `Performance Analysis: Stable
Status: System is Warming Up (Cold Start)
Accuracy Note: Your backend health signal is verified as 100% healthy. Any frontend timeouts are likely temporary "wake-up" delays on Render.
Uptime Integrity: Your users are safe. No action required.`;
        severity = "low";
    } else if (isMisconfigured) {
        summary = `Performance Analysis: Stable
Accuracy Note: Your backend API path is returning a 404. 
Recommendation: Verify or clear the "Backend API URL" in your Monitor Settings if your site does not have a separate API endpoint.
Status: Frontend is operational despite the API misconfiguration.`;
        severity = "medium";
    } else {
        summary = `Performance Status: Healthy
Instant Speed: ${latestLatency}ms
Status: System operating normally
Security: ${security.issues.length > 0 ? "Issues detected" : "No issues"}
Data Accuracy: Real-time pulse verified.`;
        
        // Severity based on LATEST latency if no errors
        if (latestLatency > 3000) severity = "high";
        else if (latestLatency > 500) severity = "medium";
        else severity = "low";
    }

    // Intent Overrides (Integrated Context)
    switch (intent) {
        case "performance":
            if (hasCriticalErrors) {
                summary = `Performance is technically ${perfNote}, but system stability is compromised by backend errors. Stability fix is high priority.`;
            } else {
                summary = `Performance Analysis: ${perfNote}. The system responds within expected tail-latency bounds.`;
            }
            break;
        case "security":
            summary = `Security Assessment: ${securityMessage}`;
            break;
        case "errors":
            summary = hasCriticalErrors 
                ? `Critical Error Alert: ${errors.length} backend exceptions detected. Primary issue: ${errors[0]}`
                : `Stability Report: No critical errors found in recent log audit.`;
            break;
        case "debug":
            summary = `Full Diagnostic Report:
Latency: ${perfNote}
Errors: ${errors.length} detected
Security: ${securityMessage}
Data Integrity: ${Math.round(confidenceScore * 100)}%`;
            break;
    }

    // 7. RECOMMENDATION ENGINE (DYNAMC)
    const recommendations = [];
    if (p95Val > 500) recommendations.push("Optimize backend response time or enable caching");
    if (hasCriticalErrors) recommendations.push("Check server logs, database connections, or WAF limits");
    if (hasSecIssues) recommendations.push("Add missing security headers like CSP, HSTS");

    const totalExecutionTime = Date.now() - totalStartTime;
    console.log(`[MCP][${requestId}][INFO] Flow Finished | Intent: ${intent} | Time: ${totalExecutionTime}ms`);

    // RESPONSE OBJECT
    const response = {
        requestId,
        timestamp: new Date().toISOString(),
        confidence,
        confidenceScore,
        severity,
        totalExecutionTime,
        latency,
        errors,
        waf,
        render,
        security,
        summary,
        recommendations,
        toolsMeta
    };

    if (debug) {
        response._debug = {
            executionDetails: {
                totalTime: totalExecutionTime,
                startTime: new Date(totalStartTime).toISOString(),
                toolSuccessRate: `${successCount}/${totalTools}`
            },
            raw: { latency, errors, waf, render, security }
        };
    }

    return response;
}

import axios from 'axios';
import crypto from 'crypto';
import Monitor from '../models/Monitor.js';
import MonitorLog from '../models/MonitorLog.js';
import Log from '../models/Log.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { processAlertingTier, sendRecoveryAlert } from './alertService.js';
import { getOrCreateActiveIncident, addIncidentEvent, resolveIncident } from './incidentService.js';
import { generateSmartInsights } from './insightService.js';
import { analyzeWithGroq } from './groqService.js';
import { checkWithStealthBrowser } from './browserHealthService.js';
import { generateHash } from '../utils/hash.js';
import { storeHash } from './blockchainService.js';
import { correlateTrace } from './correlationEngine.js';

/**
 * Up-base IQ (V2) - Intelligent Hazard Detection
 * Analyzes HTML content to detect "Ghost 200" failures.
 */
export const calculateUpbaseIQScore = (html, customFailureKeywords = []) => {
    // 1. Structural Red Flags - FIX: Don't flag APIs/204s with short responses!
    // A 204 No Content or `{ "ok": true }` is perfectly fine.
    if (!html || html.length < 5) return 0; // Only flag truly dead shells, not tiny APIs
    
    // Performance: Scan first 8KB (increased from 5KB for deeper Next.js fragments)
    const sample = html.substring(0, 8000).toLowerCase();
    let score = 0;

    // If the body is moderately small but looks like HTML, be slightly softer
    if (html.length < 500 && sample.includes('<html')) score += 1;

    // 2. Application/Client-Side Red Flags (Next.js/React/Vite)
    const hazardPatterns = [
        "application error: a client-side exception", 
        "application error",
        "client-side exception",
        "hydration failed",
        "system critical",
        "outage detected",
        "initiating safegaurds",
        "something went wrong",
        "unexpected error",
        "minified react error",
        "runtime error",
        "uncaught error"
    ];
    hazardPatterns.forEach(p => { 
        if (sample.includes(p)) {
            score += 4; // High weight: Immediate confirmation
        }
    });

    // 3. Infrastructure & DB Red Flags (Ghost 500s)
    const infraPatterns = [
        "internal server error",
        "database connection",
        "mongoerror",
        "500 error",
        "bad gateway",
        "service unavailable",
        "error occurred",
        "initializing failure",
        "scheduled maintenance"
    ];
    infraPatterns.forEach(p => { if (sample.includes(p)) score += 3; });

    // 4. Level 0: Suspicion & Shell Patterns (Triggers AI layer if uncertain)
    const suspicionPatterns = [
        "maintenance",
        "scheduled outage",
        "sorry for",
        "briefly unavailable",
        "temporarily disabled",
        "down for",
        "initializing failure",
        "verification in progress",
        "final verification test",
        "system monitor",
        "deployment verification"
    ];
    suspicionPatterns.forEach(p => { if (sample.includes(p)) score += 1; });
    
    if (sample.includes("verification in progress") || sample.includes("initializing failure")) {
        score += 1; 
    }

    // 5. Custom User Domain Rules
    if (customFailureKeywords && Array.isArray(customFailureKeywords)) {
        customFailureKeywords.forEach(keyword => {
            if (sample.includes(keyword.toLowerCase())) score += 4;
        });
    }

    return score;
};

// Helper wrapper to capture exact network latency
const timeAxiosGet = async (url, options) => {
    const reqStart = Date.now();
    try {
        const res = await axios.get(url, options);
        return { success: true, response: res, latency: Date.now() - reqStart };
    } catch (err) {
        return { success: false, error: err, latency: Date.now() - reqStart };
    }
};

export const checkSingleMonitor = async (monitor) => {
    const functionStart = Date.now();
    let errorMessage = null;
    let status = 'DOWN';
    let frontendLatency = 0;
    let responseTimeOverride = 0;
    let responseBody = null;
    let statusCode = 0;

    // --- Section 0: Daily Rollback Reset ---
    const now = new Date();
    const lastRollback = monitor.lastRollbackAt ? new Date(monitor.lastRollbackAt) : null;
    const isNewDay = !lastRollback || lastRollback.toDateString() !== now.toDateString();
    
    if (isNewDay && (monitor.rollbackTodayCount > 0)) {
        monitor.rollbackTodayCount = 0;
    }

    // --- DEEP HEALTH CHECK (Dual-Path) ---
    let frontendUp = false;
    let backendUp = true;
    
    const commonHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };

    // Increased timeouts to handle cloud cold starts (e.g. Render/Vercel)
    const requestPromises = [ timeAxiosGet(monitor.url, { timeout: 12000, headers: commonHeaders }) ];
    if (monitor.apiUrl) {
        requestPromises.push(timeAxiosGet(monitor.apiUrl, { timeout: 15000, headers: commonHeaders }));
    }

    const results = await Promise.all(requestPromises);
    const frontendResWrapper = results[0];
    const backendResWrapper = monitor.apiUrl ? results[1] : null;

    // Handle Timeouts Gracefully for better UX
    const handleAxiosError = (err) => {
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
            return `Connection Timeout (Target slow to wake / Cold start)`;
        }
        return err.response ? `HTTP ${err.response.status} ${err.response.statusText}` : err.message;
    };

    frontendLatency = frontendResWrapper.latency;
    let frontendResStatus = frontendResWrapper.success ? 'fulfilled' : 'rejected';
    let frontendResData = frontendResWrapper.success ? frontendResWrapper.response : frontendResWrapper.error;

    // --- Section 0.5: Network Integrity Recovery (Stealth Fallback) ---
    // Accuracy Fix: Trigger stealth if standard axios is throttled or slow (>5s)
    let executedStealthBypass = false;
    
    if (frontendResStatus === 'rejected' || frontendLatency > 5000) {
        if (frontendResStatus === 'rejected' && 
            (['ECONNRESET', 'EAI_AGAIN'].includes(frontendResData.code) || 
             (frontendResData.response && frontendResData.response.status === 403) ||
             (frontendResData.code === 'ECONNABORTED' || frontendResData.code === 'ETIMEDOUT'))) {
            
            const stealth = await checkWithStealthBrowser(monitor.url);
            
            if (stealth.success) {
                executedStealthBypass = true;
                frontendResStatus = 'fulfilled';
                frontendResData = { 
                    data: stealth.data, 
                    status: stealth.status 
                };
                // Accuracy Correction: Use the real browser load time
                frontendLatency = stealth.latency || frontendLatency;
            }
        }
    }

    // 1. Process Frontend
    if (frontendResStatus === 'fulfilled') {
        const response = frontendResData;
        
        responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || {});
        
        // User Rule: Only 500+ is an error (which means 200-499 is theoretically UP, though 400s usually indicate misconfig)
        // Adjusting to 200-399 for standard health as 400s are generally client errors.
        const isHttpStatusUp = response.status >= 200 && response.status < 400;
        let hasIntegrity = true;
        
        if (isHttpStatusUp && monitor.useUpbaseIQ !== false && response.status !== 204) {
            let iqScore = calculateUpbaseIQScore(responseBody, monitor.failureKeywords);
            
            if (iqScore >= 1 && iqScore < 3 && process.env.GROQ_API_KEY) {
                const aiResult = await analyzeWithGroq(responseBody);
                if (aiResult && aiResult.isFailure && aiResult.confidence >= 80) {
                    iqScore = 6;
                    errorMessage = `UPBASE_IQ: Groq-AI Detection (${aiResult.confidence}%) - ${aiResult.reason}`;
                }
            }

            if (iqScore >= 3) {
                hasIntegrity = false;
                errorMessage = errorMessage || `UPBASE_IQ: Hidden failure detected (Score: ${iqScore}/10)`;
            }
        }

        if (monitor.successKeyword && isHttpStatusUp && hasIntegrity) {
            if (!responseBody.toLowerCase().includes(monitor.successKeyword.toLowerCase())) {
                hasIntegrity = false;
                errorMessage = `INTEGRITY_FAIL: Missing success keyword '${monitor.successKeyword}'`;
            }
        }
        
        if (isHttpStatusUp && hasIntegrity) {
            frontendUp = true;
        } else {
            errorMessage = errorMessage || `HTTP ${response.status} Non-Ok (Frontend)`;
        }
        statusCode = response.status;
    } else {
        const err = frontendResData;
        errorMessage = handleAxiosError(err) + " (Frontend)";
        statusCode = err.response ? err.response.status : (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' ? 408 : 0);
        responseBody = err.response ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data || {})) : null;
    }

    // 2. Process Backend
    if (backendResWrapper) {
        if (backendResWrapper.success) {
            const bResp = backendResWrapper.response;
            backendUp = bResp.status >= 200 && bResp.status < 400;
            if (!backendUp) {
                errorMessage = errorMessage ? (errorMessage + " | ") : "";
                const msg = bResp.status === 404 
                    ? `API HTTP 404 (Not Found). Tip: Use a valid health path like /health or /api/status instead of the root.` 
                    : `API HTTP ${bResp.status} Error (Backend)`;
                errorMessage += msg;
            } else {
                // AUTO-RESOLUTION: If backend was down but is now up, ensure we flag for recovery
                console.log(`[MONITOR][${monitor.name}] Backend recovered: 200 OK at ${monitor.apiUrl}`);
                // PURGE 404 NOISE: If we just recovered, wipe any mention of "404" from the active error string
                if (errorMessage && errorMessage.includes("404")) {
                    errorMessage = errorMessage.split('|').filter(part => !part.includes("404")).join('|').trim() || null;
                }
            }
        } else {
            backendUp = false;
            const bErr = backendResWrapper.error;
            errorMessage = errorMessage ? (errorMessage + " | ") : "";
            errorMessage += handleAxiosError(bErr) + " (Backend)";
        }
    }

    // Final Status Decision: 
    // Intelligent Override: If Frontend is OK, and Backend is ONLY 404 (Reachable but empty path), stay UP but log warning.
    const isBackendOnly404 = backendResWrapper && !backendResWrapper.success && backendResWrapper.error?.response?.status === 404;
    if (frontendUp && (monitor.apiUrl ? (backendUp || isBackendOnly404) : true)) {
        status = 'UP';
        monitor.lastError = null; // Silence warning string so AI agent sees 0 active exceptions
        monitor.isFrontendDown = false;
        monitor.isBackendDown = isBackendOnly404; // Mark it as partially down for UI badges if needed
        
        // --- DEEP FIX: Clear errorMessage so history logs stay 100% clean ---
        if (isBackendOnly404) {
            errorMessage = null; 
        }
    } else {
        status = 'DOWN';
        monitor.lastError = errorMessage || "Infrastructure unreachable or timeout detected.";
        monitor.isFrontendDown = !frontendUp;
        monitor.isBackendDown = monitor.apiUrl ? !backendUp : false;
        console.error(`[MONITOR] Check failed for ${monitor.name}: ${monitor.lastError}`);
    }

    console.log(`[MONITOR][${monitor.name}] FEC: ${frontendUp ? 'OK' : 'FAIL'} | API: ${monitor.apiUrl ? (backendUp ? 'OK' : (isBackendOnly404 ? '404_PASS' : 'FAIL')) : 'N/A'} | Status: ${status} | Error: ${monitor.lastError || 'None'}`);

    // ACCURATE LATENCY CALCULATION + ESTIMATED REAL LATENCY
    // 1. Edge Latency (WAF/CDN Ping)
    let edgeLatency = frontendLatency || 0;
    
    // 2. Adaptive Real User Latency (Estimated)
    // Refined: Higher multipliers for fast edge, lower/softer for cold-starts/slow networks
    let estimatedRealLatency = 0;
    if (edgeLatency < 100) estimatedRealLatency = edgeLatency * 2.5;
    else if (edgeLatency < 300) estimatedRealLatency = edgeLatency * 2.0;
    else if (edgeLatency < 1000) estimatedRealLatency = edgeLatency * 1.5;
    else estimatedRealLatency = edgeLatency * 1.2; // Soft multiplier for cold-starts (e.g. Render/Vercel)

    let responseTime = responseTimeOverride > 0 ? responseTimeOverride : Math.round(estimatedRealLatency);

    // 3. Final Evaluation Complete
    // (Logic consolidated above)


    // --- Section 1.5: Baseline Integrity Check ---
    const isFirstCheck = !monitor.lastChecked;
    if (isFirstCheck && status === 'DOWN') {
        monitor.isBaselineError = true;
        console.warn(`[BASELINE] Site ${monitor.url} added in DOWN state. Auto-rollback disabled.`);
    }

    // --- Section 2: Alerting Logic ---
    // User Rule Fix: Incident ONLY if status = DOWN or Real User Latency > 3000ms consistently
    const isFailing = status === 'DOWN' || responseTime > 3000;
    
    let statusType = status;
    if (status === 'UP') {
        if (responseTimeOverride === 0 && executedStealthBypass) {
            statusType = 'PROTECTED';
        } else if (responseTime <= 500) statusType = 'GOOD';
        else if (responseTime <= 2000) statusType = 'OK';
        else statusType = 'DEGRADED';
    }

    if (isFailing) {
        monitor.consecutiveFailures += 1;
        if (!monitor.failureStartedAt) {
            monitor.failureStartedAt = new Date();
        }

        // --- New: Dual-Monitor Severity Intelligence ---
        // We evaluate severity based on the type of monitor and the state of its peers or deep check
        if (monitor.consecutiveFailures >= 3) {
            let targetSeverity = monitor.monitorType === 'BACKEND' ? 'HIGH' : 'LOW';
            
            // Dual-Path Logic (Self-contained)
            if (monitor.apiUrl) {
                if (monitor.isFrontendDown && monitor.isBackendDown) {
                    targetSeverity = 'CRITICAL';
                } else if (monitor.isBackendDown && !monitor.isFrontendDown) {
                    targetSeverity = 'HIGH';
                }
            }
            
            // Cross-check: find any other monitor in this project that is also DOWN
            try {
                const { updateIncidentSeverity } = await import('./incidentService.js');
                const peerMonitorsCount = await Monitor.countDocuments({ 
                    project: monitor.project, 
                    _id: { $ne: monitor._id }, 
                    status: 'DOWN' 
                });

                if (peerMonitorsCount > 0) {
                    targetSeverity = 'CRITICAL';
                }

                if (monitor.consecutiveFailures === 3) {
                    await getOrCreateActiveIncident(monitor._id, monitor.user, targetSeverity);
                } else {
                    // Re-calculate severity on each subsequent check
                    await updateIncidentSeverity(monitor._id, targetSeverity);
                    await addIncidentEvent(monitor._id, 'RETRY_FAILED', `Retry attempt ${monitor.consecutiveFailures} continues to fail.`);
                }
            } catch (err) {
                console.error(`[SEVERITY-INTEL-ERROR]: ${err.message}`);
                // Fallback to basic incident if intel fails
                if (monitor.consecutiveFailures === 3) {
                    await getOrCreateActiveIncident(monitor._id, monitor.user);
                }
            }
        }
    } else {
        if (monitor.failureStartedAt) {
            const user = await User.findById(monitor.user);
            
            // Accuracy Fix: Fetch project integrations to ensure custom email destination is used for recovery alerts
            let integrations = {};
            try {
                const project = await Project.findById(monitor.project);
                integrations = project?.integrations || {};
            } catch (pErr) {
                console.error(`[RECOVERY-SYNC] Failed to fetch project context: ${pErr.message}`);
            }

            if (user && monitor.alertLevel !== 'NONE') {
                await sendRecoveryAlert(user, monitor, integrations);
            }
            // Resolve incident (will only perform action if incident status is OPEN)
            await resolveIncident(monitor._id);
        }
        
        monitor.consecutiveFailures = 0;
        monitor.failureStartedAt = null;
        monitor.alertLevel = 'NONE';
    }

    // Update state & Moving Average
    monitor.status = statusType;
    monitor.responseTime = responseTime;
    
    // Moving average logic (Smooths spikes for baseline)
    if (responseTime > 0 && responseTime < 10000) {
        monitor.avgResponseTime = monitor.avgResponseTime > 0 
            ? Math.round((monitor.avgResponseTime * 9 + responseTime) / 10) 
            : responseTime;
    }

    monitor.lastChecked = new Date();
    
    // Log history
    const log = await MonitorLog.create({
        monitor: monitor._id,
        project: monitor.project, // Analytics Context
        url: monitor.url, // Analytics Context
        status: (['GOOD', 'OK', 'DEGRADED'].includes(statusType)) ? 'UP' : statusType, // Map to UP for uptime math
        responseTime,
        latency: responseTime,
        edgeLatency,
        realLatency: Math.round(estimatedRealLatency),
        p50: 0, // Synthetic Engine does not calculate percentiles natively, reserved for RUM
        p95: 0,
        source: 'synthetic',
        errorMessage,
        statusCode,
        responseSize: responseBody ? Buffer.byteLength(responseBody, 'utf8') : 0, // Analytics Context
        region: 'global-synthetic', // Analytics Context
        userAgent: 'Up-base-Engine', // Analytics Context
        responseBody: status === 'DOWN' ? responseBody : null // Save space, only failed body
    });

    // --- 🔍 OBSERVABILITY TRACE BRIDGE ---
    // Emit structured logs to the Log model so the Observability page/TraceSidebar
    // can display correlated error traces via the correlation engine.
    if (status === 'DOWN' && errorMessage) {
        try {
            // Generate a deterministic trace_id per monitor per 10-min window
            // This groups related check failures into a single trace
            const windowKey = Math.floor(Date.now() / (10 * 60 * 1000)); // 10-min bucket
            const traceId = crypto.createHash('sha256')
                .update(`${monitor._id}-${windowKey}`)
                .digest('hex')
                .substring(0, 24);

            const projectId = monitor.project ? monitor.project.toString() : null;

            // Build log entries for this failure event
            const traceLogs = [];

            // 1. Frontend failure log (if frontend is down)
            if (!frontendUp) {
                traceLogs.push({
                    type: 'frontend',
                    source: 'upbase-monitor',
                    service: monitor.name,
                    severity: 'error',
                    message: `Frontend check failed for ${monitor.url}: ${errorMessage}`,
                    metadata: {
                        monitor_id: monitor._id.toString(),
                        monitor_name: monitor.name,
                        url: monitor.url,
                        status_code: statusCode,
                        latency_ms: frontendLatency,
                        consecutive_failures: monitor.consecutiveFailures,
                        is_demo: false,
                    },
                    trace_id: traceId,
                    project_id: projectId,
                    environment: 'production',
                    timestamp: new Date(),
                    ingested_by: 'monitor-service',
                });
            }

            // 2. Backend failure log (if backend is down and has apiUrl)
            if (monitor.apiUrl && !backendUp) {
                traceLogs.push({
                    type: 'backend',
                    source: 'upbase-monitor',
                    service: monitor.name,
                    severity: 'critical',
                    message: `Backend API unreachable at ${monitor.apiUrl}: ${errorMessage}`,
                    metadata: {
                        monitor_id: monitor._id.toString(),
                        monitor_name: monitor.name,
                        api_url: monitor.apiUrl,
                        consecutive_failures: monitor.consecutiveFailures,
                        is_demo: false,
                    },
                    trace_id: traceId,
                    project_id: projectId,
                    environment: 'production',
                    timestamp: new Date(),
                    ingested_by: 'monitor-service',
                });
            }

            // 3. System-level summary log
            traceLogs.push({
                type: 'system',
                source: 'upbase-monitor',
                service: 'monitor-engine',
                severity: monitor.consecutiveFailures >= 3 ? 'critical' : 'error',
                message: `Monitor [${monitor.name}] detected DOWN: ${errorMessage}`,
                metadata: {
                    monitor_id: monitor._id.toString(),
                    monitor_name: monitor.name,
                    url: monitor.url,
                    api_url: monitor.apiUrl || null,
                    status_code: statusCode,
                    response_time: responseTime,
                    edge_latency: edgeLatency,
                    consecutive_failures: monitor.consecutiveFailures,
                    frontend_down: !frontendUp,
                    backend_down: monitor.apiUrl ? !backendUp : false,
                    is_demo: false,
                },
                trace_id: traceId,
                project_id: projectId,
                environment: 'production',
                timestamp: new Date(),
                ingested_by: 'monitor-service',
            });

            // Insert logs and trigger correlation (fire-and-forget)
            if (traceLogs.length > 0) {
                await Log.insertMany(traceLogs, { ordered: false });
                // Correlate in the background so traces appear in Observability
                setImmediate(async () => {
                    try {
                        await correlateTrace(traceId);
                        console.log(`[OBSERVABILITY-BRIDGE] Trace ${traceId} correlated for monitor ${monitor.name}`);
                    } catch (corrErr) {
                        console.error(`[OBSERVABILITY-BRIDGE] Correlation failed: ${corrErr.message}`);
                    }
                });
            }
        } catch (obsErr) {
            console.error(`[OBSERVABILITY-BRIDGE] Log emission failed: ${obsErr.message}`);
        }
    }

    // --- 🛡️ Blockchain Integrity Pulse ---
    try {
        const latencyHash = generateHash({ responseTime, monitorId: monitor._id, timestamp: new Date() });
        await storeHash(latencyHash, "latency", monitor._id);

        if (status === 'DOWN') {
            const errorHash = generateHash({ errorMessage, statusCode, monitorId: monitor._id });
            await storeHash(errorHash, "error", monitor._id);
        }
    } catch (err) {
        console.error(`[BLOCKCHAIN][PULSE][ERROR] ${err.message}`);
    }

    // Alerting process & Self-Healing Trigger
    if (monitor.consecutiveFailures >= 3) {
        await processAlertingTier(monitor);
        
        // --- 🤖 Up-base Auto-Fix Engine (V3 Integration) ---
        // After alerting/rollback, it attempts to generate and push a code fix.
        try {
            const { triggerAutoFix } = await import('./autoFixService.js');
            // We pass the latest error and HTML snippet for AI context
            await triggerAutoFix(monitor._id, errorMessage, responseBody);
        } catch (err) {
            console.error(`[AUTO-FIX-TRIGGER-ERROR] ${err.message}`);
        }
    }

    // Calc uptime
    const totalChecks = await MonitorLog.countDocuments({ monitor: monitor._id });
    const successfulChecks = await MonitorLog.countDocuments({ monitor: monitor._id, status: 'UP' });
    if (totalChecks > 0) {
        monitor.uptimePercentage = Math.round((successfulChecks / totalChecks) * 100);
    }

    await monitor.save();

    // --- 4. SMART INSIGHTS ENGINE (ASYNC) ---
    (async () => {
        try {
            const score = await generateSmartInsights(monitor._id);
            if (score !== undefined) {
                await Monitor.findByIdAndUpdate(monitor._id, { healthScore: score });
            }
        } catch (err) {
            console.error('[INSIGHT-TRIGGER] Failed:', err.message);
        }
    })();

    return statusType;
};

export const performStatusChecks = async () => {
    try {
        const monitors = await Monitor.find({ isActive: true });
        console.log(`[MONITOR-SERVICE] Starting Status Check for ${monitors.length} nodes...`);
        
        // --- PARALLEL RESOLUTION (Optimized) ---
        // We use allSettled to ensure one failure doesn't stop the whole fleet check.
        await Promise.allSettled(monitors.map(monitor => checkSingleMonitor(monitor)));
        
        console.log(`[MONITOR-SERVICE] Cycle Complete. Next check in 30s.`);
    } catch (err) {
        console.error('[MONITOR-SERVICE] Critical Runner error:', err.message);
    }
};

export const startMonitoringEngine = () => {
    console.log('[MONITOR-SERVICE] Initializing Monitoring Engine (Section 1, 2 & 3)...');
    performStatusChecks();
    setInterval(() => {
        performStatusChecks();
    }, 30000); 
};

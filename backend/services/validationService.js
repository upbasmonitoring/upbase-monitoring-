import axios from 'axios';
import { calculateSentinelIQScore } from './monitorService.js';

/**
 * Ralph Multi-Endpoint Validation Service
 * Verifies both Frontend and Backend health to ensure full system recovery.
 */
export const validateFix = async ({ frontendUrl, backendUrl, monitor }) => {
    console.log(`[VALIDATION] 🛡️ Starting Multi-Endpoint Validation...`);
    console.log(`[VALIDATION] Frontend: ${frontendUrl}`);
    console.log(`[VALIDATION] Backend: ${backendUrl || 'None configured'}`);

    try {
        // --- STEP 1: INITIAL MULTI-CHECK ---
        const frontendCheck = await checkFrontend(frontendUrl, monitor);
        if (!frontendCheck.ok) {
            return { success: false, reason: "frontend_failed", metrics: { frontend: frontendCheck } };
        }

        let backendCheck = { ok: true }; // Assume OK if not configured
        if (backendUrl) {
            backendCheck = await checkBackend(backendUrl);
            if (!backendCheck.ok) {
                return { success: false, reason: "backend_failed", metrics: { frontend: frontendCheck, backend: backendCheck } };
            }
        }

        // --- STEP 2: STABILITY DELAY (60s) ---
        console.log(`[VALIDATION] ⏳ Initial multi-check passed. Waiting 60s for stability verification...`);
        await new Promise(resolve => setTimeout(resolve, 60000));

        // --- STEP 3: RE-VALIDATION (Both must pass again) ---
        const frontendStable = await checkFrontend(frontendUrl, monitor);
        if (!frontendStable.ok) {
            return { success: false, reason: "frontend_failed_stability", metrics: { frontend: frontendStable } };
        }

        if (backendUrl) {
            const backendStable = await checkBackend(backendUrl);
            if (!backendStable.ok) {
                return { success: false, reason: "backend_failed_stability", metrics: { backend: backendStable } };
            }
        }

        return {
            success: true,
            reason: "both_validated",
            metrics: { frontend: frontendStable, backend: backendUrl ? backendCheck : null }
        };

    } catch (err) {
        console.error(`[VALIDATION-ERROR] ❌ Critical failure: ${err.message}`);
        return { success: false, reason: "execution_error", metrics: { error: err.message } };
    }
};

/**
 * Verify Frontend Health (HTML + Sentinel IQ)
 */
async function checkFrontend(url, monitor) {
    const start = Date.now();
    try {
        const res = await axios.get(url, { timeout: 3000, validateStatus: false });
        const responseTime = Date.now() - start;
        const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        
        const iqScore = calculateSentinelIQScore(html, monitor.failureKeywords);

        return {
            ok: res.status === 200 && responseTime < 3000 && iqScore < 3,
            statusCode: res.status,
            responseTime,
            iqScore
        };
    } catch (err) {
        return { ok: false, error: err.message, status: 500 };
    }
}

/**
 * Verify Backend Health (JSON /api/health)
 * Includes 2 retries for production-grade resilience.
 */
async function checkBackend(url, retries = 2) {
    const endpoint = url.endsWith('/health') ? url : (url.endsWith('/') ? `${url}api/health` : `${url}/api/health`);
    
    for (let i = 0; i <= retries; i++) {
        const start = Date.now();
        try {
            console.log(`[VALIDATION] Probing Backend (Attempt ${i + 1}/${retries + 1}): ${endpoint}`);
            const res = await axios.get(endpoint, { timeout: 3000 });
            const responseTime = Date.now() - start;

            // Expect JSON: { status: "ok" }
            if (res.status === 200 && res.data && res.data.status === 'ok') {
                return { ok: true, statusCode: res.status, responseTime };
            }
            
            console.warn(`[VALIDATION] Backend probe non-ok: HTTP ${res.status}`);
        } catch (err) {
            console.warn(`[VALIDATION] Backend probe failed: ${err.message}`);
        }

        if (i < retries) {
            await new Promise(r => setTimeout(r, 2000)); // Wait before retry
        }
    }

    return { ok: false, error: "Backend health check failed after retries" };
}

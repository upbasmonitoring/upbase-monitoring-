import MonitorLog from '../../models/MonitorLog.js';
import Monitor from '../../models/Monitor.js';

/**
 * mongoTool - Error Observability
 * Fetches recent backend exceptions and status codes for analysis.
 * 
 * ACCURACY FIX: Cross-checks the monitor's current live status.
 * If the monitor is currently UP/STABLE, stale error logs from the
 * recovery window are excluded to prevent false-positive reporting.
 */
export async function fetchMongoErrors(monitorId) {
    if (!monitorId) return [];

    try {
        console.log(`[MONGO][DEBUG] Fetching errors for monitor: ${monitorId}`);

        // ACCURACY CHECK: Read the monitor's current live status
        const monitor = await Monitor.findById(monitorId).select('status lastError consecutiveFailures').lean();
        
        // If the monitor is currently healthy, don't report stale errors
        const healthyStatuses = ['UP', 'GOOD', 'OK', 'DEGRADED', 'PROTECTED'];
        if (monitor && healthyStatuses.includes(monitor.status) && monitor.consecutiveFailures === 0) {
            console.log(`[MONGO][${monitorId}] Monitor is currently ${monitor.status} with 0 failures — skipping stale error window.`);
            return [];
        }

        // DB Query for latest errors within the last 5 minutes (Recency Filter)
        // Only fetch logs where the status was actually DOWN (not UP logs that happen to have errorMessage)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const errorLogs = await MonitorLog.find({ 
            monitor: monitorId,
            checkedAt: { $gte: fiveMinsAgo },
            status: { $nin: ['UP'] },
            $or: [
                { statusCode: { $gte: 400 } },
                { errorMessage: { $ne: null } }
            ]
        })
        .sort({ checkedAt: -1 })
        .limit(5)
        .lean();

        if (errorLogs.length === 0) {
            console.log(`[MONGO][${monitorId}] No active errors found in latest logs.`);
            return [];
        }

        // Group and deduplicate errors by cleaning common variance (timestamps/noise)
        const uniqueErrors = [...new Set(errorLogs.map(log => {
            if (!log.errorMessage) return `HTTP ${log.statusCode} Error`;
            // Normalize: Remove timestamps or varying bits to find the "root" error
            return log.errorMessage
                .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '') // Clean ISO strings
                .replace(/ms/g, '') // Clean latency noise
                .trim();
        }))].filter(Boolean);

        return uniqueErrors; // Always return a clean, deduplicated array
    } catch (err) {
        console.error("[MONGO ERROR]", err.message);
        return [];
    }
}

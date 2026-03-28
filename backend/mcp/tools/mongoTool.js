import MonitorLog from '../../models/MonitorLog.js';

/**
 * mongoTool - Error Observability
 * Fetches recent backend exceptions and status codes for analysis.
 */
export async function fetchMongoErrors(monitorId) {
    if (!monitorId) return [];

    try {
        console.log(`[MONGO][DEBUG] Fetching errors for monitor: ${monitorId}`);

        // DB Query for latest 5 logs with errors
        // Status code >= 400 or presence of error messages
        const errorLogs = await MonitorLog.find({ 
            monitor: monitorId,
            $or: [
                { statusCode: { $gte: 400 } },
                { errorMessage: { $ne: null } }
            ]
        })
        .sort({ checkedAt: -1 })
        .limit(5)
        .lean();

        if (errorLogs.length === 0) {
            console.log(`[MONGO][${monitorId}] No errors found in latest logs.`);
            return [];
        }

        // Return flat list of error messages
        return errorLogs.map(log => log.errorMessage || `HTTP ${log.statusCode} Error`);
    } catch (err) {
        console.error("[MONGO ERROR]", err.message);
        return [];
    }
}

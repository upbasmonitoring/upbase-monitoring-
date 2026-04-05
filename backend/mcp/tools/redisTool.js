import redis from '../../config/redis.js';
import MonitorLog from '../../models/MonitorLog.js';

/**
 * redisTool - Latency Observability
 * Fetches real-time p50/p95 metrics.
 */
export async function fetchLatencyData(monitorId) {
    try {
        console.log("[REDIS] Connected:", !redis.isMock);

        // Fetch last 20 logs from Mongo if Redis/cache empty
        // Use a filter to find logs with either 'latency' (new) or 'responseTime' (legacy)
        const query = monitorId 
            ? { monitor: monitorId, $or: [{ latency: { $gt: 0 } }, { responseTime: { $gt: 0 } }] }
            : { $or: [{ latency: { $gt: 0 } }, { responseTime: { $gt: 0 } }] };

        const logs = await MonitorLog.find(query)
            .sort({ checkedAt: -1 })
            .limit(20)
            .lean();

        // Extract latency values, prioritizing the 'latency' field
        const latencies = logs.map(l => l.latency || l.responseTime).filter(v => typeof v === 'number' && v > 0);
        
        console.log("[LATENCY DATA]", latencies);

        if (latencies.length > 0) {
            const latest = logs[0].latency || logs[0].responseTime || 0;
            latencies.sort((a, b) => a - b);
            
            // Calculate p50 (Median)
            const p50Idx = Math.floor(latencies.length * 0.5);
            const p50 = latencies[p50Idx];
            
            // Calculate p95 (95th Percentile)
            const p95Idx = Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1);
            const p95 = latencies[p95Idx];

            return { 
                p50, 
                p95,
                latest, // Absolute latest before sorting the average list
                samples: latencies.length 
            };
        }

        // Final fallback if no data exists
        return { p50: "N/A", p95: "N/A" };

    } catch (err) {
        console.error("[REDIS ERROR]", err.message);
        return {
            p50: "N/A",
            p95: "N/A",
            error: err.message
        };
    }
}

import Insight from '../models/Insight.js';
import Incident from '../models/Incident.js';
import Monitor from '../models/Monitor.js';
import Deployment from '../models/Deployment.js';
import MonitorLog from '../models/MonitorLog.js';

/**
 * INTELLIGENCE ENGINE: Proactive Monitoring
 * Detects patterns, anomalies, and calculates health scores.
 */

export const generateSmartInsights = async (monitorId) => {
    try {
        const monitor = await Monitor.findById(monitorId);
        if (!monitor) return;

        // --- 1. ANOMALY DETECTION (Latency Spikes) ---
        // Basic Logic: If currentResponse > avg * 2
        const currentLatency = monitor.lastResponseTime;
        const avgLatency = monitor.avgResponseTime || 200;

        if (currentLatency > avgLatency * 2.5 && currentLatency > 500) {
            await createUniqueInsight(monitor._id, monitor.user, 'ANOMALY', 
                `High latency spike detected: ${currentLatency}ms (vs. average ${avgLatency}ms). Site is responding 2.5x slower than normal.`,
                'MEDIUM'
            );
        }

        // --- 2. FAILURE PATTERN DETECTION (Frequency) ---
        const recentIncidents = await Incident.countDocuments({
            monitor: monitorId,
            startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (recentIncidents >= 3) {
            await createUniqueInsight(monitor._id, monitor.user, 'PATTERN', 
                `High failure frequency: ${recentIncidents} incidents in the last 24h. Stability is severely compromised.`,
                'HIGH'
            );
        }

        // --- 3. DEPLOYMENT INSTABILITY ---
        const recentDeploys = await Deployment.countDocuments({
            monitor: monitorId,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (recentDeploys > 0 && recentIncidents > 0) {
            await createUniqueInsight(monitor._id, monitor.user, 'STABILITY',
                `Instability correlated with recent code pushes. ${recentIncidents} failures detected following your last deployments.`,
                'HIGH'
            );
        }

        // --- 4. PERFORMANCE DEGRADATION TREND ---
        const lastHourLogs = await MonitorLog.find({
            monitor: monitorId,
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        }).sort({ createdAt: -1 }).limit(10);

        if (lastHourLogs.length >= 5) {
            const lastHourAvg = lastHourLogs.reduce((acc, l) => acc + l.responseTime, 0) / lastHourLogs.length;
            if (lastHourAvg > avgLatency * 1.5) {
                await createUniqueInsight(monitor._id, monitor.user, 'DEGRADATION',
                    `Performance degrading: Average latency for the last hour (${Math.round(lastHourAvg)}ms) is 50% higher than your baseline.`,
                    'MEDIUM'
                );
            }
        }
        
        // --- 4. HEALTH SCORE CALCULATION ---
        const healthScore = calculateMonitorHealth(monitor, recentIncidents);
        await createUniqueInsight(monitor._id, monitor.user, 'HEALTH', 
            `Overall Health Score: ${healthScore}/100. ${healthScore > 90 ? 'Excellent performance.' : 'Optimizations recommended.'}`,
            healthScore < 70 ? 'MEDIUM' : 'LOW',
            { score: healthScore }
        );

        return healthScore;
    } catch (err) {
        console.error(`[INSIGHT-ENGINE] Execution failed: ${err.message}`);
    }
};

/**
 * Ensures we don't spam duplicate insights in a short window
 */
async function createUniqueInsight(monitorId, userId, type, message, severity, data = {}) {
    const window = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4h window
    const exists = await Insight.findOne({ 
        monitor: monitorId, 
        type, 
        createdAt: { $gte: window } 
    });

    if (!exists) {
        await Insight.create({
            monitor: monitorId,
            user: userId,
            type,
            message,
            severity,
            data
        });
        console.log(`[INSIGHT] Smart detection: ${type} - ${message.substring(0, 30)}...`);
    } else if (type === 'HEALTH') {
        // Update health score if it's the same 4h window (Don't create new, just update)
        exists.message = message;
        exists.data = data;
        await exists.save();
    }
}

function calculateMonitorHealth(monitor, incidentCount) {
    let score = 100;

    // 1. Latency Impact (Avg vs Threshold)
    if (monitor.avgResponseTime > 500) score -= 15;
    if (monitor.avgResponseTime > 1000) score -= 25;

    // 2. Incident Penalty
    score -= (incidentCount * 12);

    // 3. Uptime check
    if (monitor.uptime < 99.5) score -= 10;
    if (monitor.uptime < 95) score -= 20;

    return Math.max(0, Math.min(100, score));
}

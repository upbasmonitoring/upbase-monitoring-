/**
 * OBSERVABILITY INTELLIGENCE SERVICE
 * Luxury-tier enhancements: SLO Tracking, Anomaly Detection, Smart Alerting, Historical Analytics
 * 
 * This service is invoked AFTER each RUM flush or synthetic check cycle.
 * It is completely non-blocking and never affects the core monitoring pipeline.
 */

import MonitorLog from '../models/MonitorLog.js';
import Monitor from '../models/Monitor.js';
import Alert from '../models/Alert.js';
import redis from '../config/redis.js';
import { getRedisStatus } from '../config/redis.js';

const ENV = process.env.NODE_ENV || 'dev';

// ============================================================
// 1. SLO / SLA TRACKING
// ============================================================

/**
 * Calculates SLO compliance for a monitor over a rolling window.
 * @param {string} monitorId - Monitor ObjectId
 * @param {number} windowHours - Rolling window in hours (1, 24, 168 for 7d)
 * @returns {{ uptimePercent, p95Median, sloCompliant, breaches }}
 */
export async function calculateSLO(monitorId, windowHours = 24) {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const logs = await MonitorLog.find({
        monitor: monitorId,
        checkedAt: { $gte: since }
    }).select('status responseTime p95 source').lean();

    if (logs.length === 0) {
        return { uptimePercent: 100, p95Median: 0, sloCompliant: true, breaches: [], samples: 0 };
    }

    const total = logs.length;
    const upCount = logs.filter(l => l.status === 'UP').length;
    const uptimePercent = Math.round((upCount / total) * 10000) / 100; // 2 decimal places

    // Collect p95 values from RUM flushes only
    const rumP95s = logs.filter(l => l.source === 'RUM' && l.p95 > 0).map(l => l.p95);
    const p95Median = rumP95s.length > 0
        ? rumP95s.sort((a, b) => a - b)[Math.floor(rumP95s.length / 2)]
        : 0;

    // Default SLO targets (can be made configurable per monitor)
    const SLO_UPTIME = 99.9;     // %
    const SLO_P95 = 1000;        // ms

    const breaches = [];
    if (uptimePercent < SLO_UPTIME) breaches.push(`Uptime ${uptimePercent}% < ${SLO_UPTIME}% target`);
    if (p95Median > SLO_P95) breaches.push(`p95 ${p95Median}ms > ${SLO_P95}ms target`);

    return {
        uptimePercent,
        p95Median,
        sloCompliant: breaches.length === 0,
        breaches,
        samples: total,
        window: `${windowHours}h`
    };
}

// ============================================================
// 2. ANOMALY DETECTION (Rolling Mean + StdDev)
// ============================================================

/**
 * Detects latency anomalies using statistical deviation from rolling baseline.
 * An anomaly is flagged when the latest value exceeds mean + (2 * stddev).
 * @param {string} monitorId
 * @param {number} currentLatency - Latest p50 or avg latency
 * @returns {{ isAnomaly, currentLatency, mean, stddev, threshold, deviation }}
 */
export async function detectAnomaly(monitorId, currentLatency) {
    // Use the last 50 synthetic logs as baseline
    const recentLogs = await MonitorLog.find({
        monitor: monitorId,
        source: 'synthetic',
        responseTime: { $gt: 0 }
    })
    .sort({ checkedAt: -1 })
    .limit(50)
    .select('responseTime')
    .lean();

    if (recentLogs.length < 10) {
        // Not enough data for statistical analysis
        return { isAnomaly: false, reason: 'Insufficient baseline data', samples: recentLogs.length };
    }

    const values = recentLogs.map(l => l.responseTime);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    // Anomaly threshold: mean + 2 standard deviations
    const threshold = Math.round(mean + 2 * stddev);
    const deviation = stddev > 0 ? Math.round(((currentLatency - mean) / stddev) * 100) / 100 : 0;

    const isAnomaly = currentLatency > threshold && stddev > 10; // Guard: ignore near-zero variance

    return {
        isAnomaly,
        currentLatency,
        mean: Math.round(mean),
        stddev: Math.round(stddev),
        threshold,
        deviation, // How many stddevs above mean
        samples: values.length
    };
}

// ============================================================
// 3. SMART CONSECUTIVE-WINDOW ALERTING
// ============================================================

/**
 * Tracks consecutive p95 breaches in Redis. Only fires an alert
 * after N consecutive windows exceed the threshold, preventing
 * single-spike false alarms.
 * 
 * @param {string} monitorId
 * @param {number} p95 - Current p95 value
 * @param {number} threshold - p95 threshold in ms (default 1000)
 * @param {number} requiredConsecutive - Number of consecutive breaches before alert (default 3)
 */
export async function evaluateConsecutiveBreaches(monitorId, p95, threshold = 1000, requiredConsecutive = 3) {
    const counterKey = `rum_breach_count:${ENV}:${monitorId}`;
    const cooldownKey = `rum_alert_cd:${ENV}:${monitorId}`;

    if (p95 > threshold) {
        const count = await redis.incr(counterKey);
        await redis.expire(counterKey, 600); // 10 min sliding window for consecutive tracking

        if (count >= requiredConsecutive) {
            // Check cooldown
            const onCooldown = await redis.exists(cooldownKey);
            if (!onCooldown) {
                await redis.set(cooldownKey, '1');
                await redis.expire(cooldownKey, 300); // 5 min cooldown

                const severity = p95 > 3000 ? 'critical' : 'warning';
                const dedupKey = `rum_p95_${monitorId}_${new Date().toISOString().slice(0, 13)}`; // Hourly dedup

                // Atomic dedup via unique index — no findOne race
                try {
                    await Alert.create({
                        monitor: monitorId,
                        type: 'rum_p95_breach',
                        severity,
                        message: `[SMART ALERT] p95=${p95}ms exceeded ${threshold}ms for ${count} consecutive windows (${severity})`,
                        deduplicationKey: dedupKey,
                        metadata: { p95, threshold, consecutiveBreaches: count }
                    });
                    console.warn(`[SMART-ALERT] ${severity.toUpperCase()}: Monitor ${monitorId} p95=${p95}ms (${count} consecutive)`);
                } catch (e) {
                    if (e.code !== 11000) throw e; // Ignore duplicate key, rethrow others
                }
            }

            // Reset counter after alert fires
            await redis.del(counterKey);
        }
    } else {
        // p95 is healthy — reset the consecutive counter
        await redis.del(counterKey);
    }
}

// ============================================================
// 4. SLO BREACH ALERTING
// ============================================================

/**
 * Checks SLO compliance and fires an alert if breached.
 * Uses hourly deduplication to prevent spam.
 */
export async function checkSLOAndAlert(monitorId) {
    const slo = await calculateSLO(monitorId, 24);

    if (!slo.sloCompliant && slo.samples >= 20) {
        const dedupKey = `slo_breach_${monitorId}_${new Date().toISOString().slice(0, 13)}`;

        try {
            const severity = slo.uptimePercent < 99 ? 'critical' : 'warning';
            await Alert.create({
                monitor: monitorId,
                type: 'slo_breach',
                severity,
                message: `[SLO BREACH] 24h compliance failed: ${slo.breaches.join(', ')}`,
                deduplicationKey: dedupKey,
                metadata: slo
            });
            console.warn(`[SLO-ALERT] Monitor ${monitorId}: ${slo.breaches.join(', ')}`);
        } catch (e) {
            if (e.code !== 11000) throw e;
        }
    }

    return slo;
}

// ============================================================
// 5. HISTORICAL ANALYTICS AGGREGATION
// ============================================================

/**
 * Generates an hourly summary document for a monitor.
 * Designed to be called by a cron job or after every N checks.
 * Stores aggregated metrics for trend analysis without raw data bloat.
 * 
 * @param {string} monitorId
 * @returns {Object} Hourly summary
 */
export async function generateHourlySummary(monitorId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const logs = await MonitorLog.find({
        monitor: monitorId,
        checkedAt: { $gte: oneHourAgo }
    }).select('status responseTime edgeLatency realLatency p50 p95 source histogram').lean();

    if (logs.length === 0) return null;

    const syntheticLogs = logs.filter(l => l.source === 'synthetic');
    const rumLogs = logs.filter(l => l.source === 'RUM');

    const calcStats = (arr, field) => {
        const vals = arr.map(l => l[field]).filter(v => v > 0);
        if (vals.length === 0) return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, count: 0 };
        const sorted = vals.sort((a, b) => a - b);
        const n = sorted.length;
        return {
            avg: Math.round(sorted.reduce((a, b) => a + b, 0) / n),
            min: sorted[0],
            max: sorted[n - 1],
            p50: sorted[Math.floor(n * 0.5)],
            p95: sorted[Math.min(Math.ceil(n * 0.95) - 1, n - 1)],
            count: n
        };
    };

    const total = logs.length;
    const upCount = logs.filter(l => l.status === 'UP').length;

    // Aggregate histograms from RUM flushes
    const aggregatedHistogram = { fast: 0, normal: 0, slow: 0, critical: 0 };
    for (const log of rumLogs) {
        if (log.histogram) {
            aggregatedHistogram.fast += (log.histogram.fast || 0);
            aggregatedHistogram.normal += (log.histogram.normal || 0);
            aggregatedHistogram.slow += (log.histogram.slow || 0);
            aggregatedHistogram.critical += (log.histogram.critical || 0);
        }
    }

    return {
        monitor: monitorId,
        period: 'hourly',
        timestamp: new Date(),
        uptime: Math.round((upCount / total) * 10000) / 100,
        totalChecks: total,
        synthetic: calcStats(syntheticLogs, 'responseTime'),
        syntheticEdge: calcStats(syntheticLogs, 'edgeLatency'),
        rum: calcStats(rumLogs, 'realLatency'),
        rumP50: calcStats(rumLogs, 'p50'),
        rumP95: calcStats(rumLogs, 'p95'),
        histogram: aggregatedHistogram
    };
}

// ============================================================
// 6. MASTER OBSERVABILITY HOOK
// ============================================================

/**
 * Single entry point called after each RUM flush.
 * Runs all luxury checks asynchronously without blocking the response.
 * 
 * @param {string} monitorId
 * @param {number} p50 - Current p50
 * @param {number} p95 - Current p95
 * @param {number} avg - Current average
 */
export async function runObservabilityChecks(monitorId, p50, p95, avg) {
    try {
        // 1. Smart consecutive-window alerting
        await evaluateConsecutiveBreaches(monitorId, p95);

        // 2. Anomaly detection on current average
        const anomaly = await detectAnomaly(monitorId, avg);
        if (anomaly.isAnomaly) {
            const dedupKey = `anomaly_${monitorId}_${new Date().toISOString().slice(0, 13)}`;
            try {
                await Alert.create({
                    monitor: monitorId,
                    type: 'anomaly',
                    severity: anomaly.deviation > 3 ? 'critical' : 'warning',
                    message: `[ANOMALY] Latency ${avg}ms is ${anomaly.deviation} stddevs above baseline (mean=${anomaly.mean}ms, threshold=${anomaly.threshold}ms)`,
                    deduplicationKey: dedupKey,
                    metadata: anomaly
                });
            } catch (e) {
                if (e.code !== 11000) throw e;
            }
        }

        // 3. SLO compliance check (lightweight: runs from cached DB queries)
        await checkSLOAndAlert(monitorId);

    } catch (err) {
        console.error('[OBSERVABILITY] Non-blocking check failed:', err.message);
    }
}

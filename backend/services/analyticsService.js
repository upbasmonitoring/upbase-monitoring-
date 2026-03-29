import mongoose from 'mongoose';
import MonitorLog from '../models/MonitorLog.js';
import Monitor from '../models/Monitor.js';

export const getProjectAnalytics = async (projectId, range = '24h', monitorFilterId = null) => {
    // 1. Determine Time Range
    let timeFilter = new Date();
    if (range === '1h') timeFilter.setHours(timeFilter.getHours() - 1);
    else if (range === '7d') timeFilter.setDate(timeFilter.getDate() - 7);
    else timeFilter.setDate(timeFilter.getDate() - 1); // 24h default

    // 2. Backward Compatibility: Fetch monitors to get their IDs
    const monitors = await Monitor.find({ project: projectId }).select('_id');
    const monitorIds = monitors.map(m => m._id);

    // 3. Query Setup for Project vs Single Monitor
    const query = { checkedAt: { $gte: timeFilter } };
    if (monitorFilterId) {
        query.monitor = monitorFilterId;
    } else {
        query.$or = [
            { project: projectId },
            { monitor: { $in: monitorIds } }
        ];
    }

    // 4. Fetch logs
    const logs = await MonitorLog.find(query).select('status latency statusCode checkedAt errorMessage').sort({ checkedAt: 1 }).lean();

    if (!logs.length) {
        return {
            uptimePercentage: 100,
            avgLatency: 0,
            p95Latency: 0,
            errorRate: 0,
            totalChecks: 0,
            downtimeEvents: 0,
            statusCodeDistribution: [],
            latencyTrend: [],
            errorTimeline: [],
            insights: []
        };
    }

    const totalChecks = logs.length;
    let upCount = 0;
    let totalLatency = 0;
    const latencies = [];
    const statusCodes = {};
    const latencyTrendMap = new Map();
    const errorTimelineMap = new Map();
    let downtimeEvents = 0;
    let wasDown = false;

    logs.forEach(log => {
        // Validation: Ignore data-points that are corrupt or missing critical fields
        if (!log.status || log.status === 'UNKNOWN') return;

        // Uptime & Errors
        if (log.status === 'UP') {
            upCount++;
            if (wasDown) wasDown = false;
        } else {
            if (!wasDown) {
                downtimeEvents++;
                wasDown = true;
            }
        }

        // Latency (Strict Filter: Only count if numeric and > 0)
        const lat = Number(log.latency);
        if (!isNaN(lat) && lat > 0) {
            totalLatency += lat;
            latencies.push(lat);
        }

        // Status Codes (Fall-back to 0 if missing)
        const code = Number(log.statusCode) || 0;
        statusCodes[code] = (statusCodes[code] || 0) + 1;

        // Bucketing (Time-series normalization)
        let groupKey;
        const d = new Date(log.checkedAt);
        if (range === '1h') {
            d.setSeconds(0, 0);
            groupKey = d.toISOString();
        } else if (range === '7d') {
            d.setHours(0, 0, 0, 0);
            groupKey = d.toISOString();
        } else {
            d.setMinutes(0, 0, 0); // Default 24h
            groupKey = d.toISOString();
        }

        // Latency Trend Aggregation
        if (!latencyTrendMap.has(groupKey)) {
            latencyTrendMap.set(groupKey, { sum: 0, count: 0 });
        }
        if (!isNaN(lat) && lat > 0) {
            const bucket = latencyTrendMap.get(groupKey);
            bucket.sum += lat;
            bucket.count += 1;
        }

        // Error Timeline Aggregation
        if (log.status !== 'UP') {
            errorTimelineMap.set(groupKey, (errorTimelineMap.get(groupKey) || 0) + 1);
        }
    });

    // Calculations
    const uptimePercentage = totalChecks > 0 ? ((upCount / totalChecks) * 100).toFixed(2) : 100;
    const errorRate = totalChecks > 0 ? (((totalChecks - upCount) / totalChecks) * 100).toFixed(2) : 0;
    const avgLatency = latencies.length > 0 ? Math.round(totalLatency / latencies.length) : 0;

    // P95 Calculation
    let p95Latency = 0;
    if (latencies.length > 0) {
        latencies.sort((a, b) => a - b);
        const p95Index = Math.floor(latencies.length * 0.95);
        p95Latency = latencies[p95Index];
    }

    // Format Charts Data
    const latencyTrend = Array.from(latencyTrendMap.entries()).map(([time, data]) => ({
        timestamp: time,
        avgLatency: Math.round(data.sum / data.count)
    }));

    const errorTimeline = Array.from(errorTimelineMap.entries()).map(([time, count]) => ({
        timestamp: time,
        errors: count
    }));

    const statusCodeDistribution = Object.entries(statusCodes).map(([code, count]) => ({
        name: code === '0' ? 'Network Error' : `HTTP ${code}`,
        value: count
    }));

    // AI/Smart Insights Generation
    const insights = [];
    if (errorRate > 10) {
        insights.push({ type: 'danger', message: `Critical error rate detected: ${errorRate}% of requests failed.` });
    }
    if (p95Latency > 2000) {
        insights.push({ type: 'warning', message: `Latencies are spiking! P95 is ${p95Latency}ms, indicating slow tails.` });
    }
    if (statusCodes['500'] || statusCodes['502'] || statusCodes['503']) {
        insights.push({ type: 'warning', message: 'Frequent unhandled server errors (50x) detected in the current range.' });
    }
    if (insights.length === 0) {
        insights.push({ type: 'success', message: 'System is stable. No significant anomalies detected.' });
    }

    return {
        uptimePercentage: parseFloat(uptimePercentage),
        avgLatency,
        p95Latency,
        errorRate: parseFloat(errorRate),
        totalChecks,
        downtimeEvents,
        statusCodeDistribution,
        latencyTrend,
        errorTimeline,
        insights
    };
};

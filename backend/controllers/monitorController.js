import Monitor from '../models/Monitor.js';
import MonitorLog from '../models/MonitorLog.js';
import Deployment from '../models/Deployment.js';
import Insight from '../models/Insight.js';
import HealingLog from '../models/HealingLog.js';
import Alert from '../models/Alert.js';
import asyncHandler from '../utils/asyncHandler.js';
import { checkSingleMonitor } from '../services/monitorService.js';
import { getRedisStatus } from '../config/redis.js';
import redis from '../config/redis.js';
import { runObservabilityChecks } from '../services/observabilityService.js';

/**
 * @desc    Create a new website monitor
 * @route   POST /api/monitors
 * @access  Private
 */
export const createMonitor = asyncHandler(async (req, res) => {
    const { name, url, frequency, successKeyword, apiUrl, failureKeywords, githubRepo, projectId } = req.body;

    if (!name || !url || !projectId) {
        res.status(400);
        throw new Error('Please provide name, URL and projectId');
    }

    const monitor = await Monitor.create({
        user: req.user._id,
        project: projectId,
        name,
        url,
        apiUrl: apiUrl || null,
        frequency: frequency || 30,
        successKeyword: successKeyword || null,
        failureKeywords: Array.isArray(failureKeywords) ? failureKeywords : (failureKeywords ? [failureKeywords] : []),
        githubRepo: githubRepo ? {
            owner: githubRepo.owner || null,
            repo: githubRepo.repo || null,
            branch: githubRepo.branch || 'main'
        } : undefined
    });

    // Trigger immediate check to avoid "PENDING" delay
    try {
        await checkSingleMonitor(monitor);
    } catch (err) {
        console.error(`[MONITOR] Startup check failed: ${err.message}`);
    }

    res.status(201).json(monitor);
});

/**
 * @desc    Get all monitors for the logged-in user
 * @route   GET /api/monitors
 * @access  Private
 */
export const getMonitors = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    let query = { user: req.user._id };
    if (projectId) query.project = projectId;
    
    const monitors = await Monitor.find(query);
    res.json(monitors);
});

/**
 * @desc    Get a single monitor by ID
 * @route   GET /api/monitors/:id
 * @access  Private
 */
export const getMonitorById = asyncHandler(async (req, res) => {
    const monitor = await Monitor.findById(req.params.id);

    if (!monitor) {
        res.status(404);
        throw new Error('Monitor not found');
    }

    // PRO: Sync daily reset on read
    const now = new Date();
    const lastRollback = monitor.lastRollbackAt ? new Date(monitor.lastRollbackAt) : null;
    const isSameDay = lastRollback && lastRollback.toDateString() === now.toDateString();
    
    if (!isSameDay && monitor.rollbackTodayCount > 0) {
        monitor.rollbackTodayCount = 0;
        await monitor.save();
    }

    if (monitor.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    res.json(monitor);
});

/**
 * @desc    Update a monitor
 * @route   PUT /api/monitors/:id
 * @access  Private
 */
export const updateMonitor = asyncHandler(async (req, res) => {
    const monitor = await Monitor.findById(req.params.id);

    if (!monitor) {
        res.status(404);
        throw new Error('Monitor not found');
    }

    // Ensure ownership
    if (monitor.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const { name, url, successKeyword, apiUrl, failureKeywords, frequency, githubRepo } = req.body;

    if (name) monitor.name = name;
    if (url) monitor.url = url;
    if (successKeyword !== undefined) monitor.successKeyword = successKeyword;
    if (apiUrl !== undefined) monitor.apiUrl = apiUrl;
    
    // Support either a string (from frontend input) or an array
    if (failureKeywords !== undefined) {
        if (Array.isArray(failureKeywords)) {
            monitor.failureKeywords = failureKeywords;
        } else if (typeof failureKeywords === 'string') {
            monitor.failureKeywords = failureKeywords ? [failureKeywords] : [];
        } else {
            monitor.failureKeywords = [];
        }
    }

    if (frequency) monitor.frequency = frequency;
    if (githubRepo) {
        monitor.githubRepo = {
            ...monitor.githubRepo,
            owner: githubRepo.owner,
            repo: githubRepo.repo,
            branch: githubRepo.branch || 'main'
        };
    }

    const updatedMonitor = await monitor.save();
    res.json(updatedMonitor);
});

/**
 * @desc    Get historical logs for a specific monitor (for the graph)
 * @route   GET /api/monitors/:id/logs
 * @access  Private
 */
export const getMonitorLogs = asyncHandler(async (req, res) => {
    const { range } = req.query;
    let query = { monitor: req.params.id };

    if (range) {
        const now = new Date();
        let startDate;

        if (range === '1h') startDate = new Date(now.getTime() - 60 * 60 * 1000);
        else if (range === '24h') startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        else if (range === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        if (startDate) {
            query.checkedAt = { $gte: startDate };
        }
    }

    const logs = await MonitorLog.find(query)
        .sort({ checkedAt: -1 })
        .limit(range ? 200 : 50);
    
    // BACKEND TASKS: 1. Collect all latency values
    const latencies = logs
        .map(log => log.latency || log.responseTime || 0)
        .filter(v => v > 0)
        .sort((a, b) => a - b);
    
    // 2. Calculate P50 (median)
    const p50Index = Math.floor(latencies.length * 0.5);
    const p50 = latencies[p50Index] || 0;

    // 3. Calculate P95
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95 = latencies[p95Index] || 0;

    // 4. Calculate average
    const avg = latencies.length > 0
        ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
        : 0;

    // Debugging Add
    console.log(`[LATENCY-AUTH] monitor=${req.params.id} samples=${latencies.length} p95=${p95} p50=${p50} avg=${Math.round(avg)}`);

    // 5. Return structured response
    res.json({
        avgLatency: Math.round(avg),
        p50: Math.round(p50),
        p95: Math.round(p95),
        totalSamples: latencies.length,
        logs: logs.map(log => ({
            ...log._doc,
            latency: log.latency || log.responseTime || 0,
            timestamp: log.checkedAt || log.createdAt || new Date()
        })).reverse()
    });
});



/**
 * @desc    Delete a monitor
 * @route   DELETE /api/monitors/:id
 * @access  Private
 */
export const deleteMonitor = asyncHandler(async (req, res) => {
    const monitor = await Monitor.findById(req.params.id);

    if (!monitor) {
        res.status(404);
        throw new Error('Monitor not found');
    }

    // Ensure ownership
    if (monitor.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized to delete this monitor');
    }

    await monitor.deleteOne();
    
    // Also cleanup logs
    await MonitorLog.deleteMany({ monitor: req.params.id });

    res.json({ message: 'Monitor and history removed' });
});

/**
 * @desc    Get aggregate stats for dashboard overview
 * @route   GET /api/monitors/stats
 * @access  Private
 */
export const getMonitorStats = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    let query = { user: req.user._id };
    if (projectId) query.project = projectId;

    const monitors = await Monitor.find(query);
    
    const total = monitors.length;
    const active = monitors.filter(m => m.status === 'UP').length;
    const down = monitors.filter(m => m.status === 'DOWN').length;
    
    // Average response time across all monitors
    const avgResponseTime = total > 0 
        ? Math.round(monitors.reduce((acc, m) => acc + (m.responseTime || 0), 0) / total)
        : 0;

    res.json({
        total,
        active,
        down,
        avgResponseTime
    });
});

/**
 * @desc    Get recent interesting events (incidents and recoveries)
 * @route   GET /api/monitors/events
 * @access  Private
 */
export const getRecentEvents = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    let queryMonitors = { user: req.user._id };
    if (projectId) queryMonitors.project = projectId;

    const userMonitors = await Monitor.find(queryMonitors).select('_id');
    const ids = userMonitors.map(m => m._id);

    const logs = await MonitorLog.find({ 
        monitor: { $in: ids },
        status: { $ne: 'UP' } // Focus on DOWN/SLOW
    })
    .populate('monitor', 'name url')
    .sort({ checkedAt: -1 })
    .limit(10);

    res.json(logs);
});

/**
 * @desc    Get all deployment history for the user's monitors
 * @route   GET /api/monitors/deployments
 * @access  Private
 */
export const getDeployments = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    let queryMonitors = { user: req.user._id };
    if (projectId) queryMonitors.project = projectId;

    const userMonitors = await Monitor.find(queryMonitors).select('_id githubRepo');
    const ids = userMonitors.map(m => m._id);

    // 1. Try local Deployment records first
    const localDeployments = await Deployment.find({ monitor: { $in: ids } })
        .populate('monitor', 'name')
        .sort({ createdAt: -1 })
        .limit(50);

    if (localDeployments.length > 0) {
        return res.json(localDeployments);
    }

    // 2. No local records — fetch from GitHub API directly
    // This covers cases where webhook isn't configured (localhost dev, etc.)
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user._id).select('+github.accessToken');
    const token = user?.github?.accessToken;

    if (!token) {
        return res.json([]); // No GitHub token, can't fetch
    }

    const allGitDeployments = [];

    for (const monitor of userMonitors) {
        const { owner, repo, branch } = monitor.githubRepo || {};
        if (!owner || !repo) continue;

        try {
            const axios = (await import('axios')).default;
            const headers = {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json'
            };

            const commitsRes = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch || 'main'}&per_page=20`,
                { headers, timeout: 10000 }
            );

            for (const commit of commitsRes.data) {
                allGitDeployments.push({
                    _id: commit.sha,
                    monitor: { _id: monitor._id, name: monitor.githubRepo?.repo || 'Unknown' },
                    repo: `${owner}/${repo}`,
                    branch: branch || 'main',
                    commitSha: commit.sha,
                    commitMessage: commit.commit?.message || 'No message',
                    status: 'SUCCESS', // Commits on branch are considered deployed
                    healthStatus: 'NOT_CHECKED',
                    createdAt: commit.commit?.committer?.date || new Date().toISOString(),
                });
            }
        } catch (err) {
            console.error(`[DEPLOYMENTS] GitHub fetch failed for ${monitor.githubRepo?.repo}: ${err.message}`);
        }
    }

    // Sort by date, newest first
    allGitDeployments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allGitDeployments.slice(0, 50));
});

/**
 * @desc    Get currently active critical alerts
 * @route   GET /api/monitors/alerts/active
 * @access  Private
 */
export const getActiveAlerts = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    
    // Find alerts that are 'active' for monitors owned by this user
    let monQuery = { user: req.user._id };
    if (projectId) monQuery.project = projectId;
    const userMonitors = await Monitor.find(monQuery).select('_id');
    const ids = userMonitors.map(m => m._id);

    const activeAlerts = await Alert.find({ 
        monitor: { $in: ids },
        status: 'active' 
    })
    .populate('monitor', 'name url status responseTime failureStartedAt')
    .sort({ triggeredAt: -1 });

    res.json(activeAlerts);
});

/**
 * @desc    Get complete alert history (incidents and slowness)
 * @route   GET /api/monitors/alerts/history
 * @access  Private
 */
export const getAlertHistory = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    
    let monQuery = { user: req.user._id };
    if (projectId) monQuery.project = projectId;
    const userMonitors = await Monitor.find(monQuery).select('_id');
    const ids = userMonitors.map(m => m._id);

    const history = await Alert.find({ 
        monitor: { $in: ids }
    })
    .populate('monitor', 'name url')
    .sort({ triggeredAt: -1 })
    .limit(50);

    res.json(history);
});

export const getSelfHealingLogs = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    let queryMonitors = { user: req.user._id };
    if (projectId) queryMonitors.project = projectId;

    const userMonitors = await Monitor.find(queryMonitors).select('_id');
    const ids = userMonitors.map(m => m._id);

    const healingLogs = await HealingLog.find({ monitor: { $in: ids } })
        .populate('monitor', 'name')
        .sort({ startedAt: -1 })
        .limit(30);

    res.json(healingLogs);
});

/**
 * @desc    Manually trigger self-healing/recovery
 * @route   POST /api/monitors/:id/recover
 * @access  Private
 */
export const triggerManualRecovery = asyncHandler(async (req, res) => {
    const monitor = await Monitor.findById(req.params.id);

    if (!monitor) {
        res.status(404);
        throw new Error('Monitor not found');
    }

    const { addIncidentEvent } = await import('../services/incidentService.js');
    await addIncidentEvent(monitor._id, 'MANUAL_CHECK', `User-initiated diagnostic recovery manually triggered from the telemetry dash.`);

    // --- 🧠 Trigger Ralph Loop (New System) ---
    const { triggerRalphLoop } = await import('../services/ralphService.js');
    triggerRalphLoop(monitor._id); // Async trigger

    res.json({ success: true, message: 'Ralph Intelligence Analysis Loop initiated.' });
});

/**
 * @desc Get Smart Insights/Anomalies for a monitor
 * @route GET /api/monitors/:id/insights
 */
export const getMonitorInsights = asyncHandler(async (req, res) => {
    const insights = await Insight.find({ monitor: req.params.id })
        .sort({ createdAt: -1 })
        .limit(10);
    res.json(insights);
});

/**
 * @desc    Get incident history and timeline for a monitor
 * @route   GET /api/monitors/:id/incidents
 * @access  Private
 */
export const getMonitorIncidentTimeline = asyncHandler(async (req, res) => {
    const { getMonitorIncidents } = await import('../services/incidentService.js');
    const incidents = await getMonitorIncidents(req.params.id);
    res.json(incidents);
});

/**
 * @desc    Toggle the auto-healing state (Pause/Resume)
 * @route   PUT /api/monitors/:id/healing/toggle
 * @access  Private
 */
export const toggleAutoHeal = asyncHandler(async (req, res) => {
    const monitor = await Monitor.findById(req.params.id);

    if (!monitor) {
        res.status(404);
        throw new Error('Monitor not found');
    }

    // Ensure ownership
    if (monitor.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    monitor.autoHealPaused = !monitor.autoHealPaused;
    
    // PRO: If user is "Forcing Auto Mode ON", we reset their daily limit
    if (!monitor.autoHealPaused) {
        monitor.rollbackTodayCount = 0;
    }
    
    const updatedMonitor = await monitor.save();
    
    res.json({
        message: monitor.autoHealPaused ? 'Auto-healing paused' : 'Auto-healing resumed (Counter Reset)',
        autoHealPaused: updatedMonitor.autoHealPaused,
        rollbackTodayCount: updatedMonitor.rollbackTodayCount
    });
});

/**
 * @desc    Silence alerts for a monitor
 * @route   PUT /api/monitors/:id/silence
 * @access  Private
 */
export const silenceMonitor = asyncHandler(async (req, res) => {
    const monitor = await Monitor.findById(req.params.id);

    if (!monitor) {
        res.status(404);
        throw new Error('Monitor not found');
    }

    // Ensure ownership
    if (monitor.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const { duration } = req.body; // duration in minutes, or '0' to unsilence
    
    if (duration === 0) {
        monitor.silenceUntil = null;
    } else {
        const until = new Date();
        const mins = parseInt(duration) || 60;
        until.setMinutes(until.getMinutes() + mins);
        monitor.silenceUntil = until;
    }

    const updatedMonitor = await monitor.save();
    
    res.json({
        message: duration === 0 ? 'Alerts unsilenced' : `Alerts silenced for ${duration} minutes`,
        silenceUntil: updatedMonitor.silenceUntil
    });
});

/**
 * @desc Get global intelligence feed across all monitors
 * @route GET /api/monitors/intelligence/feed
 */
export const getGlobalIntelligence = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    let queryMonitors = { user: req.user._id };
    if (projectId) queryMonitors.project = projectId;

    const userMonitors = await Monitor.find(queryMonitors).select('_id');
    const ids = userMonitors.map(m => m._id);

    const feed = await HealingLog.find({ 
        monitor: { $in: ids },
        'analysis.cause': { $ne: null } // Only show things Ralph actually analyzed
    })
    .populate('monitor', 'name url')
    .sort({ startedAt: -1 })
    .limit(20);

    res.json(feed);
});

/**
 * @desc Ingest Real User Monitoring (RUM) Telemetry
 * @route POST /api/monitors/rum/telemetry
 * @access Public
 */
export const ingestRumTelemetry = asyncHandler(async (req, res) => {
    // ============================================================
    // 1. SECURITY: x-rum-key Token + Origin Validation
    // ============================================================
    const rumKey = req.headers['x-rum-key'];
    const expectedKey = process.env.RUM_SECRET || 'sentinel-rum-key-2026';
    if (!rumKey || rumKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing X-RUM-KEY.' });
    }

    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    let payload;
    try {
        payload = typeof req.body === 'object' && Object.keys(req.body).length > 0 ? req.body : JSON.parse(bodyStr);
    } catch {
        return res.status(400).json({ error: 'Malformed telemetry payload' });
    }

    const { url, ttfb, domLoad, fullLoad, userAgent, connection } = payload;
    if (!url || domLoad == null || domLoad < 0) {
        return res.status(400).json({ error: 'Missing strict telemetry constraints' });
    }

    // ============================================================
    // 2. URL NORMALIZATION & ORIGIN SECURITY
    // ============================================================
    let baseUrl;
    try {
        baseUrl = new URL(url).origin;
        const reqOrigin = req.get('origin') || req.get('referer');
        if (reqOrigin && new URL(reqOrigin).origin !== baseUrl) {
            return res.status(403).json({ error: 'CORB/Origin Mismatch' });
        }
    } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    const monitor = await Monitor.findOne({
        url: { $regex: new RegExp('^' + baseUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
    }).select('_id');

    if (!monitor) return res.status(404).json({ error: 'Monitor not registered' });

    // ============================================================
    // 3. OUTLIER CONTROL
    // ============================================================
    if (domLoad > 60000) return res.status(202).json({ message: 'Outlier rejected' });
    const finalLatency = Math.min(Math.round(domLoad), 15000);

    // ============================================================
    // 4. ATOMIC REDIS SLIDING WINDOW (Lua Script)
    // ============================================================
    const mId = monitor._id.toString();
    const ENV_PREFIX = process.env.NODE_ENV || 'dev';
    const redisKey = `rum:${ENV_PREFIX}:${mId}`;
    const WINDOW_SIZE = 20;
    const TTL_SECONDS = 300; // 5 min

    // Lua script: Atomic LPUSH + conditional EXPIRE (set TTL only on first insert)
    // This eliminates the EXISTS+EXPIRE race condition entirely.
    const LUA_PUSH_SCRIPT = `
        local key = KEYS[1]
        local value = ARGV[1]
        local ttl = tonumber(ARGV[2])
        redis.call('LPUSH', key, value)
        if redis.call('TTL', key) == -1 then
            redis.call('EXPIRE', key, ttl)
        end
        return redis.call('LLEN', key)
    `;

    try {
        // --- Step A: Atomic push with conditional TTL ---
        const queueLength = await redis.eval(LUA_PUSH_SCRIPT, 1, redisKey, finalLatency, TTL_SECONDS);

        if (queueLength >= WINDOW_SIZE) {
            // --- Step B: Atomic read + trim (MULTI/EXEC) ---
            const txRead = redis.multi();
            txRead.lrange(redisKey, 0, WINDOW_SIZE - 1);
            txRead.ltrim(redisKey, WINDOW_SIZE, -1);
            const txResults = await txRead.exec();

            const rawData = txResults[0][1];
            if (!rawData || rawData.length === 0) {
                return res.status(200).json({ message: 'Buffer drained by sibling instance' });
            }

            const sorted = rawData.map(Number).filter(v => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
            const n = sorted.length;

            if (n === 0) {
                return res.status(200).json({ message: 'No valid samples after NaN filter' });
            }

            // ============================================================
            // 5. PERCENTILE MATH (with small-sample fallback + NaN guard)
            // ============================================================
            let p50, p95, avg;
            avg = Math.round(sorted.reduce((a, b) => a + b, 0) / n);

            if (n < 10) {
                p50 = avg;
                p95 = sorted[n - 1];
            } else {
                p50 = sorted[Math.floor(n * 0.50)];
                const p95Idx = Math.min(Math.ceil(n * 0.95) - 1, n - 1); // Bounds-safe
                p95 = sorted[p95Idx];
            }

            // ============================================================
            // 6. STRUCTURED HISTOGRAM (queryable JSON)
            // ============================================================
            const histogram = { fast: 0, normal: 0, slow: 0, critical: 0 };
            for (const val of sorted) {
                if (val <= 100) histogram.fast++;
                else if (val <= 300) histogram.normal++;
                else if (val <= 1000) histogram.slow++;
                else histogram.critical++;
            }

            const rumSummary = `[RUM] n=${n} p50=${p50}ms p95=${p95}ms avg=${avg}ms | ${connection || '?'}`;

            // ============================================================
            // 7. PERSIST (Synthetic vs RUM strictly separated)
            // ============================================================
            await MonitorLog.create({
                monitor: monitor._id,
                status: 'UP',
                responseTime: p50,
                edgeLatency: 0,
                realLatency: avg,
                p50,
                p95,
                source: 'RUM',
                histogram,
                errorMessage: rumSummary
            });

            // ============================================================
            // 8. OBSERVABILITY INTELLIGENCE (non-blocking async)
            // Runs: consecutive-window alerting, anomaly detection, SLO checks
            // ============================================================
            runObservabilityChecks(monitor._id.toString(), p50, p95, avg).catch(() => {});
        }
    } catch (err) {
        console.error('[RUM-REDIS] Pipeline failure:', err.message);
    }

    res.status(200).json({ message: 'RUM telemetry ingested' });
});


import Log from '../models/Log.js';
import Trace from '../models/Trace.js';
import { detectRootCause } from './rootCauseRules.js';
import logger from '../utils/logger.js';

// ─── Severity weights for comparison ─────────────────────────────
const SEV_WEIGHT = { info: 0, warning: 1, error: 2, critical: 3 };

/**
 * Correlation Engine — Core service for trace correlation
 * 
 * Responsibilities:
 *  1. Aggregate logs by trace_id
 *  2. Build ordered timelines
 *  3. Run root cause detection
 *  4. Persist Trace summaries
 */

/**
 * Correlate a trace: fetch all logs with the given trace_id,
 * build timeline, detect root cause, and persist as a Trace document.
 * 
 * @param {string} traceId - The trace_id to correlate
 * @returns {Object} The created/updated Trace document
 */
export async function correlateTrace(traceId) {
  if (!traceId) throw new Error('trace_id is required');

  // 1. Fetch all logs for this trace, ordered by timestamp
  const logs = await Log.find({ trace_id: traceId })
    .sort({ timestamp: 1 })
    .lean();

  if (logs.length === 0) {
    logger.warn(`[CORRELATE] No logs found for trace_id: ${traceId}`);
    return null;
  }

  // 2. Build the timeline
  const timeline = logs.map((log) => ({
    log_id: log._id,
    timestamp: log.timestamp,
    type: log.type,
    source: log.source,
    service: log.service,
    severity: log.severity,
    message: log.message,
    metadata: log.metadata,
  }));

  // 3. Compute summary stats
  const typesInvolved = [...new Set(logs.map(l => l.type))];
  let maxSeverity = 'info';
  for (const log of logs) {
    if ((SEV_WEIGHT[log.severity] || 0) > (SEV_WEIGHT[maxSeverity] || 0)) {
      maxSeverity = log.severity;
    }
  }

  const firstSeen = logs[0].timestamp;
  const lastSeen = logs[logs.length - 1].timestamp;
  const durationMs = new Date(lastSeen) - new Date(firstSeen);

  // 4. Run root cause detection
  const rootCause = detectRootCause(logs);

  // 5. Extract enrichment from first log that has it
  const projectId = logs.find(l => l.project_id)?.project_id || null;
  const environment = logs.find(l => l.environment)?.environment || null;
  const isDemo = logs.some(l => l.metadata?.is_demo === true);

  // 6. Upsert the Trace document (idempotent — re-running is safe)
  const traceData = {
    trace_id: traceId,
    timeline,
    log_count: logs.length,
    types_involved: typesInvolved,
    max_severity: maxSeverity,
    root_cause: {
      category: rootCause.category,
      description: rootCause.description,
      matched_rule: rootCause.rule?.id || null,
      confidence: rootCause.confidence,
      source_log_id: rootCause.source_log?._id || null,
    },
    impact_level: rootCause.impact,
    first_seen: firstSeen,
    last_seen: lastSeen,
    duration_ms: durationMs,
    project_id: projectId,
    environment,
    is_demo: isDemo,
  };

  const trace = await Trace.findOneAndUpdate(
    { trace_id: traceId },
    { $set: traceData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.info(`[CORRELATE] Trace ${traceId}: ${logs.length} logs, root_cause=${rootCause.category} (${rootCause.confidence}), impact=${rootCause.impact}`);

  return trace;
}

/**
 * Batch correlate: find all distinct trace_ids that have uncorrelated logs
 * (logs newer than the last trace update) and re-correlate them.
 * 
 * @param {Object} opts
 * @param {number} [opts.limit=50] - Maximum traces to process per run
 * @param {Date}   [opts.since]    - Only process traces with logs since this time
 * @returns {Array} Array of correlated trace documents
 */
export async function batchCorrelate({ limit = 50, since = null } = {}) {
  const match = { trace_id: { $ne: null, $exists: true } };
  if (since) {
    match.timestamp = { $gte: since };
  }

  // Find distinct trace_ids from recent logs
  const traceIds = await Log.distinct('trace_id', match);

  if (traceIds.length === 0) {
    logger.info('[CORRELATE] No traces to process');
    return [];
  }

  const toProcess = traceIds.slice(0, limit);
  logger.info(`[CORRELATE] Processing ${toProcess.length} traces (of ${traceIds.length} found)`);

  const results = [];
  for (const traceId of toProcess) {
    try {
      const trace = await correlateTrace(traceId);
      if (trace) results.push(trace);
    } catch (err) {
      logger.error(`[CORRELATE] Failed to process trace ${traceId}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Get a fully hydrated trace by trace_id.
 * Returns the Trace document with full timeline.
 * 
 * @param {string} traceId
 * @param {boolean} [forceRefresh=false] - Re-correlate before returning
 * @returns {Object|null}
 */
export async function getTrace(traceId, forceRefresh = false) {
  if (forceRefresh) {
    await correlateTrace(traceId);
  }

  let trace = await Trace.findOne({ trace_id: traceId }).lean();

  // Auto-correlate if not cached
  if (!trace) {
    const correlated = await correlateTrace(traceId);
    if (!correlated) return null;
    trace = correlated.toObject ? correlated.toObject() : correlated;
  }

  return trace;
}

/**
 * Get recent error traces with root cause summary.
 * 
 * @param {Object} opts
 * @param {string} [opts.project_id]
 * @param {string} [opts.environment]
 * @param {number} [opts.limit=20]
 * @param {string} [opts.severity] - Minimum severity filter
 * @returns {Array}
 */
export async function getRecentErrors({
  project_id,
  environment,
  limit = 20,
  severity = 'error',
} = {}) {
  const filter = {
    max_severity: { $in: getMinSeverities(severity) },
  };
  if (project_id) filter.project_id = project_id;
  if (environment) filter.environment = environment;

  return Trace.find(filter)
    .sort({ last_seen: -1 })
    .limit(Math.min(limit, 100))
    .select('-timeline') // Exclude full timeline for list view
    .lean();
}

/**
 * Get root cause summary — grouped counts of root cause categories.
 * 
 * @param {Object} opts
 * @param {string} [opts.project_id]
 * @param {string} [opts.environment]
 * @param {Date}   [opts.from]
 * @param {Date}   [opts.to]
 * @returns {Object}
 */
export async function getRootCauseSummary({
  project_id,
  environment,
  from,
  to,
} = {}) {
  const match = {};
  if (project_id) match.project_id = project_id;
  if (environment) match.environment = environment;
  if (from || to) {
    match.last_seen = {};
    if (from) match.last_seen.$gte = new Date(from);
    if (to) match.last_seen.$lte = new Date(to);
  }

  const [byCategory, byImpact, total] = await Promise.all([
    Trace.aggregate([
      { $match: match },
      { $group: {
        _id: '$root_cause.category',
        count: { $sum: 1 },
        latest: { $max: '$last_seen' },
        avg_duration_ms: { $avg: '$duration_ms' },
      }},
      { $sort: { count: -1 } },
    ]),
    Trace.aggregate([
      { $match: match },
      { $group: { _id: '$impact_level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Trace.countDocuments(match),
  ]);

  return {
    total_traces: total,
    by_category: byCategory.map(r => ({
      category: r._id,
      count: r.count,
      latest: r.latest,
      avg_duration_ms: Math.round(r.avg_duration_ms),
    })),
    by_impact: Object.fromEntries(byImpact.map(r => [r._id, r.count])),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────
function getMinSeverities(minSeverity) {
  const order = ['info', 'warning', 'error', 'critical'];
  const idx = order.indexOf(minSeverity);
  return idx >= 0 ? order.slice(idx) : ['error', 'critical'];
}

export default {
  correlateTrace,
  batchCorrelate,
  getTrace,
  getRecentErrors,
  getRootCauseSummary,
};

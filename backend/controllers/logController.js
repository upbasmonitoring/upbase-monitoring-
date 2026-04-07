import Log from '../models/Log.js';
import logger from '../utils/logger.js';
import { correlateTrace } from '../services/correlationEngine.js';

// ─── Constants ──────────────────────────────────────────────────
const VALID_TYPES = ['frontend', 'backend', 'system'];
const VALID_SEVERITIES = ['info', 'warning', 'error', 'critical'];
const VALID_ENVIRONMENTS = ['production', 'staging', 'development', 'test'];
const MAX_BATCH_SIZE = 100;

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Validate a single log object and return { valid, errors, normalized }
 */
function validateLog(logEntry) {
  const errors = [];

  // type — required, strict enum
  if (!logEntry.type) {
    errors.push('Missing required field: type');
  } else if (!VALID_TYPES.includes(logEntry.type)) {
    errors.push(`Invalid type "${logEntry.type}". Allowed: ${VALID_TYPES.join(', ')}`);
  }

  // source — required
  if (!logEntry.source || (typeof logEntry.source === 'string' && !logEntry.source.trim())) {
    errors.push('Missing required field: source');
  }

  // severity — required, strict enum
  if (!logEntry.severity) {
    errors.push('Missing required field: severity');
  } else if (!VALID_SEVERITIES.includes(logEntry.severity)) {
    errors.push(`Invalid severity "${logEntry.severity}". Allowed: ${VALID_SEVERITIES.join(', ')}`);
  }

  // message — required
  if (!logEntry.message || (typeof logEntry.message === 'string' && !logEntry.message.trim())) {
    errors.push('Missing required field: message');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Normalize
  const normalized = {
    type: logEntry.type,
    source: logEntry.source.trim(),
    service: logEntry.service?.trim() || null,
    severity: logEntry.severity,
    message: logEntry.message.trim(),
    metadata: logEntry.metadata && typeof logEntry.metadata === 'object' ? logEntry.metadata : {},
    trace_id: logEntry.trace_id?.trim() || null,
    timestamp: logEntry.timestamp ? new Date(logEntry.timestamp) : new Date(),
    // Enrichment fields (Phase 2)
    project_id: logEntry.project_id?.trim() || null,
    environment: VALID_ENVIRONMENTS.includes(logEntry.environment) ? logEntry.environment : null,
    region: logEntry.region?.trim() || null,
  };

  // Validate timestamp is a real date
  if (isNaN(normalized.timestamp.getTime())) {
    normalized.timestamp = new Date();
  }

  return { valid: true, normalized };
}

// ─── Controllers ────────────────────────────────────────────────

/**
 * POST /api/logs
 * Accepts a single log or an array of logs (batch ingestion).
 */
export const ingestLogs = async (req, res) => {
  try {
    const isBatch = Array.isArray(req.body);
    const rawLogs = isBatch ? req.body : [req.body];

    // Guard against oversized batches
    if (rawLogs.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} logs per request`,
      });
    }

    if (rawLogs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is empty. Provide a log object or array of logs.',
      });
    }

    const results = { accepted: 0, rejected: 0, errors: [] };
    const toInsert = [];

    for (let i = 0; i < rawLogs.length; i++) {
      const { valid, errors, normalized } = validateLog(rawLogs[i]);
      if (valid) {
        // Tag who ingested this log
        normalized.ingested_by = req.logApiKeyId || 'anonymous';
        toInsert.push(normalized);
        results.accepted++;
      } else {
        results.rejected++;
        results.errors.push({ index: i, errors });
      }
    }

    // Bulk insert valid logs
    let insertedDocs = [];
    if (toInsert.length > 0) {
      insertedDocs = await Log.insertMany(toInsert, { ordered: false });
      logger.info(`[LOG-INGEST] Inserted ${insertedDocs.length} logs (${results.rejected} rejected)`);

      // ─── Auto-correlate traces (fire-and-forget) ────────────
      const traceIds = [...new Set(toInsert.filter(l => l.trace_id).map(l => l.trace_id))];
      if (traceIds.length > 0) {
        // Don't block the response — correlate in the background
        setImmediate(async () => {
          for (const tid of traceIds) {
            try {
              await correlateTrace(tid);
            } catch (err) {
              logger.warn(`[LOG-INGEST] Auto-correlation failed for ${tid}: ${err.message}`);
            }
          }
        });
      }
    }

    const statusCode = results.rejected > 0 && results.accepted === 0 ? 400 : 
                        results.rejected > 0 ? 207 : 201;

    return res.status(statusCode).json({
      success: results.accepted > 0,
      accepted: results.accepted,
      rejected: results.rejected,
      ...(results.errors.length > 0 && { errors: results.errors }),
      ...(insertedDocs.length > 0 && {
        ids: insertedDocs.map((d) => d._id),
      }),
    });
  } catch (err) {
    logger.error('[LOG-INGEST] Ingestion failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error during log ingestion' });
  }
};

/**
 * GET /api/logs
 * Query logs with filters: type, severity, trace_id, source, service,
 * time range (from/to), with cursor-based pagination.
 */
export const queryLogs = async (req, res) => {
  try {
    const {
      type,
      severity,
      trace_id,
      source,
      service,
      project_id,
      environment,
      from,       // ISO timestamp
      to,         // ISO timestamp
      limit = 50,
      cursor,     // last _id for cursor pagination
      sort = 'desc',
    } = req.query;

    const filter = {};

    // Type filter (supports comma-separated: "frontend,backend")
    if (type) {
      const types = type.split(',').map((t) => t.trim()).filter((t) => VALID_TYPES.includes(t));
      if (types.length === 1) filter.type = types[0];
      else if (types.length > 1) filter.type = { $in: types };
    }

    // Severity filter
    if (severity) {
      const sevs = severity.split(',').map((s) => s.trim()).filter((s) => VALID_SEVERITIES.includes(s));
      if (sevs.length === 1) filter.severity = sevs[0];
      else if (sevs.length > 1) filter.severity = { $in: sevs };
    }

    if (trace_id) filter.trace_id = trace_id.trim();
    if (source) filter.source = { $regex: source.trim(), $options: 'i' };
    if (service) filter.service = { $regex: service.trim(), $options: 'i' };
    if (project_id) filter.project_id = project_id.trim();
    if (environment) filter.environment = environment.trim();

    // Time range
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    // Cursor-based pagination
    if (cursor) {
      filter._id = sort === 'desc' ? { $lt: cursor } : { $gt: cursor };
    }

    const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const sortDir = sort === 'asc' ? 1 : -1;

    const logs = await Log.find(filter)
      .sort({ timestamp: sortDir, _id: sortDir })
      .limit(pageLimit)
      .lean();

    const nextCursor = logs.length === pageLimit ? logs[logs.length - 1]._id : null;

    return res.status(200).json({
      success: true,
      count: logs.length,
      next_cursor: nextCursor,
      data: logs,
    });
  } catch (err) {
    logger.error('[LOG-QUERY] Query failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error during log query' });
  }
};

/**
 * GET /api/logs/stats
 * Returns aggregated statistics: counts by type and severity.
 */
export const getLogStats = async (req, res) => {
  try {
    const { from, to, project_id, environment } = req.query;
    const match = {};
    if (project_id) match.project_id = project_id.trim();
    if (environment) match.environment = environment.trim();
    if (from || to) {
      match.timestamp = {};
      if (from) match.timestamp.$gte = new Date(from);
      if (to) match.timestamp.$lte = new Date(to);
    }

    const [byType, bySeverity, total] = await Promise.all([
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Log.countDocuments(match),
    ]);

    return res.status(200).json({
      success: true,
      total,
      by_type: Object.fromEntries(byType.map((r) => [r._id, r.count])),
      by_severity: Object.fromEntries(bySeverity.map((r) => [r._id, r.count])),
    });
  } catch (err) {
    logger.error('[LOG-STATS] Stats query failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error during stats query' });
  }
};

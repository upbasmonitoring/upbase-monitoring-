import {
  correlateTrace,
  batchCorrelate,
  getTrace,
  getRecentErrors,
  getRootCauseSummary,
} from '../services/correlationEngine.js';
import logger from '../utils/logger.js';

/**
 * GET /api/traces/:trace_id
 * Returns the full correlated timeline for a trace.
 * Query param: ?refresh=true to force re-correlation.
 */
export const getTraceById = async (req, res) => {
  try {
    const { trace_id } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    if (!trace_id || trace_id.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'trace_id is required' });
    }

    const trace = await getTrace(trace_id.trim(), forceRefresh);

    if (!trace) {
      return res.status(404).json({
        success: false,
        error: `No logs found for trace_id: ${trace_id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: trace,
    });
  } catch (err) {
    logger.error('[TRACE-API] getTraceById failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/traces/:trace_id/correlate
 * Manually trigger correlation for a specific trace.
 */
export const triggerCorrelation = async (req, res) => {
  try {
    const { trace_id } = req.params;

    if (!trace_id || trace_id.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'trace_id is required' });
    }

    const trace = await correlateTrace(trace_id.trim());

    if (!trace) {
      return res.status(404).json({
        success: false,
        error: `No logs found for trace_id: ${trace_id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: trace,
    });
  } catch (err) {
    logger.error('[TRACE-API] triggerCorrelation failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/traces/batch-correlate
 * Trigger batch correlation of recent traces.
 * Body: { limit, since }
 */
export const triggerBatchCorrelation = async (req, res) => {
  try {
    const { limit = 50, since } = req.body || {};

    const results = await batchCorrelate({
      limit: Math.min(parseInt(limit, 10) || 50, 200),
      since: since ? new Date(since) : null,
    });

    return res.status(200).json({
      success: true,
      processed: results.length,
      traces: results.map((t) => ({
        trace_id: t.trace_id,
        log_count: t.log_count,
        root_cause: t.root_cause?.category,
        impact_level: t.impact_level,
        duration_ms: t.duration_ms,
      })),
    });
  } catch (err) {
    logger.error('[TRACE-API] batchCorrelation failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/traces/errors
 * List recent error traces with root cause info.
 * Query: ?project_id=X&environment=Y&limit=20&severity=error
 */
export const listRecentErrors = async (req, res) => {
  try {
    const { project_id, environment, limit = 20, severity = 'error' } = req.query;

    const errors = await getRecentErrors({
      project_id: project_id?.trim(),
      environment: environment?.trim(),
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      severity: severity?.trim(),
    });

    return res.status(200).json({
      success: true,
      count: errors.length,
      data: errors,
    });
  } catch (err) {
    logger.error('[TRACE-API] listRecentErrors failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/traces/root-cause-summary
 * Aggregated root cause categories with counts.
 * Query: ?project_id=X&environment=Y&from=ISO&to=ISO
 */
export const rootCauseSummary = async (req, res) => {
  try {
    const { project_id, environment, from, to } = req.query;

    const summary = await getRootCauseSummary({
      project_id: project_id?.trim(),
      environment: environment?.trim(),
      from: from || undefined,
      to: to || undefined,
    });

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    logger.error('[TRACE-API] rootCauseSummary failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

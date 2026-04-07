import { analyzeTrace, analyzePatterns } from '../services/aiAnalysisService.js';
import { createAction, confirmAndExecute, recordFeedback, getActionHistory } from '../services/actionEngine.js';
import logger from '../utils/logger.js';

/**
 * POST /api/analyze
 * Analyze a trace — returns AI explanation + rule-based suggestions + fix options.
 * Body: { trace_id, force_refresh? }
 */
export const analyzeTraceEndpoint = async (req, res) => {
  try {
    const { trace_id, force_refresh = false } = req.body || {};

    if (!trace_id) {
      return res.status(400).json({ success: false, error: 'trace_id is required in request body' });
    }

    const result = await analyzeTrace(trace_id.trim(), { forceRefresh: force_refresh });

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    logger.error('[ANALYSIS-API] analyzeTrace failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error during analysis' });
  }
};

/**
 * POST /api/analyze/patterns
 * Analyze recent error patterns across all traces.
 * Body: { project_id?, environment?, limit? }
 */
export const analyzePatternsEndpoint = async (req, res) => {
  try {
    const { project_id, environment, limit = 15 } = req.body || {};

    const result = await analyzePatterns({
      project_id: project_id?.trim(),
      environment: environment?.trim(),
      limit: Math.min(parseInt(limit, 10) || 15, 50),
    });

    return res.status(200).json(result);
  } catch (err) {
    logger.error('[ANALYSIS-API] analyzePatterns failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error during pattern analysis' });
  }
};

/**
 * POST /api/action
 * Create a pending action (requires confirmation).
 * Body: { action_id, trace_id?, project_id?, environment? }
 */
export const createActionEndpoint = async (req, res) => {
  try {
    const { action_id, trace_id, project_id, environment } = req.body || {};

    if (!action_id) {
      return res.status(400).json({ success: false, error: 'action_id is required' });
    }

    const result = await createAction({
      action_id: action_id.trim(),
      trace_id: trace_id?.trim(),
      project_id: project_id?.trim(),
      environment: environment?.trim(),
      triggered_by: req.logApiKeyId || 'user',
    });

    return res.status(result.success ? 201 : 400).json(result);
  } catch (err) {
    logger.error('[ACTION-API] createAction failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/action/:id/confirm
 * Confirm and execute a pending action.
 * Body: { confirmed: true/false }
 */
export const confirmActionEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed = false } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, error: 'Action ID is required' });
    }

    const result = await confirmAndExecute(id, confirmed);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    logger.error('[ACTION-API] confirmAction failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/action/:id/feedback
 * Record user feedback on an action.
 * Body: { helpful: true/false, comment? }
 */
export const feedbackEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful, comment } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, error: 'Action ID is required' });
    }

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({ success: false, error: 'helpful (boolean) is required' });
    }

    const result = await recordFeedback(id, { helpful, comment });

    return res.status(result.success ? 200 : 404).json(result);
  } catch (err) {
    logger.error('[ACTION-API] feedback failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/action/history
 * Get action execution history.
 * Query: ?trace_id=X&project_id=Y&limit=20
 */
export const actionHistoryEndpoint = async (req, res) => {
  try {
    const { trace_id, project_id, limit = 20 } = req.query;

    const actions = await getActionHistory({
      trace_id: trace_id?.trim(),
      project_id: project_id?.trim(),
      limit: Math.min(parseInt(limit, 10) || 20, 100),
    });

    return res.status(200).json({
      success: true,
      count: actions.length,
      data: actions,
    });
  } catch (err) {
    logger.error('[ACTION-API] history failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

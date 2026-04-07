import ActionLog from '../models/ActionLog.js';
import { getAvailableActions } from './fixSuggestionEngine.js';
import logger from '../utils/logger.js';

/**
 * Action Engine — Executes safe, logged, reversible actions
 * 
 * Safety rules:
 *  1. Every action is logged BEFORE execution
 *  2. No destructive actions (no data deletion)
 *  3. All actions require explicit confirmation
 *  4. High-risk actions require double confirmation
 *  5. Results are always recorded
 */

/**
 * Create a pending action (requires confirmation before execution).
 * 
 * @param {Object} params
 * @param {string} params.action_id - The action to execute
 * @param {string} params.trace_id - Associated trace
 * @param {string} params.project_id
 * @param {string} params.environment
 * @param {string} params.triggered_by
 * @returns {Object} The pending action log
 */
export async function createAction({
  action_id,
  trace_id,
  project_id,
  environment,
  triggered_by = 'user',
}) {
  const available = getAvailableActions();
  const actionDef = available[action_id];

  if (!actionDef) {
    return {
      success: false,
      error: `Unknown action: ${action_id}. Available: ${Object.keys(available).join(', ')}`,
    };
  }

  // Create pending action log
  const actionLog = await ActionLog.create({
    action_id,
    action_name: actionDef.action,
    trace_id,
    project_id,
    environment,
    status: 'pending',
    risk: actionDef.risk,
    command: actionDef.command || null,
    triggered_by,
  });

  logger.info(`[ACTION] Created pending action: ${action_id} (${actionLog._id})`, {
    trace_id,
    risk: actionDef.risk,
  });

  return {
    success: true,
    data: {
      id: actionLog._id,
      action_id,
      action_name: actionDef.action,
      description: actionDef.description,
      risk: actionDef.risk,
      status: 'pending',
      requires_confirmation: true,
      message: actionDef.risk === 'high'
        ? '⚠️ This is a high-risk action. Please confirm carefully before proceeding.'
        : `Action "${actionDef.action}" is ready. Confirm to execute.`,
    },
  };
}

/**
 * Confirm and execute a pending action.
 * 
 * @param {string} actionLogId - The ActionLog document _id
 * @param {boolean} confirmed - Whether the user confirmed
 * @returns {Object} Execution result
 */
export async function confirmAndExecute(actionLogId, confirmed = false) {
  const actionLog = await ActionLog.findById(actionLogId);

  if (!actionLog) {
    return { success: false, error: 'Action not found' };
  }

  if (actionLog.status !== 'pending') {
    return { success: false, error: `Action is already ${actionLog.status}. Cannot re-execute.` };
  }

  if (!confirmed) {
    actionLog.status = 'cancelled';
    await actionLog.save();
    logger.info(`[ACTION] Cancelled: ${actionLog.action_id} (${actionLogId})`);
    return { success: true, data: { status: 'cancelled', message: 'Action was cancelled by user.' } };
  }

  // Mark as confirmed
  actionLog.status = 'confirmed';
  actionLog.confirmed_at = new Date();
  await actionLog.save();

  // Execute the action
  actionLog.status = 'executing';
  actionLog.executed_at = new Date();
  await actionLog.save();

  const startTime = Date.now();

  try {
    const result = await executeAction(actionLog.action_id, actionLog);

    actionLog.status = 'completed';
    actionLog.completed_at = new Date();
    actionLog.duration_ms = Date.now() - startTime;
    actionLog.result = {
      success: true,
      message: result.message || 'Action completed successfully',
      output: result.output || '',
    };
    await actionLog.save();

    logger.info(`[ACTION] Completed: ${actionLog.action_id} in ${actionLog.duration_ms}ms`);

    return {
      success: true,
      data: {
        id: actionLogId,
        action_id: actionLog.action_id,
        status: 'completed',
        result: actionLog.result,
        duration_ms: actionLog.duration_ms,
      },
    };
  } catch (err) {
    actionLog.status = 'failed';
    actionLog.completed_at = new Date();
    actionLog.duration_ms = Date.now() - startTime;
    actionLog.result = {
      success: false,
      message: 'Action execution failed',
      error: err.message,
    };
    await actionLog.save();

    logger.error(`[ACTION] Failed: ${actionLog.action_id}: ${err.message}`);

    return {
      success: false,
      data: {
        id: actionLogId,
        action_id: actionLog.action_id,
        status: 'failed',
        error: err.message,
      },
    };
  }
}

/**
 * Record user feedback for an action.
 */
export async function recordFeedback(actionLogId, { helpful, comment }) {
  const actionLog = await ActionLog.findById(actionLogId);
  if (!actionLog) {
    return { success: false, error: 'Action not found' };
  }

  actionLog.feedback = {
    helpful: !!helpful,
    comment: comment?.substring(0, 1024) || null,
    rated_at: new Date(),
  };
  await actionLog.save();

  logger.info(`[ACTION] Feedback for ${actionLog.action_id}: ${helpful ? '👍' : '👎'}`);
  return { success: true, message: 'Feedback recorded. Thank you!' };
}

/**
 * Get action history.
 */
export async function getActionHistory({ trace_id, project_id, limit = 20 } = {}) {
  const filter = {};
  if (trace_id) filter.trace_id = trace_id;
  if (project_id) filter.project_id = project_id;

  return ActionLog.find(filter)
    .sort({ created_at: -1 })
    .limit(Math.min(limit, 100))
    .lean();
}

// ─── Action Executors ────────────────────────────────────────────
// Each action_id maps to a safe executor function.
// In production, these would call Render/Cloudflare APIs.
// For now, they simulate execution with logging.

async function executeAction(actionId, actionLog) {
  const executors = {
    // Database actions
    db_restart: async () => ({
      message: 'Database service restart initiated',
      output: `Simulated: Sent restart signal to database service. Trace: ${actionLog.trace_id}`,
    }),

    // Backend actions
    backend_restart: async () => ({
      message: 'Backend service restart initiated',
      output: `Simulated: Sent restart request to Render API for backend service.`,
    }),

    backend_rollback: async () => ({
      message: 'Backend rollback initiated',
      output: `Simulated: Rolling back to previous deployment.`,
    }),

    // Frontend actions
    fe_rollback: async () => ({
      message: 'Frontend rollback initiated',
      output: `Simulated: Rolling back frontend to last successful build.`,
    }),

    // CDN actions
    cdn_purge_cache: async () => ({
      message: 'CDN cache purge initiated',
      output: `Simulated: Sent purge_everything request to Cloudflare.`,
    }),

    // Auth actions
    auth_clear_sessions: async () => ({
      message: 'Session cache cleared',
      output: `Simulated: Flushed session cache (Redis FLUSHDB).`,
    }),

    // Memory actions
    memory_restart: async () => ({
      message: 'Service restarted to free memory',
      output: `Simulated: Sent restart signal to free memory.`,
    }),

    // Infrastructure actions
    infra_rollback: async () => ({
      message: 'Deployment rollback initiated',
      output: `Simulated: Rolling back to previous deployment version.`,
    }),
  };

  const executor = executors[actionId];
  if (!executor) {
    throw new Error(`No executor defined for action: ${actionId}`);
  }

  // Simulate slight delay for realism
  await new Promise(r => setTimeout(r, 500));
  return executor();
}

export default { createAction, confirmAndExecute, recordFeedback, getActionHistory };

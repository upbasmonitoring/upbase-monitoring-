import express from 'express';
import {
  getTraceById,
  triggerCorrelation,
  triggerBatchCorrelation,
  listRecentErrors,
  rootCauseSummary,
} from '../controllers/traceController.js';
import { validateLogApiKey } from '../middleware/logApiKeyAuth.js';

const router = express.Router();

/**
 * Trace & Correlation Routes
 * 
 * GET    /api/traces/errors              — Recent error traces
 * GET    /api/traces/root-cause-summary  — Grouped root cause counts
 * POST   /api/traces/batch-correlate     — Trigger batch correlation
 * GET    /api/traces/:trace_id           — Full trace timeline
 * POST   /api/traces/:trace_id/correlate — Manually trigger correlation
 * 
 * All endpoints protected by log API key.
 */

router.use(validateLogApiKey);

// List endpoints (must be above :trace_id to avoid route collision)
router.get('/errors', listRecentErrors);
router.get('/root-cause-summary', rootCauseSummary);

// Batch correlation
router.post('/batch-correlate', triggerBatchCorrelation);

// Single trace endpoints
router.get('/:trace_id', getTraceById);
router.post('/:trace_id/correlate', triggerCorrelation);

export default router;

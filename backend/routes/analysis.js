import express from 'express';
import {
  analyzeTraceEndpoint,
  analyzePatternsEndpoint,
  createActionEndpoint,
  confirmActionEndpoint,
  feedbackEndpoint,
  actionHistoryEndpoint,
} from '../controllers/analysisController.js';
import { validateLogApiKey } from '../middleware/logApiKeyAuth.js';

const router = express.Router();

/**
 * AI Analysis & Action Routes
 * 
 * POST  /api/analyze              — AI-powered trace analysis
 * POST  /api/analyze/patterns     — Pattern analysis across recent errors
 * POST  /api/action               — Create a pending action
 * POST  /api/action/:id/confirm   — Confirm and execute action
 * POST  /api/action/:id/feedback  — Record user feedback
 * GET   /api/action/history       — Action execution history
 * 
 * All endpoints protected by log API key.
 */

router.use(validateLogApiKey);

// ─── Analysis ───────────────────────────────────────────────────
router.post('/analyze', analyzeTraceEndpoint);
router.post('/analyze/patterns', analyzePatternsEndpoint);

// ─── Actions ────────────────────────────────────────────────────
// History must be above :id to avoid route collision
router.get('/action/history', actionHistoryEndpoint);
router.post('/action', createActionEndpoint);
router.post('/action/:id/confirm', confirmActionEndpoint);
router.post('/action/:id/feedback', feedbackEndpoint);

export default router;

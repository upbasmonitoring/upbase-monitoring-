import express from 'express';
import { ingestLogs, queryLogs, getLogStats } from '../controllers/logController.js';
import { validateLogApiKey } from '../middleware/logApiKeyAuth.js';

const router = express.Router();

/**
 * Log Ingestion & Query Routes
 * 
 * POST   /api/logs        — Ingest a single log or batch of logs
 * GET    /api/logs        — Query logs with filters (type, severity, time range, etc.)
 * GET    /api/logs/stats  — Aggregated log statistics (counts by type & severity)
 * 
 * All endpoints require x-log-api-key header for authentication.
 */

// All log routes require API key authentication
router.use(validateLogApiKey);

// Ingestion endpoint
router.post('/', ingestLogs);

// Query endpoint
router.get('/', queryLogs);

// Stats endpoint
router.get('/stats', getLogStats);

export default router;

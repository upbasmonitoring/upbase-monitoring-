import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import ProductionError from '../models/ProductionError.js';
import RequestLog from '../models/RequestLog.js';
import Project from '../models/Project.js';

const router = express.Router();

/**
 * 📦 Production-Grade Application Monitoring Ingestion Hub
 * Authenticates via API keys associated with projects.
 */

// Normalize path to prevent cardinality explosion (Module 4)
function normalizePath(path) {
  if (!path) return '/';
  return path
    .replace(/\/[0-9a-f]{24}/g, '/:id')          // MongoDB ObjectIds
    .replace(/\/[0-9]+/g, '/:id')                  // Numeric IDs
    .replace(/\/[0-9a-f-]{36}/g, '/:uuid');        // UUIDs
}

// Generate error fingerprint for grouping (Module 3)
function generateFingerprint(errorData) {
  const topFrame = errorData.stack
    ?.split('\n')
    .slice(0, 3)
    .map(line => line.replace(/:\d+:\d+/g, '')) // Remove line:col
    .join('|');

  const input = `${errorData.type || 'Error'}|${errorData.message}|${topFrame || 'no-stack'}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// @desc    Process a single error event
async function processError(project, event, user) {
  const fingerprint = generateFingerprint(event);
  
  const existing = await ProductionError.findOne({ 
    project: project._id, 
    fingerprint, 
    status: 'open' 
  });

  if (existing) {
    existing.occurrences += 1;
    existing.lastSeen = new Date();
    if (event.request) existing.request = event.request;
    await existing.save();
    return { action: 'updated', id: existing._id };
  } else {
    const error = await ProductionError.create({
      user: user._id,
      project: project._id,
      fingerprint,
      type: event.type,
      message: event.message,
      stack: event.stack,
      level: event.level || 'error',
      request: event.request,
      environment: event.environment || 'production',
      release: event.release,
    });
    return { action: 'created', id: error._id };
  }
}

// @desc    Process a single request/traffic event
async function processRequest(project, event) {
  return await RequestLog.create({
    project: project._id,
    method: event.method,
    path: event.path,
    normalizedPath: normalizePath(event.path),
    statusCode: event.statusCode,
    responseTime: event.responseTime,
    ip: event.ip,
    userAgent: event.userAgent,
    timestamp: event.timestamp || new Date(),
  });
}

// @route   POST /api/ingest/batch
// @access  Private (API Key only)
router.post('/batch', protect, async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ message: 'Events must be an array' });
    }

    const results = { errors: 0, requests: 0 };

    for (const event of events) {
      if (event.type === 'error' || event.stack) {
        await processError(req.project, event, req.user);
        results.errors++;
      } else if (event.type === 'request' || event.responseTime) {
        await processRequest(req.project, event);
        results.requests++;
      }
    }

    res.status(200).json({ success: true, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/ingest/errors
router.post('/errors', protect, async (req, res) => {
  try {
    const result = await processError(req.project, req.body, req.user);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/ingest/logs
router.post('/logs', protect, async (req, res) => {
  try {
    // Current simple logging to console, could be saved to a Logs model later
    console.log(`[INGEST-LOG] [${req.project.name}]: ${req.body.message}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

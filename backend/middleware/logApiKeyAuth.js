import logger from '../utils/logger.js';

/**
 * Log Ingestion API Key Authentication (v2)
 * 
 * Lightweight, high-throughput auth for log endpoints.
 * Accepts API key from:
 *   1. x-log-api-key header (primary — SDKs)
 *   2. _logkey query param (fallback — navigator.sendBeacon)
 * 
 * Also extracts x-project-id header for enrichment.
 */

// Parse valid keys from environment at startup
const VALID_LOG_KEYS = new Set(
  (process.env.LOG_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
);

// Fallback: if no keys are configured, use a default dev key
if (VALID_LOG_KEYS.size === 0) {
  const defaultKey = 'upbase-log-dev-key-2026';
  VALID_LOG_KEYS.add(defaultKey);
  logger.warn(`[LOG-AUTH] No LOG_API_KEYS configured. Using default dev key: ${defaultKey}`);
}

export const validateLogApiKey = (req, res, next) => {
  // Accept from header (primary) or query param (sendBeacon fallback)
  const apiKey = req.headers['x-log-api-key'] || req.query?._logkey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing authentication. Provide x-log-api-key header.',
    });
  }

  if (!VALID_LOG_KEYS.has(apiKey)) {
    logger.warn(`[LOG-AUTH] Rejected invalid log API key from ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid log API key. Access denied.',
    });
  }

  // Attach key ID (truncated for logging) to the request
  req.logApiKeyId = apiKey.substring(0, 8) + '***';

  // Clean up the sendBeacon query param so it doesn't pollute downstream
  if (req.query?._logkey) {
    delete req.query._logkey;
  }

  next();
};

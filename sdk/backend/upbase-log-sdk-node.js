/**
 * Upbase Log SDK v2 — Backend (Node.js)
 * 
 * Production-grade server-side logger with:
 *  ✅ logInfo / logWarning / logError / logCritical
 *  ✅ Automatic source detection (render / node / docker)
 *  ✅ project_id + environment enrichment
 *  ✅ Exponential retry with configurable max
 *  ✅ Batch delivery with auto-flush
 *  ✅ Express request logging middleware
 *  ✅ uncaughtException / unhandledRejection capture
 *  ✅ Graceful shutdown hooks
 * 
 * Usage:
 *   import { createLogger } from '@upbase/log-sdk-node';
 * 
 *   const log = createLogger({
 *     endpoint: 'https://upbase-monitoring.onrender.com/api/logs',
 *     apiKey: 'upbase-log-prod-key-2026',
 *     projectId: 'my-project-id',
 *     environment: 'production',
 *     service: 'auth-api',
 *   });
 * 
 *   log.info('Server started', { port: 5000 });
 *   log.error('DB timeout', { query: 'users.find()', durationMs: 30000 });
 * 
 *   // Express middleware — auto-logs every request
 *   app.use(log.expressMiddleware());
 * 
 *   // Graceful shutdown
 *   process.on('SIGTERM', () => log.destroy());
 */

import { hostname } from 'os';

// ─── Auto-detect source ─────────────────────────────────────────
function detectSource() {
  if (process.env.RENDER) return 'render';
  if (process.env.RAILWAY_ENVIRONMENT) return 'railway';
  if (process.env.VERCEL) return 'vercel';
  if (process.env.FLY_APP_NAME) return 'fly';
  if (process.env.HEROKU_APP_NAME) return 'heroku';
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws-lambda';
  if (process.env.GOOGLE_CLOUD_PROJECT) return 'gcp';
  if (process.env.KUBERNETES_SERVICE_HOST) return 'kubernetes';
  if (process.env.DOCKER_CONTAINER) return 'docker';
  return 'node-process';
}

// ─── Defaults ───────────────────────────────────────────────────
const DEFAULTS = {
  endpoint: '',
  apiKey: '',
  projectId: null,
  environment: null,
  service: 'backend-service',
  source: null,                // null = auto-detect
  batchSize: 20,
  flushIntervalMs: 3000,
  maxBufferSize: 1000,
  maxRetries: 5,
  retryBaseMs: 500,
  captureExceptions: true,     // uncaughtException + unhandledRejection
  consoleOutput: true,         // Also print to stdout/stderr
};

/**
 * Create a production backend logger instance.
 * @param {Object} config
 * @returns {Object} Logger with info/warning/error/critical + middleware
 */
export function createLogger(config) {
  const cfg = { ...DEFAULTS, ...config };

  if (!cfg.endpoint) throw new Error('[UpbaseLogger] endpoint is required');
  if (!cfg.apiKey) throw new Error('[UpbaseLogger] apiKey is required');

  // Auto-detect source if not provided
  if (!cfg.source) cfg.source = detectSource();

  // Detect environment from NODE_ENV if not set
  if (!cfg.environment && process.env.NODE_ENV) {
    const envMap = { production: 'production', staging: 'staging', development: 'development', test: 'test' };
    cfg.environment = envMap[process.env.NODE_ENV] || null;
  }

  // Detect region from common cloud env vars
  const region = process.env.RENDER_REGION ||
                 process.env.AWS_REGION ||
                 process.env.FLY_REGION ||
                 process.env.RAILWAY_REGION ||
                 null;

  let buffer = [];
  let timer = null;
  let traceId = null;
  let retryCount = 0;
  let flushing = false;
  let destroyed = false;

  const serverHostname = hostname();

  // ─── Send batch ─────────────────────────────────────────────
  async function sendBatch(logs) {
    const response = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-log-api-key': cfg.apiKey,
      },
      body: JSON.stringify(logs),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 256)}`);
    }

    return response.json();
  }

  // ─── Flush with retry ───────────────────────────────────────
  async function flush() {
    if (flushing || buffer.length === 0) return;
    flushing = true;

    const logs = buffer.splice(0, cfg.batchSize);

    try {
      await sendBatch(logs);
      retryCount = 0;
    } catch (err) {
      if (retryCount < cfg.maxRetries) {
        buffer.unshift(...logs);
        retryCount++;
        const delay = cfg.retryBaseMs * Math.pow(2, retryCount - 1);
        if (cfg.consoleOutput) {
          console.warn(`[UpbaseLogger] Retry ${retryCount}/${cfg.maxRetries} in ${delay}ms: ${err.message}`);
        }
        setTimeout(() => {
          flushing = false;
          flush();
        }, delay);
        return;
      } else {
        if (cfg.consoleOutput) {
          console.error(`[UpbaseLogger] Max retries reached. Dropping ${logs.length} logs.`);
        }
        retryCount = 0;
      }
    }

    flushing = false;

    if (buffer.length >= cfg.batchSize) {
      flush();
    }
  }

  // ─── Core log function ──────────────────────────────────────
  function log(severity, message, metadata = {}) {
    if (destroyed) return;

    const entry = {
      type: 'backend',
      source: cfg.source,
      service: cfg.service,
      severity,
      message: String(message).substring(0, 8192),
      metadata: {
        ...metadata,
        pid: process.pid,
        hostname: serverHostname,
        nodeVersion: process.version,
        memoryMB: Math.round(process.memoryUsage.rss() / 1048576),
      },
      timestamp: new Date().toISOString(),
    };

    // Enrichment
    if (cfg.projectId) entry.project_id = cfg.projectId;
    if (cfg.environment) entry.environment = cfg.environment;
    if (region) entry.region = region;
    if (traceId) entry.trace_id = traceId;

    // Clean undefined
    Object.keys(entry.metadata).forEach(k => {
      if (entry.metadata[k] === undefined) delete entry.metadata[k];
    });

    buffer.push(entry);

    // Console output for local visibility
    if (cfg.consoleOutput) {
      const prefix = `[${severity.toUpperCase()}] [${cfg.service}]`;
      if (severity === 'error' || severity === 'critical') {
        console.error(`${prefix} ${message}`, Object.keys(metadata).length ? metadata : '');
      } else {
        console.log(`${prefix} ${message}`, Object.keys(metadata).length ? metadata : '');
      }
    }

    // Evict overflow
    if (buffer.length > cfg.maxBufferSize) {
      const dropped = buffer.splice(0, buffer.length - cfg.maxBufferSize);
      if (cfg.consoleOutput) {
        console.warn(`[UpbaseLogger] Buffer overflow. Dropped ${dropped.length} oldest logs.`);
      }
    }

    if (buffer.length >= cfg.batchSize) {
      flush();
    }
  }

  // ─── Exception capture ─────────────────────────────────────
  if (cfg.captureExceptions) {
    process.on('uncaughtException', (err) => {
      log('critical', 'Uncaught Exception', {
        error: err.message,
        stack: err.stack?.substring(0, 4096),
        _auto: true,
      });
      // Allow other handlers
    });

    process.on('unhandledRejection', (reason) => {
      log('critical', 'Unhandled Rejection', {
        reason: String(reason?.message || reason).substring(0, 2048),
        stack: reason?.stack?.substring(0, 4096),
        _auto: true,
      });
    });
  }

  // Start auto-flush
  timer = setInterval(flush, cfg.flushIntervalMs);

  // ─── Graceful shutdown ──────────────────────────────────────
  const exitHandler = async () => {
    destroyed = true;
    clearInterval(timer);
    // Flush remaining buffer synchronously
    if (buffer.length > 0) {
      try { await sendBatch(buffer.splice(0)); } catch {}
    }
  };

  process.on('SIGINT', exitHandler);
  process.on('SIGTERM', exitHandler);
  process.on('beforeExit', exitHandler);

  // ─── Express Middleware ─────────────────────────────────────
  function expressMiddleware(options = {}) {
    const { logLevel = 'info', skip = null } = options;

    return (req, res, next) => {
      const start = Date.now();

      // Capture original end
      const origEnd = res.end;
      res.end = function (...args) {
        res.end = origEnd;
        res.end(...args);

        // Optional skip function
        if (skip && skip(req, res)) return;

        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const sev = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : logLevel;

        log(sev, `${req.method} ${req.originalUrl} ${statusCode}`, {
          method: req.method,
          url: req.originalUrl,
          statusCode,
          durationMs: duration,
          ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
          contentLength: res.get?.('content-length'),
          _auto: true,
        });
      };

      next();
    };
  }

  // ─── Public API ─────────────────────────────────────────────
  return {
    // Core logging
    info:     (msg, meta) => log('info', msg, meta),
    warning:  (msg, meta) => log('warning', msg, meta),
    error:    (msg, meta) => log('error', msg, meta),
    critical: (msg, meta) => log('critical', msg, meta),

    // Aliases for spec compliance
    logInfo:     (msg, meta) => log('info', msg, meta),
    logWarning:  (msg, meta) => log('warning', msg, meta),
    logError:    (msg, meta) => log('error', msg, meta),

    // Trace correlation
    setTraceId: (id) => { traceId = id; },
    getTraceId: () => traceId,

    // Enrichment
    setProjectId: (id) => { cfg.projectId = id; },
    setEnvironment: (env) => { cfg.environment = env; },

    // Express integration
    expressMiddleware,

    // Buffer management
    flush,
    getBufferSize: () => buffer.length,

    // Lifecycle
    destroy: async () => {
      destroyed = true;
      clearInterval(timer);
      return flush();
    },
  };
}

export default createLogger;

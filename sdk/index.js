import axios from 'axios';

class Sentinel {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.apiUrl = options.apiUrl || 'https://api.sentinel-monitor.com/api';
    this.projectName = options.projectName || 'Default Project';
    this.appVersion = options.appVersion || '1.0.0';
    
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;

    // 1. Capture Unhandled Exceptions
    process.on('uncaughtException', (error) => {
      this.captureException(error, { level: 'fatal', type: 'uncaughtException' });
    });

    process.on('unhandledRejection', (reason) => {
      this.captureException(reason, { level: 'error', type: 'unhandledRejection' });
    });

    this._initialized = true;
    console.log(`[SENTINEL SDK] Initialized for project: ${this.projectName}`);
  }

  async captureException(error, context = {}) {
    const errorData = {
      message: error.message || String(error),
      stack: error.stack,
      section: context.section || 'General',
      severity: context.level || 'error',
      details: {
        ...context,
        appVersion: this.appVersion,
        timestamp: new Date().toISOString()
      }
    };

    try {
      await axios.post(`${this.apiUrl}/ingest/error`, errorData, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('[SENTINEL SDK] Failed to report error:', err.message);
    }
  }

  async captureMessage(message, level = 'info') {
    return this.captureException({ message }, { level, type: 'manual_log' });
  }

  // Hook for Express middleware
  requestHandler() {
    return (req, res, next) => {
      req.sentinel = this;
      next();
    };
  }

  errorHandler() {
    return (err, req, res, next) => {
      this.captureException(err, {
        section: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        level: 'error'
      });
      next(err);
    };
  }
}

export default Sentinel;

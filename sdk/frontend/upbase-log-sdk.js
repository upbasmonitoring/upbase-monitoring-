/**
 * Upbase Log SDK v2 — Frontend (Browser)
 * 
 * Production-grade client-side logger with:
 *  ✅ window.onerror capture
 *  ✅ Unhandled promise rejection capture
 *  ✅ Failed fetch() interception
 *  ✅ Failed XMLHttpRequest interception
 *  ✅ Batched delivery with exponential retry
 *  ✅ project_id + environment enrichment
 *  ✅ Page visibility / beforeunload flush
 *  ✅ Console error interception (optional)
 * 
 * Usage:
 *   <script src="upbase-log-sdk.js"></script>
 *   <script>
 *     const logger = UpbaseLogger.init({
 *       endpoint: 'https://upbase-monitoring.onrender.com/api/logs',
 *       apiKey: 'upbase-log-prod-key-2026',
 *       projectId: 'my-project-123',
 *       environment: 'production',
 *       service: 'frontend-app',
 *     });
 *
 *     logger.info('Dashboard loaded', { loadTime: 1200 });
 *     logger.error('Payment crash', { component: 'CheckoutWidget' });
 *   </script>
 */

;(function (root) {
  'use strict';

  // ─── Default Configuration ─────────────────────────────────────
  const DEFAULTS = {
    endpoint: '',
    apiKey: '',
    projectId: null,
    environment: null,
    service: 'frontend-app',
    source: 'browser',
    batchSize: 10,
    flushIntervalMs: 5000,
    maxBufferSize: 500,       // Drop oldest logs if buffer exceeds this
    maxRetries: 3,
    retryBaseMs: 1000,        // Exponential backoff base
    captureErrors: true,      // window.onerror + unhandledrejection
    captureFetch: true,       // Intercept failed fetch() calls
    captureXHR: true,         // Intercept failed XMLHttpRequest calls
    captureConsoleErrors: false, // Intercept console.error
    debug: false,             // Print internal SDK logs
  };

  // ─── UpbaseLogger Class ────────────────────────────────────────
  class UpbaseLogger {
    constructor(config) {
      this._cfg = { ...DEFAULTS, ...config };
      this._buffer = [];
      this._flushTimer = null;
      this._traceId = null;
      this._retryCount = 0;
      this._flushing = false;
      this._destroyed = false;

      if (!this._cfg.endpoint) throw new Error('[UpbaseLogger] endpoint is required');
      if (!this._cfg.apiKey) throw new Error('[UpbaseLogger] apiKey is required');

      this._startAutoFlush();
      if (this._cfg.captureErrors) this._setupErrorCapture();
      if (this._cfg.captureFetch) this._setupFetchInterceptor();
      if (this._cfg.captureXHR) this._setupXHRInterceptor();
      if (this._cfg.captureConsoleErrors) this._setupConsoleCapture();
      this._setupLifecycleHooks();

      this._debug('SDK initialized', this._cfg);
    }

    // ─── Static Factory ─────────────────────────────────────────
    static init(config) {
      const instance = new UpbaseLogger(config);
      // Store singleton for global access
      root.__upbaseLogger = instance;
      return instance;
    }

    // ─── Public API ─────────────────────────────────────────────
    info(message, metadata = {}) { this._log('info', message, metadata); }
    warning(message, metadata = {}) { this._log('warning', message, metadata); }
    error(message, metadata = {}) { this._log('error', message, metadata); }
    critical(message, metadata = {}) { this._log('critical', message, metadata); }

    // Aliases matching common console API
    logInfo(message, metadata) { this.info(message, metadata); }
    logWarning(message, metadata) { this.warning(message, metadata); }
    logError(message, metadata) { this.error(message, metadata); }

    setTraceId(id) { this._traceId = id; }
    getTraceId() { return this._traceId; }

    setProjectId(id) { this._cfg.projectId = id; }
    setEnvironment(env) { this._cfg.environment = env; }

    getBufferSize() { return this._buffer.length; }

    async flush() {
      if (this._flushing || this._buffer.length === 0) return;
      this._flushing = true;

      const logs = this._buffer.splice(0, this._cfg.batchSize);

      try {
        await this._send(logs);
        this._retryCount = 0;
        this._debug(`Flushed ${logs.length} logs`);
      } catch (err) {
        // Re-queue with retry limit
        if (this._retryCount < this._cfg.maxRetries) {
          this._buffer.unshift(...logs);
          this._retryCount++;
          const delay = this._cfg.retryBaseMs * Math.pow(2, this._retryCount - 1);
          this._debug(`Retry ${this._retryCount}/${this._cfg.maxRetries} in ${delay}ms`);
          setTimeout(() => {
            this._flushing = false;
            this.flush();
          }, delay);
          return;
        } else {
          this._debug(`Max retries reached. Dropping ${logs.length} logs.`);
          this._retryCount = 0;
        }
      }

      this._flushing = false;

      // Continue flushing if buffer still has data
      if (this._buffer.length >= this._cfg.batchSize) {
        this.flush();
      }
    }

    destroy() {
      this._destroyed = true;
      if (this._flushTimer) clearInterval(this._flushTimer);
      return this.flush();
    }

    // ─── Core Logging ───────────────────────────────────────────
    _log(severity, message, metadata) {
      if (this._destroyed) return;

      const entry = {
        type: 'frontend',
        source: this._cfg.source,
        service: this._cfg.service,
        severity,
        message: String(message).substring(0, 8192),
        metadata: {
          ...metadata,
          url: root.location?.href,
          userAgent: root.navigator?.userAgent,
          referrer: root.document?.referrer || undefined,
          screenRes: root.screen ? `${root.screen.width}x${root.screen.height}` : undefined,
          language: root.navigator?.language,
          timestamp_client: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Enrichment
      if (this._cfg.projectId) entry.project_id = this._cfg.projectId;
      if (this._cfg.environment) entry.environment = this._cfg.environment;
      if (this._traceId) entry.trace_id = this._traceId;

      // Clean undefined from metadata
      Object.keys(entry.metadata).forEach(k => {
        if (entry.metadata[k] === undefined) delete entry.metadata[k];
      });

      this._buffer.push(entry);

      // Evict oldest if buffer overflow
      if (this._buffer.length > this._cfg.maxBufferSize) {
        const dropped = this._buffer.splice(0, this._buffer.length - this._cfg.maxBufferSize);
        this._debug(`Buffer overflow. Dropped ${dropped.length} oldest logs.`);
      }

      if (this._buffer.length >= this._cfg.batchSize) {
        this.flush();
      }
    }

    // ─── Network ────────────────────────────────────────────────
    async _send(logs) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await root.fetch(this._cfg.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-log-api-key': this._cfg.apiKey,
          },
          body: JSON.stringify(logs),
          keepalive: true,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    }

    // ─── Auto-Flush Timer ───────────────────────────────────────
    _startAutoFlush() {
      this._flushTimer = setInterval(() => this.flush(), this._cfg.flushIntervalMs);
    }

    // ─── Error Capture ──────────────────────────────────────────
    _setupErrorCapture() {
      // Global JS errors
      root.addEventListener('error', (event) => {
        this.error('Uncaught Error', {
          errorMessage: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack?.substring(0, 4096),
          _auto: true,
        });
      });

      // Unhandled promise rejections
      root.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: String(event.reason?.message || event.reason).substring(0, 2048),
          stack: event.reason?.stack?.substring(0, 4096),
          _auto: true,
        });
      });
    }

    // ─── Fetch Interceptor ──────────────────────────────────────
    _setupFetchInterceptor() {
      const origFetch = root.fetch;
      const self = this;

      root.fetch = function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        const method = args[1]?.method || 'GET';
        const start = Date.now();

        // Don't intercept our own log submissions
        if (url === self._cfg.endpoint) return origFetch.apply(this, args);

        return origFetch.apply(this, args)
          .then((response) => {
            if (!response.ok) {
              self.warning('HTTP Request Failed', {
                method,
                url: url.substring(0, 512),
                status: response.status,
                statusText: response.statusText,
                durationMs: Date.now() - start,
                _auto: true,
              });
            }
            return response;
          })
          .catch((err) => {
            self.error('Network Request Error', {
              method,
              url: url.substring(0, 512),
              error: err.message,
              durationMs: Date.now() - start,
              _auto: true,
            });
            throw err; // Re-throw so app behavior is unchanged
          });
      };
    }

    // ─── XHR Interceptor ────────────────────────────────────────
    _setupXHRInterceptor() {
      const OrigXHR = root.XMLHttpRequest;
      const self = this;

      root.XMLHttpRequest = function () {
        const xhr = new OrigXHR();
        let xhrMethod = 'GET';
        let xhrUrl = '';
        let start = 0;

        const origOpen = xhr.open;
        xhr.open = function (method, url, ...rest) {
          xhrMethod = method;
          xhrUrl = url;
          start = Date.now();
          return origOpen.apply(this, [method, url, ...rest]);
        };

        xhr.addEventListener('load', function () {
          if (this.status >= 400) {
            // Don't intercept our own endpoint
            if (xhrUrl === self._cfg.endpoint) return;

            self.warning('XHR Request Failed', {
              method: xhrMethod,
              url: xhrUrl.substring(0, 512),
              status: this.status,
              statusText: this.statusText,
              durationMs: Date.now() - start,
              _auto: true,
            });
          }
        });

        xhr.addEventListener('error', function () {
          if (xhrUrl === self._cfg.endpoint) return;

          self.error('XHR Network Error', {
            method: xhrMethod,
            url: xhrUrl.substring(0, 512),
            durationMs: Date.now() - start,
            _auto: true,
          });
        });

        return xhr;
      };

      // Preserve prototype chain
      root.XMLHttpRequest.prototype = OrigXHR.prototype;
    }

    // ─── Console Capture ────────────────────────────────────────
    _setupConsoleCapture() {
      const origError = console.error;
      const self = this;

      console.error = function (...args) {
        // Avoid recursion
        origError.apply(console, args);
        self.error('Console Error', {
          args: args.map(a => String(a)).join(' ').substring(0, 2048),
          _auto: true,
        });
      };
    }

    // ─── Lifecycle Hooks ────────────────────────────────────────
    _setupLifecycleHooks() {
      // Flush before page unload
      root.addEventListener('beforeunload', () => {
        this._sendSync(this._buffer.splice(0));
      });

      // Flush when tab becomes hidden (mobile background, tab switch)
      root.document?.addEventListener('visibilitychange', () => {
        if (root.document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }

    /**
     * Synchronous beacon fallback for beforeunload.
     * navigator.sendBeacon is more reliable than fetch during page unload.
     */
    _sendSync(logs) {
      if (logs.length === 0) return;

      try {
        const blob = new Blob([JSON.stringify(logs)], { type: 'application/json' });

        // sendBeacon doesn't support custom headers, so we encode the API key in the URL
        const url = new URL(this._cfg.endpoint);
        url.searchParams.set('_logkey', this._cfg.apiKey);

        if (root.navigator?.sendBeacon) {
          root.navigator.sendBeacon(url.toString(), blob);
        } else {
          // Fallback: sync XHR (deprecated but works for unload)
          const xhr = new XMLHttpRequest();
          xhr.open('POST', this._cfg.endpoint, false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('x-log-api-key', this._cfg.apiKey);
          xhr.send(JSON.stringify(logs));
        }
      } catch (e) {
        // Swallow — we're unloading
      }
    }

    // ─── Debug ──────────────────────────────────────────────────
    _debug(...args) {
      if (this._cfg.debug) console.log('[UpbaseLogger]', ...args);
    }
  }

  // ─── Export ───────────────────────────────────────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpbaseLogger;
  } else {
    root.UpbaseLogger = UpbaseLogger;
  }
})(typeof window !== 'undefined' ? window : globalThis);

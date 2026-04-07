# Upbase Log Ingestion SDK v2

Production-grade SDK for sending structured logs to Upbase Monitoring from **any** source.

## Architecture

```
┌─────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│ Frontend SDK    │     │  Backend SDK        │     │  Integrations    │
│ (Browser)       │     │  (Node.js)          │     │  (CF / Render)   │
│                 │     │                     │     │                  │
│ • window.onerror│     │ • logInfo/Error/... │     │ • Poll CF API    │
│ • fetch intercpt│     │ • Express middleware│     │ • Poll Render API│
│ • XHR intercept │     │ • uncaughtException │     │ • Transform logs │
│ • sendBeacon    │     │ • Auto source detect│     │ • Retry delivery │
└────────┬────────┘     └─────────┬──────────┘     └────────┬─────────┘
         │                        │                          │
         └────────────────────────┼──────────────────────────┘
                                  │
                        POST /api/logs
                    (x-log-api-key header)
                                  │
                    ┌─────────────▼──────────────┐
                    │   Upbase Backend            │
                    │   • Validate & Normalize    │
                    │   • Enrich (project/env)    │
                    │   • Store in MongoDB        │
                    │   • Index for fast queries  │
                    └─────────────────────────────┘
```

## API Endpoints

| Method | Path              | Auth Header      | Description                        |
|--------|-------------------|------------------|------------------------------------|
| `POST` | `/api/logs`       | `x-log-api-key`  | Ingest single or batch logs        |
| `GET`  | `/api/logs`       | `x-log-api-key`  | Query with filters + pagination    |
| `GET`  | `/api/logs/stats` | `x-log-api-key`  | Aggregated counts by type/severity |

---

## 1. Frontend SDK (Browser)

### Installation
```html
<script src="sdk/frontend/upbase-log-sdk.js"></script>
```

### Quick Start
```html
<script>
  const logger = UpbaseLogger.init({
    endpoint: 'https://upbase-monitoring.onrender.com/api/logs',
    apiKey: 'upbase-log-prod-key-2026',
    projectId: 'my-project-123',
    environment: 'production',
    service: 'frontend-app',
  });

  // Manual logging
  logger.info('Dashboard loaded', { loadTime: 1200 });
  logger.warning('Slow API response', { endpoint: '/api/users', ms: 4500 });
  logger.error('Payment widget crash', { component: 'CheckoutForm' });
  logger.critical('App unresponsive', { memoryUsage: '98%' });

  // Cross-service correlation
  logger.setTraceId('abc-123-trace');
</script>
```

### Auto-Captured Events
| Event | Captured By | Severity |
|-------|------------|----------|
| `window.onerror` | Error listener | error |
| Unhandled promise rejection | `unhandledrejection` | error |
| Failed `fetch()` requests | Fetch interceptor | warning/error |
| Failed `XMLHttpRequest` | XHR interceptor | warning/error |
| `console.error()` | Console override (opt-in) | error |

### Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `endpoint` | *required* | Full URL to POST /api/logs |
| `apiKey` | *required* | x-log-api-key value |
| `projectId` | `null` | Project ID for multi-tenant isolation |
| `environment` | `null` | `production`/`staging`/`development`/`test` |
| `service` | `'frontend-app'` | Service identifier |
| `source` | `'browser'` | Source identifier |
| `batchSize` | `10` | Flush after N logs |
| `flushIntervalMs` | `5000` | Auto-flush interval |
| `maxBufferSize` | `500` | Max buffered logs before eviction |
| `maxRetries` | `3` | Retry attempts on failure |
| `captureFetch` | `true` | Intercept failed fetch() calls |
| `captureXHR` | `true` | Intercept failed XHR calls |
| `captureConsoleErrors` | `false` | Intercept console.error |
| `debug` | `false` | Print SDK debug output |

---

## 2. Backend SDK (Node.js)

### Quick Start
```js
import { createLogger } from './sdk/backend/upbase-log-sdk-node.js';

const log = createLogger({
  endpoint: 'https://upbase-monitoring.onrender.com/api/logs',
  apiKey: 'upbase-log-prod-key-2026',
  projectId: 'my-project-123',
  environment: 'production',
  service: 'auth-api',
});

log.info('Server started', { port: 5000 });
log.error('DB timeout', { query: 'users.find()', duration: 30000 });
log.logInfo('Alias for info');

// Express middleware — auto-logs every HTTP request
app.use(log.expressMiddleware());

// Graceful shutdown
process.on('SIGTERM', () => log.destroy());
```

### Auto-Detected Sources
The SDK automatically detects the runtime environment:

| Environment | Value Set |
|-------------|----------|
| Render | `'render'` |
| Railway | `'railway'` |
| Vercel | `'vercel'` |
| Fly.io | `'fly'` |
| AWS Lambda | `'aws-lambda'` |
| GCP | `'gcp'` |
| Kubernetes | `'kubernetes'` |
| Docker | `'docker'` |
| Default | `'node-process'` |

### Express Middleware
```js
// Auto-log all requests (5xx → error, 4xx → warning, rest → info)
app.use(log.expressMiddleware());

// With options
app.use(log.expressMiddleware({
  logLevel: 'info',               // Default severity
  skip: (req, res) => req.path === '/health',  // Skip health checks
}));
```

---

## 3. Cloudflare Integration

### Setup
```bash
# Set environment variables
export CF_API_TOKEN="your-cloudflare-api-token"
export CF_ZONE_ID="your-zone-id"
export UPBASE_ENDPOINT="https://upbase-monitoring.onrender.com/api/logs"
export UPBASE_API_KEY="upbase-log-prod-key-2026"
export UPBASE_PROJECT_ID="my-project-123"

# Run as standalone
node sdk/integrations/cloudflare-integration.js
```

### Programmatic Usage
```js
import { createCloudflareCollector } from './sdk/integrations/cloudflare-integration.js';

const collector = createCloudflareCollector({
  cfApiToken: 'your-token',
  cfZoneId: 'your-zone-id',
  upbaseEndpoint: 'https://upbase-monitoring.onrender.com/api/logs',
  upbaseApiKey: 'upbase-log-prod-key-2026',
  pollIntervalSec: 60,
});

collector.start();  // Begin polling
collector.stop();   // Stop polling
collector.pollNow(); // Trigger single poll
```

### What It Captures
- HTTP 5xx errors (count, path, host, colo)
- WAF/firewall threats
- Optionally: 4xx errors (`include4xx: true`)

---

## 4. Render Integration

### Setup
```bash
export RENDER_API_KEY="your-render-api-key"
export RENDER_SERVICE_IDS="srv-abc123,srv-def456"  # Optional
export UPBASE_ENDPOINT="https://upbase-monitoring.onrender.com/api/logs"
export UPBASE_API_KEY="upbase-log-prod-key-2026"

node sdk/integrations/render-integration.js
```

### What It Captures
- Deploy events (live, build_failed, cancelled)
- Service status (suspended, deactivated)
- Build duration and commit info

---

## 5. Log Enrichment Fields

Every log can include these optional enrichment fields:

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | string | Multi-tenant project isolation |
| `environment` | enum | `production`, `staging`, `development`, `test` |
| `region` | string | Geographic region (auto-detected from CDN/cloud) |

---

## 6. Full Log Schema

| Field         | Type    | Required | Description                              |
|---------------|---------|----------|------------------------------------------|
| `type`        | string  | ✅       | `frontend`, `backend`, or `system`       |
| `source`      | string  | ✅       | e.g. `browser`, `render`, `cloudflare`   |
| `service`     | string  | ❌       | e.g. `auth-api`, `frontend-app`          |
| `severity`    | string  | ✅       | `info`, `warning`, `error`, `critical`   |
| `message`     | string  | ✅       | Human-readable log message               |
| `metadata`    | object  | ❌       | Arbitrary JSON for extra context         |
| `trace_id`    | string  | ❌       | Correlation ID for distributed tracing   |
| `project_id`  | string  | ❌       | Project identifier                       |
| `environment` | string  | ❌       | Deployment environment                   |
| `region`      | string  | ❌       | Geographic region                        |
| `timestamp`   | ISO8601 | ❌       | Server attaches one if missing           |

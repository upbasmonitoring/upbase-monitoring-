# 🛡️ SENTINEL — Production-Grade Application Monitoring Platform

> **A self-hosted, full-stack monitoring platform** that gives developers complete visibility into their application's health, security, deployments, and infrastructure — all from a single dashboard.

---

## 📌 Table of Contents

1. [What Is Sentinel?](#what-is-sentinel)
2. [How It Works — The Big Picture](#how-it-works--the-big-picture)
3. [System Architecture](#system-architecture)
4. [Tech Stack — Why Each Choice](#tech-stack--why-each-choice)
5. [Module 1 — API Key System & Client Integration](#module-1--api-key-system--client-integration)
6. [Module 2 — Website Uptime & Health Monitoring](#module-2--website-uptime--health-monitoring)
7. [Module 3 — Error Tracking & Log Ingestion](#module-3--error-tracking--log-ingestion)
8. [Module 4 — Real Traffic Monitoring](#module-4--real-traffic-monitoring)
9. [Module 5 — Alert Engine](#module-5--alert-engine)
10. [Module 6 — Communication Integrations](#module-6--communication-integrations)
11. [Module 7 — GitHub OAuth & Webhook Integration](#module-7--github-oauth--webhook-integration)
12. [Module 8 — Self-Healing & Auto Rollback](#module-8--self-healing--auto-rollback)
13. [Module 9 — Security, IP Protection & Malware Detection](#module-9--security-ip-protection--malware-detection)
14. [Module 10 — Vulnerability Scanning](#module-10--vulnerability-scanning)
15. [Module 11 — Team & Role Access (RBAC)](#module-11--team--role-access-rbac)
16. [Module 12 — Dashboard & Settings](#module-12--dashboard--settings)
17. [Database Schema Design](#database-schema-design)
18. [Complete API Reference](#complete-api-reference)
19. [Security Hardening Checklist](#security-hardening-checklist)
20. [Deployment Guide](#deployment-guide)
21. [Environment Variables Reference](#environment-variables-reference)
22. [What Makes Sentinel Different](#what-makes-sentinel-different)

---

## What Is Sentinel?

Sentinel is a **platform-as-a-service style monitoring tool** that you build and self-host. Think of it as a combination of Datadog + Sentry + UptimeRobot + Snyk, but fully owned by you.

**Real-world example flow:**

- User A runs a **Cab Booking Service** (Node.js backend, React frontend, GitHub repo).
- User A signs up on Sentinel, creates a project, and gets a unique `SENTINEL_KEY`.
- They add `SENTINEL_KEY=sk_live_xyz123` to their `.env` file and install the Sentinel SDK.
- From that moment on, Sentinel silently monitors:
  - Every API response time and error
  - Server uptime every 60 seconds
  - Every new GitHub push/deployment
  - Real user traffic patterns
  - Any security threats or vulnerability in their dependencies
- If a bad deployment causes 500 errors to spike, Sentinel detects it, triggers a GitHub rollback to the last good commit, and sends an alert to the team on WhatsApp + Email — all automatically.

---

## How It Works — The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                          │
│  (Cab Service Backend — User A's Server)                        │
│                                                                 │
│   .env  →  SENTINEL_KEY=sk_live_xyz123                          │
│   SDK installed  →  npm install @sentinel/node                  │
│                                                                 │
│   SDK hooks into:                                               │
│   ├── Express middleware (request/response tracking)            │
│   ├── process.on('uncaughtException') (crash detection)         │
│   ├── console.error override (log capture)                      │
│   └── HTTP outbound interceptor (dependency health)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS POST (batched every 5s)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SENTINEL BACKEND                             │
│                                                                 │
│   API Gateway (Express + Nginx)                                 │
│   ├── Auth Middleware (validates SENTINEL_KEY)                  │
│   ├── Rate Limiter (Redis-based, per key)                       │
│   ├── Route: /ingest/logs                                       │
│   ├── Route: /ingest/errors                                     │
│   ├── Route: /ingest/metrics                                    │
│   └── Route: /ingest/traffic                                    │
│                                                                 │
│   Background Workers (Bull Queue + Redis)                       │
│   ├── Uptime Checker (cron every 60s)                           │
│   ├── Alert Evaluator (runs on every data write)                │
│   ├── Security Analyzer (scans incoming IP patterns)            │
│   ├── Vulnerability Scanner (runs daily)                        │
│   └── GitHub Webhook Processor                                  │
│                                                                 │
│   Storage Layer                                                 │
│   ├── MongoDB (logs, errors, config, users)                     │
│   ├── Redis (queues, rate limits, caching, sessions)            │
│   └── InfluxDB / TimescaleDB (time-series metrics)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │  WebSocket + REST
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SENTINEL DASHBOARD (React)                     │
│   Live graphs, alerts feed, deployment timeline, security log   │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

### Folder Structure

```
sentinel/
├── apps/
│   ├── backend/                    # Node.js + Express API
│   │   ├── src/
│   │   │   ├── api/                # All route handlers
│   │   │   │   ├── auth/
│   │   │   │   ├── ingest/         # SDK data ingestion endpoints
│   │   │   │   ├── projects/
│   │   │   │   ├── alerts/
│   │   │   │   ├── github/
│   │   │   │   └── security/
│   │   │   ├── workers/            # Bull queue workers
│   │   │   │   ├── uptimeWorker.js
│   │   │   │   ├── alertWorker.js
│   │   │   │   ├── healingWorker.js
│   │   │   │   └── securityWorker.js
│   │   │   ├── services/           # Business logic
│   │   │   │   ├── apiKeyService.js
│   │   │   │   ├── notificationService.js
│   │   │   │   ├── githubService.js
│   │   │   │   ├── vulnerabilityService.js
│   │   │   │   └── healingService.js
│   │   │   ├── models/             # Mongoose schemas
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.js
│   │   │   │   ├── rateLimiter.js
│   │   │   │   ├── rbac.js
│   │   │   │   └── ipGuard.js
│   │   │   └── config/
│   │   └── package.json
│   │
│   ├── dashboard/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── store/ (Zustand)
│   │   └── package.json
│   │
│   └── sdk/                        # npm package @sentinel/node
│       ├── src/
│       │   ├── index.js            # SDK entry point
│       │   ├── middleware.js       # Express middleware
│       │   ├── errorCapture.js
│       │   └── transport.js        # Batched HTTP sender
│       └── package.json
│
├── packages/
│   └── shared/                     # Shared types/utils
│
├── infra/
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── k8s/                        # Kubernetes manifests
│
└── .env.example
```

---

## Tech Stack — Why Each Choice

| Layer | Technology | Why |
|---|---|---|
| Backend API | **Node.js + Express** | Non-blocking I/O handles thousands of concurrent ingest requests. Fast to build. |
| Primary DB | **MongoDB** | Schema-flexible for logs and error objects that vary in structure. Great aggregation. |
| Time-Series DB | **InfluxDB** | Stores uptime checks, response times. 10x faster queries than MongoDB for time-based graphs. |
| Cache + Queue | **Redis** | In-memory speed for rate limiting, session data, and Bull job queues. |
| Job Queue | **Bull (BullMQ)** | Reliable queue for uptime checks, alert delivery, healing triggers. Has retry logic. |
| Frontend | **React + Vite + Zustand** | Fast HMR for development. Zustand is lighter than Redux for dashboard state. |
| Real-time | **Socket.IO** | Pushes live alerts, log streams, and metric updates to dashboard without polling. |
| Auth | **JWT + Refresh Token** | Stateless. Access token (15min) + refresh token (7 days) stored in httpOnly cookie. |
| Email | **Nodemailer + SMTP / Resend** | Resend is a modern email API. Nodemailer for self-hosted SMTP. |
| WhatsApp | **whatsapp-web.js** | Web-based WhatsApp automation. No paid API needed. Can be swapped for Twilio later. |
| GitHub | **GitHub OAuth App + Webhooks** | OAuth for account linking. Webhooks deliver push/deployment events. |
| Security Scanning | **npm audit + Retire.js + Trivy** | Multiple scanners for full CVE coverage across npm deps and Docker images. |
| Reverse Proxy | **Nginx** | SSL termination, request buffering, static file serving. |
| Process Manager | **PM2** | Clustering, zero-downtime restart, log management for Node apps. |
| Containers | **Docker + Docker Compose** | Reproducible environments. Single `docker-compose up` to start everything. |

---

## Module 1 — API Key System & Client Integration

### How API Keys Work

Every project in Sentinel gets a unique API key. This key is the identity credential for all SDK communication.

**Key format:** `sk_live_` prefix + 32 random bytes (hex) = 72 chars total.
Example: `sk_live_a3f9c2d8e1b4f7a2c5d8e3b6f9a2c5d8e1b4f7a2c5d8e3b6f9a2`

**Why this format:**
- `sk_live_` prefix makes it instantly recognizable in code reviews and prevents accidental exposure.
- 32 random bytes = 256 bits of entropy — brute-force is computationally impossible.
- Never stored as plaintext. Stored as `SHA-256(key)` hash in MongoDB.

### API Key Generation (Backend)

```javascript
// services/apiKeyService.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function generateApiKey(projectId, userId) {
  // 1. Generate raw key
  const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');

  // 2. Hash the key for storage (like a password — we never store plaintext)
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  // 3. Store the hash + metadata
  await ApiKey.create({
    projectId,
    userId,
    keyHash,
    keyPrefix: rawKey.substring(0, 14), // Store 'sk_live_a3f9c2' for display
    createdAt: new Date(),
    lastUsed: null,
    isActive: true,
    permissions: ['ingest:write', 'github:read'],
    rateLimit: 10000, // requests per hour
  });

  // 4. Return the raw key ONCE — never stored, never retrievable again
  return rawKey;
}
```

### Authentication Middleware

Every ingest request from an SDK goes through this middleware:

```javascript
// middleware/authenticate.js
const crypto = require('crypto');
const redis = require('../config/redis');

async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const rawKey = authHeader.replace('Bearer ', '');

  // 1. Validate format first (cheap check before DB hit)
  if (!rawKey.startsWith('sk_live_') || rawKey.length !== 72) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  // 2. Check Redis cache first (avoid DB hit on every request)
  const cacheKey = `apikey:${rawKey.substring(0, 20)}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    req.project = JSON.parse(cached);
    return next();
  }

  // 3. Hash the incoming key and look it up
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const apiKey = await ApiKey.findOne({ keyHash, isActive: true })
    .populate('projectId');

  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  // 4. Update last used (fire-and-forget, non-blocking)
  ApiKey.updateOne({ _id: apiKey._id }, { lastUsed: new Date() }).exec();

  // 5. Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(apiKey.projectId));

  req.project = apiKey.projectId;
  req.apiKey = apiKey;
  next();
}
```

### SDK Integration — What Goes in the Client App

The user installs the SDK in their Node.js app:

```bash
npm install @sentinel/node
```

```javascript
// In the client app's entry file (e.g., app.js or server.js)
const Sentinel = require('@sentinel/node');

// Initialize once at startup
Sentinel.init({
  apiKey: process.env.SENTINEL_KEY, // 'sk_live_xyz...'
  projectName: 'cab-service-prod',
  environment: process.env.NODE_ENV, // 'production'
  traceRoutes: true,      // Track every route's response time
  captureErrors: true,    // Auto-capture uncaught exceptions
  captureConsole: true,   // Capture console.error and console.warn
  sampleRate: 1.0,        // 100% of requests (reduce for high-traffic apps)
});

// Attach Express middleware (must be after routes for response time capture)
app.use(Sentinel.expressMiddleware());

// Sentinel also auto-hooks:
// process.on('uncaughtException', ...)
// process.on('unhandledRejection', ...)
```

### What the SDK Captures

The SDK runs a **transport layer** that batches events and sends them every 5 seconds to avoid overwhelming the Sentinel backend:

```javascript
// sdk/src/transport.js
class Transport {
  constructor(apiKey, endpoint) {
    this.queue = [];
    this.apiKey = apiKey;
    this.endpoint = endpoint;

    // Flush every 5 seconds
    setInterval(() => this.flush(), 5000);

    // Also flush on process exit
    process.on('beforeExit', () => this.flush(true));
  }

  enqueue(event) {
    this.queue.push({ ...event, timestamp: Date.now() });
    // Immediate flush if queue gets large
    if (this.queue.length >= 100) this.flush();
  }

  async flush(sync = false) {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, this.queue.length);

    const payload = {
      events: batch,
      sdkVersion: '1.0.0',
      agent: 'sentinel-node',
    };

    try {
      await fetch(this.endpoint + '/ingest/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Put failed events back in queue, retry next cycle
      this.queue.unshift(...batch);
    }
  }
}
```

---

## Module 2 — Website Uptime & Health Monitoring

### How Uptime Checking Works

Sentinel runs a **BullMQ repeatable job** for each monitored URL. It doesn't use a naive `setInterval` — Bull jobs are persistent, survive restarts, and can be distributed across multiple workers.

### Setting Up Uptime Jobs (When User Adds a URL)

```javascript
// services/uptimeService.js
const { Queue } = require('bullmq');
const uptimeQueue = new Queue('uptime-checks', { connection: redisConfig });

async function scheduleUptimeCheck(project, monitorConfig) {
  const { url, interval, method, expectedStatus, timeout, headers } = monitorConfig;

  // BullMQ repeatable job — runs every X minutes
  await uptimeQueue.add(
    `uptime:${monitorConfig._id}`,
    { monitorId: monitorConfig._id, projectId: project._id, url },
    {
      repeat: { every: interval * 60 * 1000 }, // interval in minutes
      jobId: `uptime:${monitorConfig._id}`,    // Unique ID prevents duplicate jobs
    }
  );
}
```

### The Uptime Worker

```javascript
// workers/uptimeWorker.js
const { Worker } = require('bullmq');
const axios = require('axios');

const worker = new Worker('uptime-checks', async (job) => {
  const { monitorId, projectId, url } = job.data;
  const monitor = await Monitor.findById(monitorId);

  const checkResult = {
    monitorId,
    projectId,
    url,
    timestamp: new Date(),
    status: 'unknown',
    statusCode: null,
    responseTime: null,
    error: null,
  };

  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: monitor.timeout || 10000, // 10s default
      validateStatus: () => true,        // Don't throw on 4xx/5xx
      headers: monitor.customHeaders || {},
      maxRedirects: 5,
    });

    checkResult.responseTime = Date.now() - startTime;
    checkResult.statusCode = response.status;
    checkResult.status = response.status < 400 ? 'up' : 'down';

    // Check for custom success keywords if configured
    if (monitor.expectedKeyword) {
      const bodyText = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);
      if (!bodyText.includes(monitor.expectedKeyword)) {
        checkResult.status = 'down';
        checkResult.error = `Expected keyword "${monitor.expectedKeyword}" not found in response`;
      }
    }

  } catch (err) {
    checkResult.status = 'down';
    checkResult.error = err.code || err.message; // ECONNREFUSED, ETIMEDOUT, etc.
    checkResult.responseTime = Date.now() - startTime;
  }

  // Save to InfluxDB for graphing
  await influxClient.writePoint({
    measurement: 'uptime_checks',
    tags: { monitorId, projectId, status: checkResult.status },
    fields: {
      responseTime: checkResult.responseTime || 0,
      statusCode: checkResult.statusCode || 0,
    },
    timestamp: checkResult.timestamp,
  });

  // Save to MongoDB for history
  await UptimeResult.create(checkResult);

  // Update monitor's current status
  await Monitor.updateOne({ _id: monitorId }, {
    currentStatus: checkResult.status,
    lastChecked: checkResult.timestamp,
    lastResponseTime: checkResult.responseTime,
  });

  // Trigger alert evaluation
  await alertQueue.add('evaluate', {
    type: 'uptime',
    projectId,
    monitorId,
    result: checkResult,
  });

}, { connection: redisConfig, concurrency: 50 }); // 50 parallel checks
```

### Uptime Percentage Calculation

```javascript
// Calculated on-demand via MongoDB aggregation
async function getUptimePercentage(monitorId, periodDays = 30) {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const result = await UptimeResult.aggregate([
    { $match: { monitorId: mongoose.Types.ObjectId(monitorId), timestamp: { $gte: since } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        up: { $sum: { $cond: [{ $eq: ['$status', 'up'] }, 1, 0] } },
      },
    },
    {
      $project: {
        uptimePercent: { $multiply: [{ $divide: ['$up', '$total'] }, 100] },
      },
    },
  ]);

  return result[0]?.uptimePercent ?? 100;
}
```

---

## Module 3 — Error Tracking & Log Ingestion

### Error Schema (MongoDB)

```javascript
// models/Error.js
const ErrorSchema = new mongoose.Schema({
  projectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  fingerprint:    { type: String, index: true },  // SHA-256 hash of error message + stack top frame
  type:           String,         // 'UnhandledRejection', 'TypeError', 'HttpError', etc.
  message:        String,
  stack:          String,         // Full stack trace
  level:          { type: String, enum: ['fatal', 'error', 'warning', 'info'], default: 'error' },

  // Request context (populated by Express middleware)
  request: {
    method:       String,         // 'POST'
    path:         String,         // '/api/bookings'
    statusCode:   Number,
    ip:           String,
    userAgent:    String,
    body:         mongoose.Schema.Types.Mixed,   // Sanitized request body
    headers:      mongoose.Schema.Types.Mixed,
  },

  // Environment context
  environment:    String,         // 'production', 'staging'
  release:        String,         // Git commit SHA
  serverName:     String,         // Hostname
  nodeVersion:    String,

  // Occurrence tracking
  firstSeen:      { type: Date, default: Date.now },
  lastSeen:       { type: Date, default: Date.now },
  occurrences:    { type: Number, default: 1 },

  // Status
  status:         { type: String, enum: ['open', 'resolved', 'ignored'], default: 'open' },
  resolvedAt:     Date,
  resolvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Linked GitHub commit (populated by GitHub integration)
  linkedCommit:   String,
}, { timestamps: true });

// Compound index for fast project+status queries
ErrorSchema.index({ projectId: 1, status: 1, lastSeen: -1 });
// TTL index: auto-delete resolved errors after 90 days
ErrorSchema.index({ resolvedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

### Error Fingerprinting — Grouping Similar Errors

Instead of creating a new DB record for every occurrence of the same error, we fingerprint and group them. This is how Sentry works.

```javascript
// services/errorService.js
function generateFingerprint(errorData) {
  // Normalize the stack trace to get the key frame (ignore line numbers which change after deploys)
  const topFrame = errorData.stack
    ?.split('\n')
    .slice(0, 3)                          // Take first 3 lines
    .map(line => line.replace(/:\d+:\d+/g, '')) // Remove line:col numbers
    .join('|');

  const input = `${errorData.type}|${errorData.message}|${topFrame}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

async function processIncomingError(projectId, rawError) {
  const fingerprint = generateFingerprint(rawError);

  // Try to find existing error with same fingerprint
  const existing = await ErrorEvent.findOne({ projectId, fingerprint, status: 'open' });

  if (existing) {
    // Update occurrence count and lastSeen — don't create a new record
    await ErrorEvent.updateOne(
      { _id: existing._id },
      {
        $inc: { occurrences: 1 },
        $set: { lastSeen: new Date(), request: rawError.request }
      }
    );
    return { action: 'updated', errorId: existing._id };
  } else {
    // New error — create record
    const created = await ErrorEvent.create({ projectId, fingerprint, ...rawError });

    // Trigger immediate alert for new errors
    await alertQueue.add('evaluate', {
      type: 'new_error',
      projectId,
      errorId: created._id,
      errorLevel: rawError.level,
    });

    return { action: 'created', errorId: created._id };
  }
}
```

---

## Module 4 — Real Traffic Monitoring

### What "Real Traffic" Means

The SDK's Express middleware captures **every request** — method, path, status code, response time, IP, user agent. This is aggregated into:

- Requests per minute (RPM)
- Average / P95 / P99 response times
- Error rate (% of 4xx/5xx)
- Top endpoints by traffic
- Geographic distribution (via MaxMind GeoLite2 IP lookup)

```javascript
// sdk/src/middleware.js
function sentinelMiddleware() {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;

      transport.enqueue({
        type: 'request',
        method: req.method,
        path: normalizePath(req.path),   // Replace /users/123 → /users/:id
        statusCode: res.statusCode,
        responseTime: durationMs,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        contentLength: res.get('content-length'),
        referrer: req.get('referrer'),
      });
    });

    next();
  };
}

// Path normalization prevents cardinality explosion in metrics
// Without this, /users/1, /users/2, /users/3 become 3 separate metrics
function normalizePath(path) {
  return path
    .replace(/\/[0-9a-f]{24}/g, '/:id')          // MongoDB ObjectIds
    .replace(/\/[0-9]+/g, '/:id')                  // Numeric IDs
    .replace(/\/[0-9a-f-]{36}/g, '/:uuid');        // UUIDs
}
```

---

## Module 5 — Alert Engine

### Alert Rules Schema

```javascript
// models/AlertRule.js
const AlertRuleSchema = new mongoose.Schema({
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  name:         String,
  isActive:     { type: Boolean, default: true },

  // Condition
  metric:       String,   // 'uptime', 'error_rate', 'response_time', 'new_error', 'security_threat'
  operator:     String,   // 'gt', 'lt', 'eq', 'contains'
  threshold:    Number,   // e.g., 500 (ms for response time), 5 (% for error rate)
  window:       Number,   // Evaluation window in minutes (e.g., 5 = last 5 minutes)
  consecutiveCount: { type: Number, default: 1 }, // Must trigger N times before alerting

  // Severity
  severity:     { type: String, enum: ['critical', 'warning', 'info'], default: 'warning' },

  // Notification targets
  channels:     [{ type: String, enum: ['email', 'whatsapp', 'slack', 'webhook'] }],
  recipients:   [String],  // Emails, phone numbers, webhook URLs
  webhookUrl:   String,

  // Cooldown — prevent alert storm
  cooldownMinutes: { type: Number, default: 30 },
  lastTriggeredAt: Date,
});
```

### Alert Evaluation Worker

```javascript
// workers/alertWorker.js
async function evaluateAlert(job) {
  const { type, projectId, result, errorLevel } = job.data;

  const rules = await AlertRule.find({
    projectId,
    isActive: true,
    metric: getMetricForType(type),
  });

  for (const rule of rules) {
    // Check cooldown — don't spam alerts
    if (rule.lastTriggeredAt) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      if (Date.now() - rule.lastTriggeredAt.getTime() < cooldownMs) {
        continue; // Still in cooldown, skip
      }
    }

    const shouldAlert = await evaluateCondition(rule, result, projectId);

    if (shouldAlert) {
      // Mark rule as triggered
      await AlertRule.updateOne({ _id: rule._id }, { lastTriggeredAt: new Date() });

      // Create alert record
      const alert = await Alert.create({
        projectId,
        ruleId: rule._id,
        severity: rule.severity,
        message: buildAlertMessage(rule, result),
        triggeredAt: new Date(),
        status: 'active',
        metadata: result,
      });

      // Queue notifications
      await notificationQueue.add('send', {
        alertId: alert._id,
        channels: rule.channels,
        recipients: rule.recipients,
        message: alert.message,
        severity: rule.severity,
      });

      // Push to dashboard via WebSocket
      io.to(`project:${projectId}`).emit('alert:new', alert);
    }
  }
}

async function evaluateCondition(rule, result, projectId) {
  switch (rule.metric) {
    case 'uptime':
      return rule.operator === 'eq' && result.status === 'down';

    case 'response_time':
      if (!result.responseTime) return false;
      return compareValues(result.responseTime, rule.operator, rule.threshold);

    case 'error_rate': {
      // Calculate error rate over last N minutes
      const windowStart = new Date(Date.now() - rule.window * 60 * 1000);
      const [total, errors] = await Promise.all([
        RequestLog.countDocuments({ projectId, timestamp: { $gte: windowStart } }),
        RequestLog.countDocuments({ projectId, timestamp: { $gte: windowStart }, statusCode: { $gte: 400 } }),
      ]);
      const errorRate = total > 0 ? (errors / total) * 100 : 0;
      return compareValues(errorRate, rule.operator, rule.threshold);
    }

    case 'new_error':
      return true; // Every new unique error triggers

    default:
      return false;
  }
}
```

---

## Module 6 — Communication Integrations

### Email Notifications (Nodemailer + HTML Templates)

```javascript
// services/notificationService.js
const nodemailer = require('nodemailer');
const { Resend } = require('resend'); // Modern alternative

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmailAlert(to, alertData) {
  const html = buildEmailTemplate(alertData); // HTML email template

  await transporter.sendMail({
    from: `"Sentinel Alerts" <alerts@yourdomain.com>`,
    to: to,
    subject: `[${alertData.severity.toUpperCase()}] ${alertData.title} — ${alertData.projectName}`,
    html,
    // Plain text fallback
    text: `${alertData.title}\n\n${alertData.message}\n\nView in dashboard: ${alertData.dashboardUrl}`,
  });
}
```

### WhatsApp Notifications (whatsapp-web.js)

```javascript
// services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.isReady = false;
    this.messageQueue = [];
  }

  async initialize() {
    this.client.on('qr', (qr) => {
      // On first run, display QR code in terminal for admin to scan
      qrcode.generate(qr, { small: true });
      console.log('Sentinel: Scan this QR code with your WhatsApp to enable notifications');
    });

    this.client.on('ready', () => {
      this.isReady = true;
      console.log('WhatsApp client ready');
      // Flush queued messages
      this.messageQueue.forEach(msg => this.sendMessage(msg.to, msg.text));
      this.messageQueue = [];
    });

    await this.client.initialize();
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isReady) {
      this.messageQueue.push({ to: phoneNumber, text: message });
      return;
    }

    // Format: 919876543210@c.us (91 = India country code)
    const chatId = phoneNumber.replace(/[^0-9]/g, '') + '@c.us';

    try {
      await this.client.sendMessage(chatId, message);
    } catch (err) {
      console.error('WhatsApp send failed:', err.message);
      // Fallback: log to notification failure queue
    }
  }

  async sendAlertMessage(phoneNumber, alertData) {
    const message = `🚨 *SENTINEL ALERT*\n\n` +
      `*Project:* ${alertData.projectName}\n` +
      `*Severity:* ${alertData.severity.toUpperCase()}\n` +
      `*Issue:* ${alertData.title}\n` +
      `*Details:* ${alertData.message}\n` +
      `*Time:* ${new Date().toLocaleString()}\n\n` +
      `View Dashboard: ${alertData.dashboardUrl}`;

    await this.sendMessage(phoneNumber, message);
  }
}

module.exports = new WhatsAppService();
```

---

## Module 7 — GitHub OAuth & Webhook Integration

### Step 1 — GitHub OAuth Flow

The user connects their GitHub account to Sentinel to allow repo access and webhook setup.

```
User clicks "Connect GitHub"
        │
        ▼
Sentinel redirects to GitHub OAuth:
https://github.com/login/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://sentinel.yourdomain.com/api/github/callback
  &scope=repo,read:user,admin:repo_hook
  &state=RANDOM_CSRF_TOKEN
        │
        ▼
User authorizes on GitHub
        │
        ▼
GitHub redirects to /api/github/callback?code=AUTH_CODE&state=...
        │
        ▼
Sentinel exchanges code for access_token
        │
        ▼
Sentinel fetches user's repos
        │
        ▼
User selects which repo to monitor
        │
        ▼
Sentinel creates webhook on that repo
```

```javascript
// api/github/callback.js
async function handleGitHubCallback(req, res) {
  const { code, state } = req.query;

  // Verify CSRF state token
  const savedState = await redis.get(`oauth:state:${req.user.id}`);
  if (state !== savedState) {
    return res.status(400).json({ error: 'Invalid OAuth state' });
  }

  // Exchange code for access token
  const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  }, { headers: { Accept: 'application/json' } });

  const { access_token, scope } = tokenResponse.data;

  // Encrypt and store the access token
  const encryptedToken = encrypt(access_token); // AES-256 encryption
  await ProjectIntegration.upsert({
    projectId: req.project._id,
    provider: 'github',
    encryptedToken,
    scopes: scope.split(','),
    connectedAt: new Date(),
  });

  // Fetch repos for user to choose from
  const octokit = new Octokit({ auth: access_token });
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated', per_page: 50,
  });

  res.json({ repos: repos.map(r => ({ id: r.id, name: r.full_name, private: r.private })) });
}
```

### Step 2 — Setting Up Webhooks on the User's Repo

```javascript
// services/githubService.js
async function setupWebhook(projectId, repoFullName, accessToken) {
  const octokit = new Octokit({ auth: accessToken });
  const [owner, repo] = repoFullName.split('/');

  // Webhook secret — used to verify payloads from GitHub
  const webhookSecret = crypto.randomBytes(32).toString('hex');
  await Project.updateOne({ _id: projectId }, { githubWebhookSecret: webhookSecret });

  const { data: webhook } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: `${process.env.SENTINEL_BASE_URL}/api/github/webhook/${projectId}`,
      content_type: 'json',
      secret: webhookSecret,
      insecure_ssl: '0',  // Require SSL
    },
    events: ['push', 'deployment', 'deployment_status', 'release', 'workflow_run'],
    active: true,
  });

  await Project.updateOne({ _id: projectId }, { githubWebhookId: webhook.id });
}
```

### Step 3 — Processing Webhook Events

```javascript
// api/github/webhook.js
async function handleWebhook(req, res) {
  const projectId = req.params.projectId;
  const project = await Project.findById(projectId);

  // CRITICAL: Verify webhook signature to prevent spoofing
  const signature = req.headers['x-hub-signature-256'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', project.githubWebhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Respond to GitHub immediately (must be within 10s or GitHub marks it failed)
  res.status(200).send('OK');

  // Process asynchronously
  const event = req.headers['x-github-event'];
  await githubQueue.add('process', { event, payload: req.body, projectId });
}

// Worker processes the event
async function processGitHubEvent(job) {
  const { event, payload, projectId } = job.data;

  switch (event) {
    case 'push': {
      // Store commit info
      const commit = await Commit.create({
        projectId,
        sha: payload.after,
        message: payload.commits[0]?.message,
        author: payload.pusher.name,
        branch: payload.ref.replace('refs/heads/', ''),
        url: payload.compare,
        pushedAt: new Date(),
        filesChanged: payload.commits.flatMap(c => [...c.added, ...c.modified, ...c.removed]),
      });

      // Link any errors that occurred after this commit
      await linkErrorsToCommit(projectId, commit._id, commit.pushedAt);

      // Trigger vulnerability scan on new code push
      await scanQueue.add('vulnerability', { projectId, commitSha: payload.after });
      break;
    }

    case 'deployment_status': {
      const status = payload.deployment_status.state;  // 'success', 'failure', 'error'
      await Deployment.create({
        projectId,
        environment: payload.deployment.environment,
        status,
        creator: payload.deployment.creator.login,
        commitSha: payload.deployment.sha,
        deployedAt: new Date(),
      });

      // If deployment failed, trigger self-healing evaluation
      if (['failure', 'error'].includes(status)) {
        await healingQueue.add('evaluate', { projectId, reason: 'deployment_failed' });
      }
      break;
    }
  }
}
```

---

## Module 8 — Self-Healing & Auto Rollback

### Overview

When a deployment causes errors or service degradation, Sentinel can automatically roll back to the last known-good commit.

**Rollback requires:**
1. GitHub access token with `repo` scope (already obtained in Module 7).
2. Project must have CI/CD via GitHub Actions, Render, Railway, or similar.
3. User must explicitly enable auto-heal and define conditions.

### Healing Decision Flow

```
Failure detected (error spike, uptime down, deployment_status: failure)
        │
        ▼
Load healing rules for project
        │
        ▼
Check conditions:
  - Is this a deployment-related failure? (errors appeared after commit X?)
  - Is error rate > threshold?
  - Has it been failing for > N minutes?
        │
        ▼
Find last good deployment (last deployment where status was 'success')
        │
        ▼
Execute rollback action:
  - GitHub Actions: Trigger workflow_dispatch with rollback job
  - Direct: Create revert commit via GitHub API
        │
        ▼
Monitor for 5 minutes — did errors decrease?
        │
        ├── Yes → Mark rollback successful, alert team
        └── No  → Escalate, alert team, do not auto-retry
```

```javascript
// workers/healingWorker.js
async function evaluateHealing(job) {
  const { projectId, reason } = job.data;
  const project = await Project.findById(projectId).populate('healingConfig');

  if (!project.healingConfig?.enabled) return;

  // Find the last good deployment
  const lastGood = await Deployment.findOne({
    projectId,
    status: 'success',
    deployedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }, // At least 5 mins old
  }).sort({ deployedAt: -1 });

  if (!lastGood) {
    await Alert.create({
      projectId,
      severity: 'critical',
      message: 'Auto-rollback failed: no previous good deployment found.',
    });
    return;
  }

  // Trigger rollback via GitHub Actions workflow_dispatch
  const octokit = new Octokit({ auth: await getDecryptedToken(projectId) });

  await octokit.rest.actions.createWorkflowDispatch({
    owner: project.githubOwner,
    repo: project.githubRepo,
    workflow_id: 'rollback.yml',   // User must have this workflow in their repo
    ref: 'main',
    inputs: {
      commit_sha: lastGood.commitSha,
      reason: `Sentinel auto-rollback: ${reason}`,
    },
  });

  // Log the healing action
  await HealingLog.create({
    projectId,
    action: 'rollback',
    targetCommit: lastGood.commitSha,
    reason,
    triggeredAt: new Date(),
    status: 'in_progress',
  });

  // Schedule verification check in 5 minutes
  await healingQueue.add('verify', { projectId, healingLogId: healingLog._id }, {
    delay: 5 * 60 * 1000,
  });
}
```

### Rollback Workflow (Goes in User's Repo)

```yaml
# .github/workflows/rollback.yml
name: Sentinel Auto Rollback

on:
  workflow_dispatch:
    inputs:
      commit_sha:
        description: 'Commit SHA to roll back to'
        required: true
      reason:
        description: 'Reason for rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Rollback to commit
        run: |
          git config user.email "sentinel-bot@yourdomain.com"
          git config user.name "Sentinel Bot"
          git revert --no-commit ${{ github.event.inputs.commit_sha }}..HEAD
          git commit -m "revert: Auto-rollback to ${{ github.event.inputs.commit_sha }}\n\nReason: ${{ github.event.inputs.reason }}"
          git push origin main

      - name: Deploy
        run: |
          # Your normal deploy script here
          npm ci && npm run deploy:prod
```

---

## Module 9 — Security, IP Protection & Malware Detection

### Layer 1: Rate Limiting (Per IP + Per API Key)

```javascript
// middleware/rateLimiter.js
const { RateLimiterRedis } = require('rate-limiter-flexible');

// Per-IP limiter — blocks bots and scrapers
const ipLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:ip',
  points: 100,          // 100 requests
  duration: 60,         // per 60 seconds
  blockDuration: 300,   // Block for 5 minutes if exceeded
});

// Per-API-key limiter — protects ingest endpoints
const keyLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:key',
  points: 1000,         // 1000 requests
  duration: 60,         // per 60 seconds
  blockDuration: 60,
});

async function rateLimitMiddleware(req, res, next) {
  const ip = req.ip;

  try {
    await ipLimiter.consume(ip);
  } catch (rejection) {
    // Log the blocked IP
    await SecurityEvent.create({
      type: 'rate_limit_exceeded',
      ip,
      path: req.path,
      timestamp: new Date(),
      blocked: true,
    });

    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejection.msBeforeNext / 1000),
    });
  }

  next();
}
```

### Layer 2: IP Blacklisting

```javascript
// middleware/ipGuard.js
async function ipGuard(req, res, next) {
  const ip = req.ip;

  // Check Redis blacklist first (O(1) lookup)
  const isBlacklisted = await redis.sismember('blacklist:ips', ip);
  if (isBlacklisted) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check against threat intelligence lists (async, non-blocking)
  checkThreatIntelligence(ip).then(isThreat => {
    if (isThreat) {
      redis.sadd('blacklist:ips', ip);
      redis.expire('blacklist:ips', 24 * 60 * 60); // 24h TTL
    }
  });

  next();
}

async function checkThreatIntelligence(ip) {
  // AbuseIPDB check — free API, 1000 checks/day
  const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
    params: { ipAddress: ip, maxAgeInDays: 30 },
    headers: { Key: process.env.ABUSEIPDB_KEY, Accept: 'application/json' },
  });
  // Block if abuse confidence score > 50
  return response.data.data.abuseConfidenceScore > 50;
}
```

### Layer 3: Anomaly Detection

```javascript
// services/securityService.js
async function detectAnomalies(projectId) {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000); // Last 1 hour

  // Detect brute force: >10 failed auth attempts from same IP
  const failedAuths = await RequestLog.aggregate([
    {
      $match: {
        projectId,
        path: { $regex: /\/login|\/auth|\/signin/ },
        statusCode: 401,
        timestamp: { $gte: windowStart },
      }
    },
    { $group: { _id: '$ip', count: { $sum: 1 } } },
    { $match: { count: { $gte: 10 } } },
  ]);

  for (const { _id: ip, count } of failedAuths) {
    await blacklistIP(ip, `Brute force detected: ${count} failed auth attempts in 1 hour`);
  }

  // Detect scanning: >50 distinct 404 paths from same IP
  const scanners = await RequestLog.aggregate([
    { $match: { projectId, statusCode: 404, timestamp: { $gte: windowStart } } },
    { $group: { _id: { ip: '$ip', path: '$path' } } },
    { $group: { _id: '$_id.ip', uniquePaths: { $sum: 1 } } },
    { $match: { uniquePaths: { $gte: 50 } } },
  ]);

  for (const { _id: ip } of scanners) {
    await blacklistIP(ip, 'Path scanning/enumeration detected');
  }
}
```

### Layer 4: Malware Pattern Detection in Incoming Requests

```javascript
// middleware/malwareDetect.js
// Detects common attack patterns in request body and query params

const ATTACK_PATTERNS = [
  { type: 'SQLi',  pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/i },
  { type: 'XSS',   pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i },
  { type: 'XSS',   pattern: /javascript\s*:/i },
  { type: 'SSRF',  pattern: /https?:\/\/(localhost|127\.|10\.|192\.168\.|::1)/i },
  { type: 'PathTraversal', pattern: /\.\.\/|\.\.\\|%2e%2e/i },
  { type: 'CmdInjection', pattern: /[;|&`$].*?(rm|cat|ls|wget|curl|bash|sh|python|perl)\s/i },
  { type: 'LDAPInjection', pattern: /[)(|*\\]/  },
];

async function malwareDetectMiddleware(req, res, next) {
  const toScan = JSON.stringify({
    query: req.query,
    body: req.body,
    params: req.params,
  });

  for (const { type, pattern } of ATTACK_PATTERNS) {
    if (pattern.test(toScan)) {
      // Log security event
      await SecurityEvent.create({
        projectId: req.project?._id,
        type: 'attack_pattern',
        attackType: type,
        ip: req.ip,
        path: req.path,
        payload: toScan.substring(0, 500), // Truncate for storage
        timestamp: new Date(),
      });

      // Auto-blacklist aggressive attackers
      const recentCount = await SecurityEvent.countDocuments({
        ip: req.ip,
        timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 mins
      });

      if (recentCount >= 3) {
        await redis.sadd('blacklist:ips', req.ip);
      }

      return res.status(400).json({ error: 'Bad request' }); // Don't reveal detection
    }
  }

  next();
}
```

---

## Module 10 — Vulnerability Scanning

### What Gets Scanned

| Target | Tool | What It Finds |
|---|---|---|
| npm dependencies | `npm audit` | Known CVEs in packages |
| npm dependencies | `retire.js` | Outdated packages with known issues |
| Docker images | `Trivy` | OS-level CVEs in container layers |
| Source code | Custom SAST rules | Hardcoded secrets, dangerous patterns |

### Vulnerability Scan Worker

```javascript
// workers/vulnerabilityWorker.js
const { execSync } = require('child_process');

async function runVulnerabilityScan(job) {
  const { projectId, repoPath } = job.data;

  const results = {
    npm: [],
    secrets: [],
    scanTime: new Date(),
  };

  // 1. npm audit
  try {
    const auditOutput = execSync('npm audit --json', {
      cwd: repoPath,
      timeout: 60000,
    });
    const audit = JSON.parse(auditOutput);

    for (const [name, advisory] of Object.entries(audit.vulnerabilities || {})) {
      results.npm.push({
        package: name,
        severity: advisory.severity,
        title: advisory.title || advisory.via?.[0]?.title,
        cve: advisory.via?.[0]?.cve,
        fixAvailable: advisory.fixAvailable,
        recommendation: advisory.fixAvailable
          ? `Run: npm audit fix`
          : `Upgrade to: ${advisory.fixAvailable?.version}`,
      });
    }
  } catch (err) {
    // npm audit exits with code 1 if vulnerabilities found — handle that
    if (err.stdout) {
      const audit = JSON.parse(err.stdout);
      // Process vulnerabilities same as above
    }
  }

  // 2. Scan for hardcoded secrets using regex patterns
  const SECRET_PATTERNS = [
    { name: 'AWS Access Key',    pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'GitHub Token',      pattern: /ghp_[0-9a-zA-Z]{36}/g },
    { name: 'Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24}/g },
    { name: 'Private Key Block', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g },
    { name: 'Generic Secret',    pattern: /(?:password|secret|token|api_key)\s*=\s*['"][^'"]{8,}['"]/gi },
  ];

  const files = getFilesToScan(repoPath); // Recursively get .js, .ts, .env* files
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        results.secrets.push({
          type: name,
          file: file.replace(repoPath, ''), // Relative path
          severity: 'critical',
          recommendation: 'Rotate this credential immediately and remove from codebase',
        });
      }
    }
  }

  // Save scan results
  await VulnerabilityReport.create({ projectId, ...results });

  // Alert on critical findings
  const criticals = results.npm.filter(v => v.severity === 'critical')
    .concat(results.secrets);

  if (criticals.length > 0) {
    await alertQueue.add('evaluate', {
      type: 'vulnerability',
      projectId,
      count: criticals.length,
      items: criticals,
    });
  }
}
```

---

## Module 11 — Team & Role Access (RBAC)

### Role Definitions

| Role | Permissions |
|---|---|
| **Owner** | All permissions + billing, delete project, manage integrations |
| **Admin** | All permissions except billing/delete |
| **Developer** | View all + manage alerts + resolve errors |
| **Viewer** | Read-only access to all data |

```javascript
// models/TeamMember.js
const TeamMemberSchema = new mongoose.Schema({
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role:       { type: String, enum: ['owner', 'admin', 'developer', 'viewer'] },
  invitedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joinedAt:   Date,
  inviteToken: String,    // Hashed token for pending invitations
  inviteEmail: String,
  status:     { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
});

// RBAC Permissions Map
const PERMISSIONS = {
  owner:     ['*'],
  admin:     ['project:read', 'project:update', 'team:invite', 'team:remove',
               'alerts:manage', 'errors:resolve', 'settings:manage', 'github:manage'],
  developer: ['project:read', 'alerts:manage', 'errors:resolve', 'settings:view'],
  viewer:    ['project:read', 'settings:view'],
};

// Middleware
function requirePermission(permission) {
  return async (req, res, next) => {
    const member = await TeamMember.findOne({
      projectId: req.project._id,
      userId: req.user._id,
      status: 'active',
    });

    if (!member) return res.status(403).json({ error: 'Not a team member' });

    const permissions = PERMISSIONS[member.role];
    const hasPermission = permissions.includes('*') || permissions.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({ error: `Requires ${permission} permission` });
    }

    req.member = member;
    next();
  };
}
```

### Invitation Flow

```javascript
// services/teamService.js
async function inviteTeamMember(projectId, invitedByUserId, email, role) {
  // Generate secure invite token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await TeamMember.create({
    projectId,
    invitedBy: invitedByUserId,
    role,
    inviteEmail: email,
    inviteToken: tokenHash,
    status: 'pending',
  });

  // Send invite email
  const inviteUrl = `${process.env.DASHBOARD_URL}/invite/accept?token=${rawToken}`;
  await sendEmail(email, 'invite', { inviteUrl, role, projectName });

  return { success: true, expiresAt };
}

async function acceptInvite(rawToken, userId) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const invite = await TeamMember.findOne({ inviteToken: tokenHash, status: 'pending' });

  if (!invite) throw new Error('Invalid or expired invite');
  if (invite.expiresAt < new Date()) throw new Error('Invite has expired');

  await TeamMember.updateOne({ _id: invite._id }, {
    userId,
    status: 'active',
    joinedAt: new Date(),
    inviteToken: null, // Clear token after use
  });
}
```

---

## Database Schema Design

### Collections Overview

```
MongoDB Collections:
├── users                    # Auth, profile, notification preferences
├── projects                 # Each monitored app = one project
├── api_keys                 # Hashed API keys per project
├── team_members             # RBAC: who has access to which project
├── monitors                 # URL uptime monitor configs
├── uptime_results           # Uptime check history (capped collection)
├── error_events             # Deduplicated errors with fingerprints
├── request_logs             # Raw request logs (TTL: 30 days)
├── alert_rules              # Alert condition configs
├── alerts                   # Triggered alert history
├── commits                  # GitHub commit records
├── deployments              # Deployment history
├── healing_logs             # Self-healing action history
├── security_events          # Attack attempts, blocked IPs
├── vulnerability_reports    # Dependency scan results
└── notification_logs        # Delivery receipts for all notifications

InfluxDB Measurements:
├── uptime_checks            # response_time, status tags
├── request_metrics          # rpm, p95, p99, error_rate per endpoint
└── system_metrics           # CPU, memory (if agent installed)
```

### Indexing Strategy

```javascript
// Critical indexes for performance — add to your migration file

// Fast project+time queries on logs
RequestLog.index({ projectId: 1, timestamp: -1 });
// TTL: auto-delete logs after 30 days
RequestLog.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Error lookup by project and status
ErrorEvent.index({ projectId: 1, status: 1, lastSeen: -1 });
// Fingerprint uniqueness per project
ErrorEvent.index({ projectId: 1, fingerprint: 1 });

// Alert history per project
Alert.index({ projectId: 1, triggeredAt: -1 });

// Security events for IP analysis
SecurityEvent.index({ ip: 1, timestamp: -1 });
SecurityEvent.index({ projectId: 1, type: 1, timestamp: -1 });

// GitHub commits for rollback lookup
Commit.index({ projectId: 1, pushedAt: -1 });
Deployment.index({ projectId: 1, status: 1, deployedAt: -1 });
```

---

## Complete API Reference

### Authentication Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login, returns access + refresh tokens
POST   /api/auth/refresh           Get new access token using refresh token
POST   /api/auth/logout            Revoke refresh token
POST   /api/auth/forgot-password   Send password reset email
POST   /api/auth/reset-password    Reset password with token
```

### Project Endpoints

```
GET    /api/projects               List all projects for user
POST   /api/projects               Create new project
GET    /api/projects/:id           Get project details
PATCH  /api/projects/:id           Update project settings
DELETE /api/projects/:id           Delete project (owner only)
POST   /api/projects/:id/rotate-key  Rotate API key
```

### Ingest Endpoints (SDK → Backend, authenticated via API key)

```
POST   /api/ingest/batch           Batch ingest — all event types
POST   /api/ingest/errors          Single error event
POST   /api/ingest/logs            Log entries
POST   /api/ingest/metrics         Custom metrics
```

### Monitoring Endpoints

```
GET    /api/monitors               List monitors for project
POST   /api/monitors               Create new uptime monitor
PATCH  /api/monitors/:id           Update monitor config
DELETE /api/monitors/:id           Delete monitor
GET    /api/monitors/:id/uptime    Get uptime %, response time history
GET    /api/monitors/:id/checks    Get recent check results
```

### Error Tracking Endpoints

```
GET    /api/errors                 List errors (filterable by status, level, date)
GET    /api/errors/:id             Get error detail with stack trace
PATCH  /api/errors/:id/resolve     Mark error as resolved
PATCH  /api/errors/:id/ignore      Ignore error
GET    /api/errors/stats           Error rate, trend data
```

### GitHub Integration Endpoints

```
GET    /api/github/connect         Start OAuth flow
GET    /api/github/callback        OAuth callback
GET    /api/github/repos           List connected repos
POST   /api/github/repos/:id/setup Setup webhook on repo
DELETE /api/github/disconnect      Remove GitHub integration
POST   /api/github/webhook/:projectId  GitHub webhook receiver
GET    /api/commits                List commits for project
GET    /api/deployments            List deployments for project
POST   /api/deployments/rollback   Manual rollback trigger
```

### Security Endpoints

```
GET    /api/security/events        Security event log
GET    /api/security/blacklist     View blacklisted IPs
POST   /api/security/blacklist     Manually blacklist an IP
DELETE /api/security/blacklist/:ip  Remove IP from blacklist
GET    /api/security/vulnerabilities  Latest vulnerability report
POST   /api/security/scan          Trigger manual vulnerability scan
```

### Team Endpoints

```
GET    /api/team                   List team members
POST   /api/team/invite            Send invite
DELETE /api/team/:userId           Remove team member
PATCH  /api/team/:userId/role      Change role
GET    /api/invites/accept         Accept invite via token
```

### Alert Endpoints

```
GET    /api/alerts                 Alert history
GET    /api/alerts/active          Currently active alerts
POST   /api/alert-rules            Create alert rule
GET    /api/alert-rules            List rules
PATCH  /api/alert-rules/:id        Update rule
DELETE /api/alert-rules/:id        Delete rule
POST   /api/alert-rules/:id/test   Test fire an alert
```

---

## Security Hardening Checklist

Before deploying to production, verify every item:

```
Authentication & Access
  ☐ Passwords hashed with bcrypt (salt rounds ≥ 12)
  ☐ JWT secret is 256-bit random, rotated on breach
  ☐ Access tokens expire in ≤ 15 minutes
  ☐ Refresh tokens stored in httpOnly, Secure, SameSite=Strict cookies
  ☐ API keys stored as SHA-256 hash only — never plaintext
  ☐ GitHub access tokens encrypted with AES-256 before DB storage
  ☐ Rate limiting on /auth/* endpoints (max 5 attempts/min per IP)
  ☐ Account lockout after 10 failed attempts

Transport Security
  ☐ HTTPS everywhere (no HTTP in production)
  ☐ HSTS header set (max-age=31536000; includeSubDomains)
  ☐ TLS 1.2 minimum (TLS 1.3 preferred)
  ☐ CORS configured — only allow dashboard origin
  ☐ CSP headers on dashboard

Input Validation
  ☐ All inputs validated with Joi or Zod schemas
  ☐ MongoDB injection prevention (mongoose auto-sanitizes, but validate types)
  ☐ Request body size limit (express.json({ limit: '100kb' }))
  ☐ File upload validation if accepting files

Webhook Security
  ☐ GitHub webhook signatures verified with timing-safe comparison
  ☐ Webhook endpoints rate-limited separately

Infrastructure
  ☐ MongoDB not exposed publicly (only accessible within VPC/Docker network)
  ☐ Redis password protected
  ☐ Environment variables in .env — never committed to Git
  ☐ Docker secrets for production credentials
  ☐ Firewall: only ports 80/443 exposed externally
  ☐ Regular automated backups (MongoDB Atlas or mongodump cron)
  ☐ Audit log for all destructive actions (delete, role change, key rotation)
```

---

## Deployment Guide

### Local Development

```bash
# 1. Clone and install dependencies
git clone https://github.com/yourorg/sentinel.git
cd sentinel
npm install

# 2. Start infrastructure services
docker-compose up -d mongodb redis influxdb

# 3. Copy and configure environment
cp .env.example .env
# Edit .env — see Environment Variables section

# 4. Run database migrations
npm run db:migrate

# 5. Start all services in dev mode
npm run dev  # Uses turborepo to run all packages in parallel
```

### Production Deployment (Docker Compose)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend

  backend:
    build: ./apps/backend
    environment:
      NODE_ENV: production
    env_file: .env.production
    restart: unless-stopped
    deploy:
      replicas: 2  # 2 backend instances for HA

  dashboard:
    build: ./apps/dashboard
    # Static files served by Nginx

  workers:
    build: ./apps/backend
    command: node src/workers/index.js
    restart: unless-stopped
    deploy:
      replicas: 2  # Separate worker pool

  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASS}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASS}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  influxdb:
    image: influxdb:2.7
    volumes:
      - influxdb_data:/var/lib/influxdb2
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: ${INFLUX_USER}
      DOCKER_INFLUXDB_INIT_PASSWORD: ${INFLUX_PASS}
      DOCKER_INFLUXDB_INIT_ORG: sentinel
      DOCKER_INFLUXDB_INIT_BUCKET: metrics
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
  influxdb_data:
```

### SSL Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d sentinel.yourdomain.com

# Auto-renew cron (add to crontab)
0 3 * * * certbot renew --quiet && docker-compose restart nginx
```

---

## Environment Variables Reference

```bash
# apps/backend/.env.example

# ─── App ────────────────────────────────────
NODE_ENV=development
PORT=4000
SENTINEL_BASE_URL=https://sentinel.yourdomain.com
DASHBOARD_URL=https://sentinel.yourdomain.com

# ─── Database ───────────────────────────────
MONGO_URI=mongodb://localhost:27017/sentinel
REDIS_URL=redis://localhost:6379
REDIS_PASS=your_redis_password
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your_influxdb_token
INFLUX_ORG=sentinel
INFLUX_BUCKET=metrics

# ─── Auth ───────────────────────────────────
JWT_SECRET=replace_with_256bit_random_string
JWT_REFRESH_SECRET=replace_with_different_256bit_random_string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ─── Encryption (for GitHub tokens in DB) ───
ENCRYPTION_KEY=replace_with_32_byte_hex_string  # 64 hex chars

# ─── Email ──────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
ALERT_FROM_EMAIL=alerts@yourdomain.com

# ─── GitHub OAuth ────────────────────────────
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
GITHUB_REDIRECT_URI=https://sentinel.yourdomain.com/api/github/callback

# ─── Security APIs ──────────────────────────
ABUSEIPDB_KEY=your_abuseipdb_api_key     # Free at abuseipdb.com

# ─── WhatsApp ────────────────────────────────
WHATSAPP_SESSION_PATH=./whatsapp-session

# ─── Scanning ───────────────────────────────
REPO_CLONE_PATH=/tmp/sentinel-repos      # Where repos are cloned for scanning
```

---

## What Makes Sentinel Different

| Feature | Datadog | Sentry | UptimeRobot | Sentinel |
|---|---|---|---|---|
| Error Tracking | ❌ | ✅ | ❌ | ✅ |
| Uptime Monitoring | ✅ | ❌ | ✅ | ✅ |
| Real Traffic Analysis | ✅ | ❌ | ❌ | ✅ |
| GitHub Rollback | ❌ | ❌ | ❌ | ✅ |
| Auto Self-Healing | ❌ | ❌ | ❌ | ✅ |
| Malware / Attack Detection | Partial | ❌ | ❌ | ✅ |
| Vulnerability Scanning | ❌ | ❌ | ❌ | ✅ |
| WhatsApp Alerts | ❌ | ❌ | ❌ | ✅ |
| Team RBAC | ✅ | ✅ | Partial | ✅ |
| Self-Hosted | ❌ | Partial | ❌ | ✅ |
| **Monthly Cost** | **$15–500+** | **$26–$80+** | **$7–$20+** | **Your server cost only** |

---

*Built with ❤️ — Sentinel gives developers full ownership and zero vendor lock-in.*

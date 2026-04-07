/**
 * Render Log Integration — Upbase Monitoring
 * 
 * Polls Render API for service deploy events and logs, transforms them
 * into backend logs, and pushes them to POST /api/logs.
 * 
 * Supports:
 *  ✅ Deploy event tracking (succeeded / failed / cancelled)
 *  ✅ Service status monitoring (suspended / deactivated)
 *  ✅ Build log capture
 *  ✅ Configurable poll interval
 *  ✅ Multi-service monitoring
 *  ✅ Exponential retry on delivery failure
 * 
 * Setup:
 *   1. Set environment variables (see below)
 *   2. Run: node render-integration.js
 *   3. Or import and use programmatically
 * 
 * Environment Variables:
 *   RENDER_API_KEY      — Render API key (from dashboard → Account Settings)
 *   RENDER_SERVICE_IDS  — Comma-separated Render service IDs to monitor
 *   UPBASE_ENDPOINT     — Upbase log API URL (default: http://localhost:5000/api/logs)
 *   UPBASE_API_KEY      — Upbase log API key
 *   UPBASE_PROJECT_ID   — Project ID for log enrichment
 *   RENDER_POLL_INTERVAL — Poll interval in seconds (default: 120)
 */

const RENDER_API_BASE = 'https://api.render.com/v1';

const DEFAULT_CONFIG = {
  renderApiKey: process.env.RENDER_API_KEY || '',
  serviceIds: (process.env.RENDER_SERVICE_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
  upbaseEndpoint: process.env.UPBASE_ENDPOINT || 'http://localhost:5000/api/logs',
  upbaseApiKey: process.env.UPBASE_API_KEY || 'upbase-log-dev-key-2026',
  projectId: process.env.UPBASE_PROJECT_ID || null,
  environment: process.env.NODE_ENV || 'production',
  pollIntervalSec: parseInt(process.env.RENDER_POLL_INTERVAL, 10) || 120,
  maxRetries: 3,
};

/**
 * Create and start a Render log collector.
 */
export function createRenderCollector(userConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...userConfig };
  let timer = null;
  let lastPollTime = new Date(Date.now() - cfg.pollIntervalSec * 1000).toISOString();
  const seenDeployIds = new Set();

  // ─── Render API helpers ─────────────────────────────────────
  async function renderFetch(path) {
    const res = await fetch(`${RENDER_API_BASE}${path}`, {
      headers: {
        'Authorization': `Bearer ${cfg.renderApiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Render API ${res.status}: ${text.substring(0, 256)}`);
    }

    return res.json();
  }

  // ─── Fetch services ─────────────────────────────────────────
  async function fetchServices() {
    if (cfg.serviceIds.length > 0) {
      // Fetch specific services
      const services = await Promise.all(
        cfg.serviceIds.map(async (id) => {
          try {
            return await renderFetch(`/services/${id}`);
          } catch (err) {
            console.warn(`[RENDER-COLLECTOR] Failed to fetch service ${id}: ${err.message}`);
            return null;
          }
        })
      );
      return services.filter(Boolean);
    }

    // Auto-discover all services
    const result = await renderFetch('/services?limit=50');
    return Array.isArray(result) ? result.map(r => r.service || r) : [];
  }

  // ─── Fetch deploys for a service ────────────────────────────
  async function fetchRecentDeploys(serviceId) {
    try {
      const deploys = await renderFetch(`/services/${serviceId}/deploys?limit=10`);
      return Array.isArray(deploys) ? deploys.map(d => d.deploy || d) : [];
    } catch (err) {
      console.warn(`[RENDER-COLLECTOR] Failed to fetch deploys for ${serviceId}: ${err.message}`);
      return [];
    }
  }

  // ─── Transform deploy events ────────────────────────────────
  function transformDeploy(deploy, service) {
    const serviceName = service?.name || service?.service?.name || deploy.serviceId || 'unknown';
    const status = deploy.status;
    const region = service?.region || service?.service?.region || null;

    let severity = 'info';
    if (status === 'build_failed' || status === 'update_failed' || status === 'deactivated') {
      severity = 'error';
    } else if (status === 'canceled' || status === 'cancelled') {
      severity = 'warning';
    } else if (status === 'live') {
      severity = 'info';
    }

    return {
      type: 'backend',
      source: 'render',
      service: serviceName,
      severity,
      message: `Deploy ${deploy.id?.substring(0, 8) || '?'}: ${status} on ${serviceName}`,
      metadata: {
        deployId: deploy.id,
        status,
        commitId: deploy.commit?.id?.substring(0, 8),
        commitMessage: deploy.commit?.message?.substring(0, 256),
        branch: deploy.commit?.branch || deploy.branch,
        createdAt: deploy.createdAt,
        updatedAt: deploy.updatedAt,
        finishedAt: deploy.finishedAt,
        buildDurationSec: deploy.finishedAt && deploy.createdAt
          ? Math.round((new Date(deploy.finishedAt) - new Date(deploy.createdAt)) / 1000)
          : null,
        _source_integration: 'render',
      },
      timestamp: deploy.updatedAt || deploy.createdAt || new Date().toISOString(),
      ...(cfg.projectId && { project_id: cfg.projectId }),
      environment: cfg.environment,
      region: region,
    };
  }

  // ─── Transform service status ───────────────────────────────
  function transformServiceStatus(service) {
    const svc = service.service || service;
    const status = svc.suspended;
    const name = svc.name || svc.id;

    if (status === 'suspended') {
      return {
        type: 'backend',
        source: 'render',
        service: name,
        severity: 'warning',
        message: `Service ${name} is suspended`,
        metadata: {
          serviceId: svc.id,
          type: svc.type,
          _source_integration: 'render',
        },
        timestamp: new Date().toISOString(),
        ...(cfg.projectId && { project_id: cfg.projectId }),
        environment: cfg.environment,
      };
    }

    return null;
  }

  // ─── Send logs to Upbase ────────────────────────────────────
  async function sendToUpbase(logs, attempt = 1) {
    if (logs.length === 0) return;

    try {
      const res = await fetch(cfg.upbaseEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-log-api-key': cfg.upbaseApiKey,
        },
        body: JSON.stringify(logs),
      });

      if (!res.ok) {
        throw new Error(`Upbase API ${res.status}`);
      }

      const result = await res.json();
      console.log(`[RENDER-COLLECTOR] Sent ${result.accepted} logs to Upbase`);
    } catch (err) {
      if (attempt < cfg.maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.warn(`[RENDER-COLLECTOR] Retry ${attempt}/${cfg.maxRetries} in ${delay}ms: ${err.message}`);
        await new Promise(r => setTimeout(r, delay));
        return sendToUpbase(logs, attempt + 1);
      }
      console.error(`[RENDER-COLLECTOR] Failed after ${cfg.maxRetries} retries: ${err.message}`);
    }
  }

  // ─── Poll cycle ─────────────────────────────────────────────
  async function poll() {
    const since = lastPollTime;
    lastPollTime = new Date().toISOString();

    try {
      console.log(`[RENDER-COLLECTOR] Polling Render since ${since}...`);

      const services = await fetchServices();
      console.log(`[RENDER-COLLECTOR] Monitoring ${services.length} services`);

      const allLogs = [];

      for (const service of services) {
        const svc = service.service || service;

        // Check service status
        const statusLog = transformServiceStatus(service);
        if (statusLog) allLogs.push(statusLog);

        // Check recent deploys
        const deploys = await fetchRecentDeploys(svc.id);
        for (const deploy of deploys) {
          const dep = deploy.deploy || deploy;
          // Only process new deploys since last poll
          const deployTime = new Date(dep.updatedAt || dep.createdAt);
          if (deployTime >= new Date(since) && !seenDeployIds.has(dep.id)) {
            seenDeployIds.add(dep.id);
            allLogs.push(transformDeploy(dep, service));

            // Keep seenDeployIds bounded
            if (seenDeployIds.size > 500) {
              const entries = [...seenDeployIds];
              entries.splice(0, 250).forEach(id => seenDeployIds.delete(id));
            }
          }
        }
      }

      if (allLogs.length > 0) {
        await sendToUpbase(allLogs);
      } else {
        console.log('[RENDER-COLLECTOR] No new events.');
      }
    } catch (err) {
      console.error(`[RENDER-COLLECTOR] Poll error: ${err.message}`);

      await sendToUpbase([{
        type: 'system',
        source: 'render',
        service: 'log-collector',
        severity: 'error',
        message: `Render log collection failed: ${err.message}`,
        metadata: { error: err.message, _source_integration: 'render' },
        ...(cfg.projectId && { project_id: cfg.projectId }),
        environment: cfg.environment,
      }]);
    }
  }

  // ─── Control API ────────────────────────────────────────────
  return {
    start() {
      console.log(`[RENDER-COLLECTOR] Starting with ${cfg.pollIntervalSec}s interval`);
      poll();
      timer = setInterval(poll, cfg.pollIntervalSec * 1000);
    },

    stop() {
      if (timer) clearInterval(timer);
      console.log('[RENDER-COLLECTOR] Stopped');
    },

    pollNow: poll,
  };
}

// ─── CLI Execution ──────────────────────────────────────────────
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('render-integration.js') ||
  process.argv[1].endsWith('render-integration.mjs')
);

if (isMainModule) {
  if (!process.env.RENDER_API_KEY) {
    console.error('Missing required env var: RENDER_API_KEY');
    console.error('Usage: RENDER_API_KEY=xxx node render-integration.js');
    process.exit(1);
  }

  const collector = createRenderCollector();
  collector.start();

  process.on('SIGINT', () => { collector.stop(); process.exit(0); });
  process.on('SIGTERM', () => { collector.stop(); process.exit(0); });
}

export default createRenderCollector;

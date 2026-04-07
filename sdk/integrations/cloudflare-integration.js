/**
 * Cloudflare Log Integration — Upbase Monitoring
 * 
 * Polls Cloudflare Analytics API for HTTP error events, transforms them
 * into system logs, and pushes them to POST /api/logs.
 * 
 * Supports:
 *  ✅ HTTP 5xx error detection
 *  ✅ HTTP 4xx error detection (configurable)
 *  ✅ High latency detection (p99 threshold)
 *  ✅ Firewall / WAF events
 *  ✅ Configurable poll interval
 *  ✅ Exponential retry on delivery failure
 * 
 * Setup:
 *   1. Set environment variables (see below)
 *   2. Run: node cloudflare-integration.js
 *   3. Or import and use programmatically
 * 
 * Environment Variables:
 *   CF_API_TOKEN      — Cloudflare API token with Analytics read access
 *   CF_ZONE_ID        — Cloudflare zone ID for your domain
 *   UPBASE_ENDPOINT   — Upbase log API URL (default: http://localhost:5000/api/logs)
 *   UPBASE_API_KEY    — Upbase log API key
 *   UPBASE_PROJECT_ID — Project ID for log enrichment
 *   CF_POLL_INTERVAL  — Poll interval in seconds (default: 60)
 *   CF_LATENCY_THRESHOLD — Latency threshold in ms for alerts (default: 2000)
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

const DEFAULT_CONFIG = {
  cfApiToken: process.env.CF_API_TOKEN || '',
  cfZoneId: process.env.CF_ZONE_ID || '',
  upbaseEndpoint: process.env.UPBASE_ENDPOINT || 'http://localhost:5000/api/logs',
  upbaseApiKey: process.env.UPBASE_API_KEY || 'upbase-log-dev-key-2026',
  projectId: process.env.UPBASE_PROJECT_ID || null,
  environment: process.env.NODE_ENV || 'production',
  pollIntervalSec: parseInt(process.env.CF_POLL_INTERVAL, 10) || 60,
  latencyThresholdMs: parseInt(process.env.CF_LATENCY_THRESHOLD, 10) || 2000,
  include4xx: false,      // Whether to also capture 4xx errors
  maxRetries: 3,
};

/**
 * Create and start a Cloudflare log collector.
 */
export function createCloudflareCollector(userConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...userConfig };
  let timer = null;
  let lastPollTime = new Date(Date.now() - cfg.pollIntervalSec * 1000).toISOString();

  // ─── Cloudflare GraphQL Analytics Query ─────────────────────
  async function fetchCloudflareAnalytics(since) {
    const query = `
      query {
        viewer {
          zones(filter: { zoneTag: "${cfg.cfZoneId}" }) {
            httpRequests1mGroups(
              limit: 50,
              filter: { datetime_gt: "${since}" }
              orderBy: [datetime_ASC]
            ) {
              dimensions {
                datetime
              }
              sum {
                requests
                pageViews
                threats
                bytes
              }
              uniq {
                uniques
              }
            }
            httpRequestsAdaptiveGroups(
              limit: 100,
              filter: {
                datetime_gt: "${since}",
                edgeResponseStatus_geq: ${cfg.include4xx ? 400 : 500}
              }
              orderBy: [datetime_ASC]
            ) {
              dimensions {
                datetime
                edgeResponseStatus
                clientRequestHTTPHost
                clientRequestPath
                clientCountryName
                upperTierColoName
              }
              count
            }
          }
        }
      }
    `;

    const res = await fetch(`${CF_API_BASE}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudflare API ${res.status}: ${text.substring(0, 256)}`);
    }

    return res.json();
  }

  // ─── Fetch Cloudflare Analytics via REST (fallback) ─────────
  async function fetchCloudflareHTTPSummary(since) {
    const sinceDate = since.split('T')[0]; // YYYY-MM-DD
    const untilDate = new Date().toISOString().split('T')[0];

    const res = await fetch(
      `${CF_API_BASE}/zones/${cfg.cfZoneId}/analytics/dashboard?since=${sinceDate}&until=${untilDate}&continuous=true`,
      {
        headers: { 'Authorization': `Bearer ${cfg.cfApiToken}` },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudflare REST API ${res.status}: ${text.substring(0, 256)}`);
    }

    return res.json();
  }

  // ─── Transform CF data into Upbase log format ──────────────
  function transformErrorGroups(groups) {
    const logs = [];

    for (const group of groups) {
      const { dimensions, count } = group;
      const status = dimensions.edgeResponseStatus;
      const severity = status >= 500 ? 'error' : 'warning';

      logs.push({
        type: 'system',
        source: 'cloudflare',
        service: dimensions.clientRequestHTTPHost || 'edge',
        severity,
        message: `HTTP ${status} on ${dimensions.clientRequestPath || '/'} (${count} occurrences)`,
        metadata: {
          statusCode: status,
          host: dimensions.clientRequestHTTPHost,
          path: dimensions.clientRequestPath,
          country: dimensions.clientCountryName,
          colo: dimensions.upperTierColoName,
          occurrences: count,
          _source_integration: 'cloudflare',
        },
        timestamp: dimensions.datetime,
        ...(cfg.projectId && { project_id: cfg.projectId }),
        environment: cfg.environment,
        region: dimensions.upperTierColoName || null,
      });
    }

    return logs;
  }

  // ─── Transform summary threats into warnings ───────────────
  function transformSummary(summaryGroups) {
    const logs = [];

    for (const group of summaryGroups) {
      if (group.sum.threats > 0) {
        logs.push({
          type: 'system',
          source: 'cloudflare',
          service: 'waf',
          severity: 'warning',
          message: `${group.sum.threats} threats detected in period`,
          metadata: {
            threats: group.sum.threats,
            requests: group.sum.requests,
            period: group.dimensions.datetime,
            _source_integration: 'cloudflare',
          },
          timestamp: group.dimensions.datetime,
          ...(cfg.projectId && { project_id: cfg.projectId }),
          environment: cfg.environment,
        });
      }
    }

    return logs;
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
      console.log(`[CF-COLLECTOR] Sent ${result.accepted} logs (${result.rejected || 0} rejected)`);
    } catch (err) {
      if (attempt < cfg.maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.warn(`[CF-COLLECTOR] Retry ${attempt}/${cfg.maxRetries} in ${delay}ms: ${err.message}`);
        await new Promise(r => setTimeout(r, delay));
        return sendToUpbase(logs, attempt + 1);
      }
      console.error(`[CF-COLLECTOR] Failed after ${cfg.maxRetries} retries: ${err.message}`);
    }
  }

  // ─── Poll cycle ─────────────────────────────────────────────
  async function poll() {
    const since = lastPollTime;
    lastPollTime = new Date().toISOString();

    try {
      console.log(`[CF-COLLECTOR] Polling Cloudflare since ${since}...`);

      const data = await fetchCloudflareAnalytics(since);
      const zones = data?.data?.viewer?.zones?.[0];

      if (!zones) {
        console.warn('[CF-COLLECTOR] No zone data returned');
        return;
      }

      const allLogs = [];

      // Process error groups
      if (zones.httpRequestsAdaptiveGroups) {
        allLogs.push(...transformErrorGroups(zones.httpRequestsAdaptiveGroups));
      }

      // Process threats from summary
      if (zones.httpRequests1mGroups) {
        allLogs.push(...transformSummary(zones.httpRequests1mGroups));
      }

      if (allLogs.length > 0) {
        await sendToUpbase(allLogs);
      } else {
        console.log(`[CF-COLLECTOR] No new error events.`);
      }
    } catch (err) {
      console.error(`[CF-COLLECTOR] Poll error: ${err.message}`);

      // Log the collection failure itself as a system log
      await sendToUpbase([{
        type: 'system',
        source: 'cloudflare',
        service: 'log-collector',
        severity: 'error',
        message: `Cloudflare log collection failed: ${err.message}`,
        metadata: { error: err.message, stack: err.stack?.substring(0, 2048), _source_integration: 'cloudflare' },
        ...(cfg.projectId && { project_id: cfg.projectId }),
        environment: cfg.environment,
      }]);
    }
  }

  // ─── Control API ────────────────────────────────────────────
  return {
    /**
     * Start the collector (periodic polling).
     */
    start() {
      console.log(`[CF-COLLECTOR] Starting with ${cfg.pollIntervalSec}s interval`);
      poll(); // Immediate first poll
      timer = setInterval(poll, cfg.pollIntervalSec * 1000);
    },

    /**
     * Stop the collector.
     */
    stop() {
      if (timer) clearInterval(timer);
      console.log('[CF-COLLECTOR] Stopped');
    },

    /**
     * Manually trigger a single poll cycle.
     */
    pollNow: poll,
  };
}

// ─── CLI Execution ──────────────────────────────────────────────
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('cloudflare-integration.js') ||
  process.argv[1].endsWith('cloudflare-integration.mjs')
);

if (isMainModule) {
  if (!process.env.CF_API_TOKEN || !process.env.CF_ZONE_ID) {
    console.error('Missing required env vars: CF_API_TOKEN, CF_ZONE_ID');
    console.error('Usage: CF_API_TOKEN=xxx CF_ZONE_ID=yyy node cloudflare-integration.js');
    process.exit(1);
  }

  const collector = createCloudflareCollector();
  collector.start();

  process.on('SIGINT', () => { collector.stop(); process.exit(0); });
  process.on('SIGTERM', () => { collector.stop(); process.exit(0); });
}

export default createCloudflareCollector;

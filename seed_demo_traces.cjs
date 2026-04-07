/**
 * seed_demo_traces.cjs — Ingest realistic failure scenarios
 */
const BASE = 'http://localhost:5000/api';
const KEY = 'upbase-log-dev-key-2026';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-log-api-key': KEY },
    body: JSON.stringify(body),
  });
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Using real ID for "NEWS APP"
const PROJECT_ID = '69d0042d2d18f1912eeacba2';

async function run() {
  console.log('\n🌱 Seeding demo traces for NEWS APP...\n');

  const now = Date.now();

  // ─── Scenario A: Mobile API Crash ───────────
  console.log('  📦 Scenario 1: Mobile API failure...');
  await post('/logs', [
    {
      type: 'frontend', source: 'ios-app', service: 'news-reader',
      severity: 'error', message: 'Failed to fetch breaking news feed: Network Error',
      trace_id: 'trace-news-api-001', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 120000).toISOString(),
      metadata: { os: 'iOS 17.1', appVersion: '2.4.0' },
    },
    {
      type: 'backend', source: 'render', service: 'feed-api',
      severity: 'critical', message: 'Redis connection lost — unable to serve cached feed',
      trace_id: 'trace-news-api-001', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 119500).toISOString(),
      metadata: { cacheStatus: 'DISCONNECTED', retryAttempt: 5 },
    }
  ]);

  // ─── Scenario B: Content Sync Failure ───────────
  console.log('  📦 Scenario 2: Sync failure...');
  await post('/logs', [
    {
      type: 'system', source: 'cron', service: 'content-scraper',
      severity: 'error', message: 'Reuters API rate limit exceeded (HTTP 429)',
      trace_id: 'trace-news-sync-002', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 60000).toISOString(),
      metadata: { source: 'Reuters', rateLimitReset: 3600 },
    }
  ]);

  await sleep(3000);
  console.log('\n  ✅ Done! 2 traces seeded for NEWS APP.');
}

run().catch(console.error);

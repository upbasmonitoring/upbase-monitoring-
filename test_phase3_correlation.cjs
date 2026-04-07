/**
 * test_phase3_correlation.cjs — Phase 3 Correlation Engine Tests
 * 
 * Simulates full failure flows and validates:
 *  1.  Ingest correlated logs (frontend→backend→system with shared trace_id)
 *  2.  Auto-correlation triggered on ingestion
 *  3.  GET /traces/:trace_id returns full timeline
 *  4.  Timeline is ordered by timestamp
 *  5.  Root cause = database (rule: db_timeout)
 *  6.  Impact level >= high
 *  7.  Multiple log types in trace
 *  8.  Manual re-correlation via POST /traces/:id/correlate
 *  9.  GET /traces/errors returns recent failures
 * 10.  GET /traces/root-cause-summary shows categories
 * 11.  Frontend-only crash → root cause = frontend
 * 12.  CDN 502 → root cause = cdn
 * 13.  Batch correlate processes multiple traces
 * 14.  Non-existent trace_id → 404
 * 15.  Timeline duration_ms is calculated
 * 
 * Run: node test_phase3_correlation.cjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.LOG_API_KEY || 'upbase-log-dev-key-2026';
const LOG_ENDPOINT = `${BASE_URL}/api/logs`;
const TRACE_ENDPOINT = `${BASE_URL}/api/traces`;

let passed = 0;
let failed = 0;

// Unique trace IDs for isolation
const TRACE_DB = `trace-db-fail-${Date.now()}`;
const TRACE_FE = `trace-fe-only-${Date.now()}`;
const TRACE_CDN = `trace-cdn-502-${Date.now()}`;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function postLogs(body) {
  const res = await fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-log-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function getTrace(traceId, query = '') {
  const res = await fetch(`${TRACE_ENDPOINT}/${traceId}${query ? '?' + query : ''}`, {
    headers: { 'x-log-api-key': API_KEY },
  });
  return { status: res.status, body: await res.json() };
}

async function postCorrelate(traceId) {
  const res = await fetch(`${TRACE_ENDPOINT}/${traceId}/correlate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-log-api-key': API_KEY },
  });
  return { status: res.status, body: await res.json() };
}

async function getErrors(query = '') {
  const res = await fetch(`${TRACE_ENDPOINT}/errors${query ? '?' + query : ''}`, {
    headers: { 'x-log-api-key': API_KEY },
  });
  return { status: res.status, body: await res.json() };
}

async function getRootCauseSummary(query = '') {
  const res = await fetch(`${TRACE_ENDPOINT}/root-cause-summary${query ? '?' + query : ''}`, {
    headers: { 'x-log-api-key': API_KEY },
  });
  return { status: res.status, body: await res.json() };
}

async function batchCorrelate(body = {}) {
  const res = await fetch(`${TRACE_ENDPOINT}/batch-correlate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-log-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Tests ──────────────────────────────────────────────────────
async function run() {
  console.log('\n🧪 Phase 3: Correlation & Debugging Engine Tests\n');
  console.log(`  Logs:   ${LOG_ENDPOINT}`);
  console.log(`  Traces: ${TRACE_ENDPOINT}\n`);

  // ─── SCENARIO 1: Full DB timeout failure flow ─────────────────
  const t0 = new Date();

  // 1. Ingest correlated logs (frontend → backend → system)
  await test('Ingest DB timeout failure flow (3 logs, 1 trace)', async () => {
    const t1 = new Date(t0.getTime());
    const t2 = new Date(t0.getTime() + 1000);
    const t3 = new Date(t0.getTime() + 1200);

    const { status, body } = await postLogs([
      {
        type: 'frontend', source: 'browser', service: 'checkout-app',
        severity: 'error', message: 'API request failed: POST /api/checkout',
        trace_id: TRACE_DB, timestamp: t1.toISOString(),
        project_id: 'proj-test', environment: 'production',
        metadata: { url: '/api/checkout', status: 500 },
      },
      {
        type: 'backend', source: 'render', service: 'checkout-api',
        severity: 'error', message: 'Database timeout during checkout query',
        trace_id: TRACE_DB, timestamp: t2.toISOString(),
        project_id: 'proj-test', environment: 'production',
        metadata: { query: 'orders.insertOne()', durationMs: 30000 },
      },
      {
        type: 'system', source: 'mongodb-atlas', service: 'database',
        severity: 'critical', message: 'Database connection pool exhausted — max connections reached',
        trace_id: TRACE_DB, timestamp: t3.toISOString(),
        project_id: 'proj-test', environment: 'production',
        metadata: { connections: 500, maxConnections: 500 },
      },
    ]);
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.accepted === 3, `Expected 3 accepted`);
  });

  // Wait for auto-correlation
  await sleep(1500);

  // 2. Verify auto-correlation
  await test('Auto-correlation triggered on ingestion', async () => {
    const { status, body } = await getTrace(TRACE_DB);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.trace_id === TRACE_DB, 'trace_id should match');
  });

  // 3. Verify full timeline
  await test('GET /traces/:id returns full timeline', async () => {
    const { status, body } = await getTrace(TRACE_DB);
    assert(body.data.timeline.length === 3, `Expected 3 timeline entries, got ${body.data.timeline.length}`);
  });

  // 4. Timeline ordering
  await test('Timeline is ordered by timestamp', async () => {
    const { body } = await getTrace(TRACE_DB);
    const times = body.data.timeline.map(e => new Date(e.timestamp).getTime());
    for (let i = 1; i < times.length; i++) {
      assert(times[i] >= times[i - 1], `Timeline not ordered at index ${i}`);
    }
  });

  // 5. Root cause = database
  await test('Root cause detected: database', async () => {
    const { body } = await getTrace(TRACE_DB);
    const cat = body.data.root_cause.category;
    assert(cat === 'database', `Expected root_cause=database, got ${cat}`);
  });

  // 6. Impact level
  await test('Impact level >= high', async () => {
    const { body } = await getTrace(TRACE_DB);
    const impact = body.data.impact_level;
    assert(['high', 'critical'].includes(impact), `Expected high/critical, got ${impact}`);
  });

  // 7. Multiple types involved
  await test('Types involved includes all three', async () => {
    const { body } = await getTrace(TRACE_DB);
    const types = body.data.types_involved;
    assert(types.includes('frontend'), 'Missing frontend');
    assert(types.includes('backend'), 'Missing backend');
    assert(types.includes('system'), 'Missing system');
  });

  // 8. Manual re-correlation
  await test('POST /traces/:id/correlate re-processes trace', async () => {
    const { status, body } = await postCorrelate(TRACE_DB);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.trace_id === TRACE_DB, 'trace_id should match');
    assert(body.data.log_count === 3, 'Should still have 3 logs');
  });

  // ─── SCENARIO 2: Frontend-only crash ──────────────────────────
  await test('Ingest frontend-only crash (no backend errors)', async () => {
    const { status } = await postLogs([
      {
        type: 'frontend', source: 'browser', service: 'dashboard',
        severity: 'error', message: 'Uncaught TypeError: Cannot read property map of null',
        trace_id: TRACE_FE,
        metadata: { stack: 'TypeError at Dashboard.render (app.js:42)' },
      },
      {
        type: 'frontend', source: 'browser', service: 'dashboard',
        severity: 'warning', message: 'Component state corrupted',
        trace_id: TRACE_FE,
      },
    ]);
    assert(status === 201, `Expected 201, got ${status}`);
  });

  await sleep(1500);

  // 11. Frontend-only → root cause = frontend
  await test('Frontend-only crash → root cause = frontend', async () => {
    const { body } = await getTrace(TRACE_FE);
    const cat = body.data.root_cause.category;
    assert(cat === 'frontend', `Expected root_cause=frontend, got ${cat}`);
  });

  // ─── SCENARIO 3: CDN 502 ─────────────────────────────────────
  await test('Ingest CDN 502 failure', async () => {
    const { status } = await postLogs({
      type: 'system', source: 'cloudflare', service: 'api.example.com',
      severity: 'error', message: 'HTTP 502 Bad Gateway on /api/users',
      trace_id: TRACE_CDN,
      metadata: { statusCode: 502, colo: 'SJC' },
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  await sleep(1500);

  // 12. CDN 502 → root cause = cdn
  await test('CDN 502 → root cause = cdn', async () => {
    const { body } = await getTrace(TRACE_CDN);
    assert(body.data.root_cause.category === 'cdn', `Expected cdn, got ${body.data.root_cause.category}`);
  });

  // 9. Recent errors
  await test('GET /traces/errors returns recent failures', async () => {
    const { status, body } = await getErrors('limit=10');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.length > 0, 'Should have at least one error trace');
    assert(body.data[0].root_cause, 'Error trace should have root_cause');
  });

  // 10. Root cause summary
  await test('GET /traces/root-cause-summary shows categories', async () => {
    const { status, body } = await getRootCauseSummary();
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.total_traces > 0, 'Should have total_traces > 0');
    assert(body.data.by_category.length > 0, 'Should have at least one category');
  });

  // 13. Batch correlate
  await test('POST /traces/batch-correlate processes traces', async () => {
    const { status, body } = await batchCorrelate({ limit: 10 });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.processed >= 0, 'Should return processed count');
  });

  // 14. Non-existent trace → 404
  await test('Non-existent trace_id → 404', async () => {
    const { status } = await getTrace('trace-does-not-exist-xyz');
    assert(status === 404, `Expected 404, got ${status}`);
  });

  // 15. Duration is calculated
  await test('Timeline duration_ms is calculated', async () => {
    const { body } = await getTrace(TRACE_DB);
    assert(body.data.duration_ms >= 0, `Expected duration_ms >= 0, got ${body.data.duration_ms}`);
    // DB trace has ~1200ms between first and last log
    assert(body.data.duration_ms >= 1000, `Expected >= 1000ms, got ${body.data.duration_ms}`);
  });

  // Results
  console.log(`\n  ────────────────────────────────────────`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`  ────────────────────────────────────────\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});

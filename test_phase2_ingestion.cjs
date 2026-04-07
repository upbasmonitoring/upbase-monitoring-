/**
 * test_phase2_ingestion.cjs — Phase 2 Integration Tests
 * 
 * Tests the enhanced log ingestion pipeline including:
 *  1.  Frontend SDK log with project_id + environment
 *  2.  Backend SDK log with auto-enrichment
 *  3.  System log (Cloudflare style) with region
 *  4.  Batch with mixed enrichment fields
 *  5.  Invalid environment value → silently normalized to null
 *  6.  Query by project_id filter
 *  7.  Query by environment filter
 *  8.  Stats scoped to project_id
 *  9.  Simulated frontend crash log
 * 10.  Simulated backend error log
 * 11.  Simulated Cloudflare 502 system log
 * 12.  Simulated Render deploy failure
 * 13.  Trace correlation across types
 * 14.  Multiple project isolation
 * 15.  sendBeacon auth via _logkey query param
 * 
 * Run: node test_phase2_ingestion.cjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.LOG_API_KEY || 'upbase-log-dev-key-2026';
const ENDPOINT = `${BASE_URL}/api/logs`;

let passed = 0;
let failed = 0;
const PROJECT_A = 'test-project-alpha';
const PROJECT_B = 'test-project-beta';
const TRACE_ID = 'trace-phase2-' + Date.now();

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

async function post(body, headers = {}, queryParams = '') {
  const url = `${ENDPOINT}${queryParams ? '?' + queryParams : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-log-api-key': API_KEY, ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function get(path = '', query = '') {
  const url = `${ENDPOINT}${path}${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: { 'x-log-api-key': API_KEY } });
  return { status: res.status, body: await res.json() };
}

// ─── Tests ──────────────────────────────────────────────────────
async function run() {
  console.log('\n🧪 Phase 2: Enhanced Log Ingestion Tests\n');
  console.log(`  Target: ${ENDPOINT}\n`);

  // 1. Frontend log with project_id + environment
  await test('Frontend log with project_id + environment', async () => {
    const { status, body } = await post({
      type: 'frontend',
      source: 'browser',
      service: 'frontend-app',
      severity: 'info',
      message: 'Dashboard loaded with enrichment',
      metadata: { page: '/dashboard', loadTime: 1200 },
      project_id: PROJECT_A,
      environment: 'production',
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.accepted === 1, 'Expected 1 accepted');
  });

  // 2. Backend log with auto-enrichment
  await test('Backend log with environment + region', async () => {
    const { status, body } = await post({
      type: 'backend',
      source: 'render',
      service: 'auth-api',
      severity: 'error',
      message: 'Database connection pool exhausted',
      metadata: { pool: 'primary', connections: 100, maxConnections: 100 },
      project_id: PROJECT_A,
      environment: 'production',
      region: 'us-east-1',
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  // 3. System log (Cloudflare style) with region
  await test('System log (Cloudflare) with region', async () => {
    const { status, body } = await post({
      type: 'system',
      source: 'cloudflare',
      service: 'edge',
      severity: 'warning',
      message: 'HTTP 502 on /api/users (3 occurrences)',
      metadata: { statusCode: 502, colo: 'LAX', occurrences: 3, _source_integration: 'cloudflare' },
      project_id: PROJECT_A,
      environment: 'production',
      region: 'LAX',
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  // 4. Batch with mixed enrichment
  await test('Batch with mixed enrichment fields', async () => {
    const { status, body } = await post([
      {
        type: 'frontend', source: 'browser', severity: 'error',
        message: 'WebSocket disconnected', project_id: PROJECT_A, environment: 'staging',
      },
      {
        type: 'backend', source: 'node-process', severity: 'info',
        message: 'Cache refreshed', project_id: PROJECT_B, environment: 'development',
      },
      {
        type: 'system', source: 'nginx', severity: 'critical',
        message: 'OOM killer triggered', project_id: PROJECT_A, region: 'eu-west-1',
      },
    ]);
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.accepted === 3, `Expected 3 accepted, got ${body.accepted}`);
  });

  // 5. Invalid environment → normalized to null (accepted, not rejected)
  await test('Invalid environment silently normalized', async () => {
    const { status, body } = await post({
      type: 'backend', source: 'node-process', severity: 'info',
      message: 'Log with invalid environment',
      environment: 'banana',
      project_id: PROJECT_A,
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.accepted === 1, 'Invalid env should be accepted with null normalization');
  });

  // 6. Query by project_id
  await test('Query filter: project_id', async () => {
    const { status, body } = await get('', `project_id=${PROJECT_A}&limit=10`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.length > 0, 'Should return logs for project A');
    assert(body.data.every(l => l.project_id === PROJECT_A), 'All logs should be project A');
  });

  // 7. Query by environment
  await test('Query filter: environment', async () => {
    const { status, body } = await get('', `environment=production&limit=10`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.length > 0, 'Should return production logs');
    assert(body.data.every(l => l.environment === 'production'), 'All logs should be production');
  });

  // 8. Stats scoped to project_id
  await test('Stats scoped by project_id', async () => {
    const { status, body } = await get('/stats', `project_id=${PROJECT_A}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.total > 0, `Expected total > 0 for project A`);
  });

  // 9. Simulated frontend crash
  await test('Simulated: frontend crash', async () => {
    const { status, body } = await post({
      type: 'frontend',
      source: 'browser',
      service: 'checkout-widget',
      severity: 'critical',
      message: 'Uncaught TypeError: Cannot read properties of null (reading \'map\')',
      metadata: {
        errorMessage: "Cannot read properties of null (reading 'map')",
        filename: 'https://cdn.example.com/app.js',
        lineno: 1423,
        colno: 56,
        stack: 'TypeError: Cannot read properties of null\n    at ProductList.render (app.js:1423:56)\n    at e.updateComponent (react-dom.js:12)',
        url: 'https://shop.example.com/products',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        _auto: true,
      },
      project_id: PROJECT_A,
      environment: 'production',
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  // 10. Simulated backend error
  await test('Simulated: backend error', async () => {
    const { status, body } = await post({
      type: 'backend',
      source: 'render',
      service: 'payment-api',
      severity: 'error',
      message: 'Stripe webhook signature verification failed',
      metadata: {
        webhookId: 'evt_1234567890',
        expectedSignature: 'v1=abc...',
        receivedSignature: 'v1=xyz...',
        endpoint: 'POST /webhooks/stripe',
        pid: 12345,
        hostname: 'srv-abc123',
        _auto: false,
      },
      project_id: PROJECT_A,
      environment: 'production',
      region: 'us-east-1',
      trace_id: TRACE_ID,
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  // 11. Simulated Cloudflare 502
  await test('Simulated: Cloudflare 502 system log', async () => {
    const { status, body } = await post({
      type: 'system',
      source: 'cloudflare',
      service: 'api.example.com',
      severity: 'error',
      message: 'HTTP 502 on /api/checkout (12 occurrences)',
      metadata: {
        statusCode: 502,
        host: 'api.example.com',
        path: '/api/checkout',
        country: 'United States',
        colo: 'SJC',
        occurrences: 12,
        _source_integration: 'cloudflare',
      },
      project_id: PROJECT_A,
      environment: 'production',
      region: 'SJC',
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  // 12. Simulated Render deploy failure
  await test('Simulated: Render deploy failure', async () => {
    const { status, body } = await post({
      type: 'backend',
      source: 'render',
      service: 'payment-api',
      severity: 'error',
      message: 'Deploy abc12345: build_failed on payment-api',
      metadata: {
        deployId: 'dep-abc12345',
        status: 'build_failed',
        commitId: 'f7e2a3b1',
        commitMessage: 'fix: update stripe sdk',
        branch: 'main',
        buildDurationSec: 145,
        _source_integration: 'render',
      },
      project_id: PROJECT_A,
      environment: 'production',
      region: 'oregon',
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  // 13. Trace correlation across types
  await test('Trace correlation: query by trace_id', async () => {
    // Add a frontend log with same trace_id
    await post({
      type: 'frontend',
      source: 'browser',
      severity: 'error',
      message: 'Payment form error',
      trace_id: TRACE_ID,
      project_id: PROJECT_A,
    });

    const { status, body } = await get('', `trace_id=${TRACE_ID}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.length >= 2, `Expected at least 2 correlated logs, got ${body.data.length}`);
    // Should have both frontend and backend with same trace_id
    const types = [...new Set(body.data.map(l => l.type))];
    assert(types.length >= 2, `Expected multiple types in trace, got: ${types.join(', ')}`);
  });

  // 14. Multiple project isolation
  await test('Project isolation: project B has separate data', async () => {
    const { status, body } = await get('', `project_id=${PROJECT_B}&limit=10`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.every(l => l.project_id === PROJECT_B), 'Should only get project B logs');
    // Ensure project A logs don't leak
    assert(!body.data.some(l => l.project_id === PROJECT_A), 'No project A logs should appear');
  });

  // 15. sendBeacon auth via query param
  await test('Auth via _logkey query param (sendBeacon fallback)', async () => {
    // Use raw fetch to genuinely omit the x-log-api-key header
    const url = `${ENDPOINT}?_logkey=${API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // No x-log-api-key here
      body: JSON.stringify({
        type: 'frontend', source: 'browser', severity: 'info',
        message: 'Beacon log via query param',
      }),
    });
    const body = await res.json();
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(body)}`);
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

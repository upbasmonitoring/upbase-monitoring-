/**
 * test_log_ingestion.cjs — Validates the log ingestion pipeline
 * 
 * Run: node test_log_ingestion.cjs
 * 
 * Tests:
 *  1. Single valid log (frontend)
 *  2. Single valid log (backend)
 *  3. Single valid log (system)
 *  4. Batch ingestion
 *  5. Missing type → rejected
 *  6. Invalid type → rejected
 *  7. Missing required fields → rejected
 *  8. No API key → 401
 *  9. Invalid API key → 403
 * 10. Query logs by type
 * 11. Get stats
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.LOG_API_KEY || 'upbase-log-dev-key-2026';
const ENDPOINT = `${BASE_URL}/api/logs`;

let passed = 0;
let failed = 0;

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

async function post(body, headers = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-log-api-key': API_KEY, ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function get(path = '', query = '') {
  const url = `${ENDPOINT}${path}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    headers: { 'x-log-api-key': API_KEY },
  });
  return { status: res.status, body: await res.json() };
}

// ─── Tests ──────────────────────────────────────────────────────

async function run() {
  console.log('\n🧪 Log Ingestion Pipeline Tests\n');
  console.log(`  Target: ${ENDPOINT}\n`);

  // 1. Frontend log
  await test('POST single frontend log', async () => {
    const { status, body } = await post({
      type: 'frontend',
      source: 'browser',
      service: 'frontend-app',
      severity: 'info',
      message: 'Test frontend log',
      metadata: { page: '/dashboard' },
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.success === true, 'Expected success=true');
    assert(body.accepted === 1, 'Expected 1 accepted');
  });

  // 2. Backend log
  await test('POST single backend log', async () => {
    const { status, body } = await post({
      type: 'backend',
      source: 'node-process',
      service: 'auth-api',
      severity: 'error',
      message: 'Database timeout',
      metadata: { query: 'SELECT * FROM users', duration: 30000 },
      trace_id: 'test-trace-001',
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.accepted === 1, 'Expected 1 accepted');
  });

  // 3. System log
  await test('POST single system log', async () => {
    const { status, body } = await post({
      type: 'system',
      source: 'cloudflare',
      severity: 'warning',
      message: 'High latency on edge POP-LAX',
      metadata: { p99_ms: 450, region: 'us-west' },
    });
    assert(status === 201, `Expected 201, got ${status}`);
  });

  // 4. Batch ingestion
  await test('POST batch of 3 logs', async () => {
    const { status, body } = await post([
      { type: 'frontend', source: 'browser', severity: 'info', message: 'Batch log 1' },
      { type: 'backend', source: 'render', severity: 'error', message: 'Batch log 2' },
      { type: 'system', source: 'nginx', severity: 'critical', message: 'Batch log 3' },
    ]);
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.accepted === 3, `Expected 3 accepted, got ${body.accepted}`);
  });

  // 5. Missing type → rejected
  await test('REJECT log with missing type', async () => {
    const { status, body } = await post({
      source: 'browser',
      severity: 'info',
      message: 'No type provided',
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(body.rejected === 1, 'Expected 1 rejected');
  });

  // 6. Invalid type → rejected
  await test('REJECT log with invalid type', async () => {
    const { status, body } = await post({
      type: 'database',
      source: 'mysql',
      severity: 'info',
      message: 'Invalid type',
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // 7. Missing required fields
  await test('REJECT log with missing severity & message', async () => {
    const { status, body } = await post({ type: 'frontend', source: 'browser' });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(body.errors[0].errors.length >= 2, 'Expected at least 2 errors');
  });

  // 8. No API key → 401
  await test('REJECT request without API key (401)', async () => {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'frontend', source: 'browser', severity: 'info', message: 'test' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 9. Invalid API key → 403
  await test('REJECT request with wrong API key (403)', async () => {
    const { status } = await post(
      { type: 'frontend', source: 'browser', severity: 'info', message: 'test' },
      { 'x-log-api-key': 'wrong-key-12345' },
    );
    assert(status === 403, `Expected 403, got ${status}`);
  });

  // 10. Query by type
  await test('GET /logs?type=frontend returns only frontend logs', async () => {
    const { status, body } = await get('', 'type=frontend&limit=5');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.every((l) => l.type === 'frontend'), 'All logs should be type=frontend');
  });

  // 11. Stats
  await test('GET /logs/stats returns counts', async () => {
    const { status, body } = await get('/stats');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.total > 0, `Expected total > 0, got ${body.total}`);
    assert(body.by_type.frontend >= 1, 'Expected at least 1 frontend log in stats');
  });

  // Results
  console.log(`\n  ────────────────────────────────`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`  ────────────────────────────────\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});

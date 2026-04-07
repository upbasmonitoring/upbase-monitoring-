/**
 * test_phase4_ai_analysis.cjs — Phase 4 AI Analysis & Action Engine Tests
 * 
 * Tests:
 *  1.  Ingest a DB failure trace for analysis
 *  2.  POST /analyze returns AI explanation
 *  3.  Analysis includes root_cause from rule engine
 *  4.  Analysis includes suggested_fixes (rule-based at minimum)
 *  5.  Analysis includes timeline data
 *  6.  AI explanation is non-empty (if Gemini available)
 *  7.  POST /analyze/patterns returns pattern analysis
 *  8.  POST /action creates a pending action
 *  9.  GET /action/history shows the pending action
 * 10.  POST /action/:id/confirm with confirmed=false → cancelled
 * 11.  POST /action creates another action
 * 12.  POST /action/:id/confirm with confirmed=true → completed
 * 13.  POST /action/:id/feedback records feedback
 * 14.  POST /analyze with non-existent trace → 404
 * 15.  POST /action with invalid action_id → 400
 * 16.  Re-confirm completed action → rejected
 * 
 * Run: node test_phase4_ai_analysis.cjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.LOG_API_KEY || 'upbase-log-dev-key-2026';
const LOG_ENDPOINT = `${BASE_URL}/api/logs`;
const API = `${BASE_URL}/api`;

let passed = 0;
let failed = 0;

const TRACE_ID = `trace-ai-test-${Date.now()}`;
let pendingActionId = null;
let secondActionId = null;

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

async function postJSON(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-log-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function getJSON(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'x-log-api-key': API_KEY },
  });
  return { status: res.status, body: await res.json() };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('\n🧪 Phase 4: AI Analysis & Action Engine Tests\n');
  console.log(`  API: ${API}\n`);

  // ─── 1. Ingest a DB failure trace ─────────────────────────────
  await test('1. Ingest DB failure trace (3 correlated logs)', async () => {
    const t0 = Date.now();
    const { status, body } = await postJSON('/logs', [
      {
        type: 'frontend', source: 'browser', service: 'checkout-app',
        severity: 'error', message: 'API request failed: POST /api/checkout returned 500',
        trace_id: TRACE_ID, project_id: 'proj-ai-test', environment: 'production',
        timestamp: new Date(t0).toISOString(),
        metadata: { url: '/api/checkout', status: 500, userAgent: 'Mozilla/5.0' },
      },
      {
        type: 'backend', source: 'render', service: 'checkout-api',
        severity: 'error', message: 'Database timeout during checkout — query took 30000ms',
        trace_id: TRACE_ID, project_id: 'proj-ai-test', environment: 'production',
        timestamp: new Date(t0 + 1000).toISOString(),
        metadata: { query: 'orders.insertOne()', durationMs: 30000, dbHost: 'mongo-primary' },
      },
      {
        type: 'system', source: 'mongodb-atlas', service: 'database',
        severity: 'critical', message: 'Connection pool exhausted — 500/500 connections active',
        trace_id: TRACE_ID, project_id: 'proj-ai-test', environment: 'production',
        timestamp: new Date(t0 + 1200).toISOString(),
        metadata: { connections: 500, maxConnections: 500, replicaSet: 'rs0' },
      },
    ]);
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.accepted === 3, `Expected 3 accepted, got ${body.accepted}`);
  });

  // Wait for auto-correlation
  await sleep(2000);

  // ─── 2. POST /analyze ─────────────────────────────────────────
  await test('2. POST /analyze returns analysis result', async () => {
    const { status, body } = await postJSON('/obs/analyze', { trace_id: TRACE_ID });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Expected success=true');
    assert(body.data.trace_id === TRACE_ID, 'trace_id should match');
  });

  // ─── 3. Root cause from rule engine ───────────────────────────
  await test('3. Analysis includes rule-based root_cause', async () => {
    const { body } = await postJSON('/obs/analyze', { trace_id: TRACE_ID });
    assert(body.data.root_cause, 'Should have root_cause');
    assert(body.data.root_cause.category === 'database', `Expected database, got ${body.data.root_cause.category}`);
    assert(body.data.root_cause.matched_rule, 'Should have matched_rule');
  });

  // ─── 4. Suggested fixes ───────────────────────────────────────
  await test('4. Analysis includes suggested_fixes', async () => {
    const { body } = await postJSON('/obs/analyze', { trace_id: TRACE_ID });
    assert(Array.isArray(body.data.suggested_fixes), 'suggested_fixes should be array');
    assert(body.data.suggested_fixes.length >= 2, `Expected >= 2 fixes, got ${body.data.suggested_fixes.length}`);
    // Each fix should have required fields
    const fix = body.data.suggested_fixes[0];
    assert(fix.action, 'Fix should have action');
    assert(fix.description, 'Fix should have description');
    assert(fix.risk, 'Fix should have risk');
  });

  // ─── 5. Timeline in response ──────────────────────────────────
  await test('5. Analysis includes timeline data', async () => {
    const { body } = await postJSON('/obs/analyze', { trace_id: TRACE_ID });
    assert(Array.isArray(body.data.timeline), 'Should have timeline array');
    assert(body.data.timeline.length === 3, `Expected 3 timeline entries, got ${body.data.timeline.length}`);
  });

  // ─── 6. AI explanation ────────────────────────────────────────
  await test('6. AI analysis available (Gemini)', async () => {
    const { body } = await postJSON('/obs/analyze', { trace_id: TRACE_ID });
    if (body.data.ai_available) {
      assert(body.data.ai_analysis.explanation, 'AI explanation should not be empty');
      assert(body.data.ai_analysis.explanation.length > 10, 'AI explanation too short');
      console.log(`     📝 AI says: "${body.data.ai_analysis.explanation.substring(0, 120)}..."`);
    } else {
      console.log('     ⚠️  AI unavailable — rule-based analysis only (still valid)');
    }
    // Test passes either way — rule-based is always present
  });

  // ─── 7. Pattern analysis ──────────────────────────────────────
  await test('7. POST /analyze/patterns returns analysis', async () => {
    const { status, body } = await postJSON('/obs/analyze/patterns', { limit: 10 });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Expected success=true');
    assert(body.data, 'Should have data');
  });

  // ─── 8. Create pending action ─────────────────────────────────
  await test('8. POST /action creates pending action', async () => {
    const { status, body } = await postJSON('/obs/action', {
      action_id: 'db_restart',
      trace_id: TRACE_ID,
      project_id: 'proj-ai-test',
      environment: 'production',
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(body.data.status === 'pending', `Expected pending, got ${body.data.status}`);
    assert(body.data.requires_confirmation === true, 'Should require confirmation');
    pendingActionId = body.data.id;
    assert(pendingActionId, 'Should return action ID');
  });

  // ─── 9. Action history ────────────────────────────────────────
  await test('9. GET /action/history shows pending action', async () => {
    const { status, body } = await getJSON(`/obs/action/history?trace_id=${TRACE_ID}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.length >= 1, 'Should have at least 1 action');
    assert(body.data.some(a => a.status === 'pending'), 'Should include pending action');
  });

  // ─── 10. Cancel action ────────────────────────────────────────
  await test('10. POST /action/:id/confirm with confirmed=false → cancelled', async () => {
    const { status, body } = await postJSON(`/obs/action/${pendingActionId}/confirm`, { confirmed: false });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.status === 'cancelled', `Expected cancelled, got ${body.data.status}`);
  });

  // ─── 11. Create another action ────────────────────────────────
  await test('11. Create another action for execution', async () => {
    const { status, body } = await postJSON('/obs/action', {
      action_id: 'cdn_purge_cache',
      trace_id: TRACE_ID,
      project_id: 'proj-ai-test',
    });
    assert(status === 201, `Expected 201, got ${status}`);
    secondActionId = body.data.id;
  });

  // ─── 12. Confirm and execute ──────────────────────────────────
  await test('12. POST /action/:id/confirm with confirmed=true → completed', async () => {
    const { status, body } = await postJSON(`/obs/action/${secondActionId}/confirm`, { confirmed: true });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.data.status === 'completed', `Expected completed, got ${body.data.status}`);
    assert(body.data.result.success === true, 'Result should be success');
    assert(body.data.duration_ms >= 0, 'Should have duration');
  });

  // ─── 13. Record feedback ──────────────────────────────────────
  await test('13. POST /action/:id/feedback records feedback', async () => {
    const { status, body } = await postJSON(`/obs/action/${secondActionId}/feedback`, {
      helpful: true,
      comment: 'Cache purge fixed the issue!',
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.success === true, 'Should succeed');
  });

  // ─── 14. Analyze non-existent trace ───────────────────────────
  await test('14. POST /analyze with non-existent trace → 404', async () => {
    const { status } = await postJSON('/obs/analyze', { trace_id: 'trace-does-not-exist-xyz' });
    assert(status === 404, `Expected 404, got ${status}`);
  });

  // ─── 15. Invalid action_id ────────────────────────────────────
  await test('15. POST /action with invalid action_id → 400', async () => {
    const { status, body } = await postJSON('/obs/action', {
      action_id: 'completely_fake_action',
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(body.error.includes('Unknown action'), 'Should mention unknown action');
  });

  // ─── 16. Re-confirm completed action ──────────────────────────
  await test('16. Re-confirm completed action → rejected', async () => {
    const { status, body } = await postJSON(`/obs/action/${secondActionId}/confirm`, { confirmed: true });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(body.error.includes('already'), 'Should say already executed');
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

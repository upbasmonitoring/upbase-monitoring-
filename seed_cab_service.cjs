/**
 * seed_cab_service.cjs
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

const PROJECT_ID = '69c05f265bcad42f6c04b2de'; // CAB SERVICE

async function run() {
  console.log('\n🌱 Seeding demo traces for CAB SERVICE...\n');
  const now = Date.now();

  console.log('  📦 Scenario 1: Database failure...');
  await post('/logs', [
    {
      type: 'frontend', source: 'browser', service: 'checkout-app',
      severity: 'error', message: 'API request failed: POST /api/checkout returned HTTP 500',
      trace_id: 'trace-db-checkout-cab-001', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 300000).toISOString(),
      metadata: { is_demo: true, url: '/api/checkout', statusCode: 500, userAgent: 'Chrome/125.0', page: '/checkout' },
    },
    {
      type: 'backend', source: 'render', service: 'checkout-api',
      severity: 'error', message: 'Database timeout — query exceeded 30s limit on orders.insertOne()',
      trace_id: 'trace-db-checkout-cab-001', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 299000).toISOString(),
      metadata: { is_demo: true, query: 'orders.insertOne()', durationMs: 30000, collection: 'orders' },
    },
    {
      type: 'system', source: 'mongodb-atlas', service: 'database',
      severity: 'critical', message: 'Connection pool exhausted — 500/500 connections active, new requests queuing',
      trace_id: 'trace-db-checkout-cab-001', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 298500).toISOString(),
      metadata: { is_demo: true, activeConnections: 500, maxConnections: 500, waitQueueSize: 47 },
    },
  ]);

  console.log('  📦 Scenario 2: Frontend crash...');
  await post('/logs', [
    {
      type: 'frontend', source: 'browser', service: 'dashboard-app',
      severity: 'error', message: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')",
      trace_id: 'trace-fe-crash-cab-003', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 120000).toISOString(),
      metadata: { is_demo: true, stack: 'TypeError at UserList.render', component: 'UserList', url: '/dashboard/users' },
    },
    {
      type: 'frontend', source: 'browser', service: 'dashboard-app',
      severity: 'warning', message: 'React Error Boundary caught crash in UserList — showing fallback UI',
      trace_id: 'trace-fe-crash-cab-003', project_id: PROJECT_ID, environment: 'production',
      timestamp: new Date(now - 119800).toISOString(),
      metadata: { is_demo: true, component: 'UserList', fallback: 'ErrorFallback' },
    },
  ]);

  await sleep(3000);
  console.log('\n  ✅ Done! Traces seeded for CAB SERVICE.');
}

run().catch(console.error);

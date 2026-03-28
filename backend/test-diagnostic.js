import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import { runSingleMonitorCheck } from './monitorService.js';

dotenv.config();

async function testDiagnostic() {
  try {
    console.log('--- DIAGNOSTIC SYSTEM TEST ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Connected');

    const googleMonitor = await Monitor.findOne({ name: /google/i });
    if (!googleMonitor) {
      console.error('[ERROR] No monitor named "Google" found in DB. Please create one on the dashboard first.');
      process.exit(1);
    }

    console.log(`[TEST] Running deep scan for: ${googleMonitor.name} (${googleMonitor.url})`);
    console.log('[AI] Requesting performance audit from Gemini 1.5 Flash...');

    const result = await runSingleMonitorCheck(googleMonitor._id);

    console.log('\n--- RESULTS ---');
    console.log('Status:', result.status);
    console.log('Latency:', result.responseTime + 'ms');
    
    console.log('\n--- AI ANALYSIS ---');
    console.log('Root Cause:', result.aiAnalysis.rootCause);
    console.log('Remediation:', result.aiAnalysis.remediation);
    console.log('Action:', result.aiAnalysis.suggestedAction);
    console.log('AI Model:', result.aiAnalysis._aiStatus);

    console.log('\n--- RAW TELEMETRY ---');
    console.log('Server:', result.raw.headers.server || 'Unknown');
    console.log('Content-Type:', result.raw.headers['content-type']);
    console.log('Body Snippet:', result.raw.bodySnippet.substring(0, 100) + '...');

    console.log('\n[SUCCESS] Diagnostic system is operational.');
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL ERROR]', err);
    process.exit(1);
  }
}

testDiagnostic();

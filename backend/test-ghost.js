import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import { runSingleMonitorCheck } from './monitorService.js';

dotenv.config();

async function testGhost() {
  try {
    console.log('--- GHOST ENGINE V2 TEST ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Connected');

    const ghostMonitor = await Monitor.findOne({ monitorType: 'synthetic' });
    if (!ghostMonitor) {
      console.error('[ERROR] No synthetic monitor found. Please create one named "Google Search Bot" first.');
      process.exit(1);
    }

    console.log(`[TEST] Triggering Ghost Flow: ${ghostMonitor.name}`);
    console.log(`[INFRA] Launching Puppeteer... (This may take 10-20 seconds)`);

    const result = await runSingleMonitorCheck(ghostMonitor._id);

    console.log('\n--- FLOW SUMMARY ---');
    console.log('Status:', result.status);
    console.log('Message:', result.message);
    console.log('Total Duration:', result.responseTime + 'ms');

    console.log('\n--- STEP BREAKDOWN ---');
    if (result.stepResults) {
        result.stepResults.forEach((step, i) => {
            console.log(`[STEP ${i+1}] ${step.action.toUpperCase()}: ${step.status} (${step.duration}ms)`);
            if (step.error) console.log(`  -> Error: ${step.error}`);
        });
    } else {
        console.log('[WARN] No stepResults found in response object.');
    }

    console.log('\n[SUCCESS] Ghost Engine verify complete.');
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL ERROR]', err);
    process.exit(1);
  }
}

testGhost();

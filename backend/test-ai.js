import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import { runQueryFlow } from './mcp/services/aiFlow.js';

dotenv.config();

const testDiagnostics = async () => {
    try {
        console.log('[TEST] Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        const monitor = await Monitor.findOne({ isActive: true });
        if (!monitor) {
            console.error('[TEST] No active monitors found for testing.');
            process.exit(1);
        }

        console.log(`[TEST] Probing ${monitor.name} (${monitor._id})...`);
        
        const result = await runQueryFlow({
            query: "Give me the absolute latest health report",
            monitorId: monitor._id,
            requestId: "TEST-FIDELITY-001"
        });

        console.log('\n--- DIAGNOSTIC RESULT ---');
        console.log(`Summary: ${result.summary}`);
        console.log(`Severity: ${result.severity}`);
        console.log(`Instant Latency: ${result.latency.latest || result.latency.p95}ms`);
        console.log(`Error Count: ${result.errors.length}`);
        console.log('--- TEST SUCCESSFUL ---');
        
        process.exit(0);
    } catch (err) {
        console.error('\n--- TEST FAILED ---');
        console.error(`Error Logic Crash: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }
};

testDiagnostics();

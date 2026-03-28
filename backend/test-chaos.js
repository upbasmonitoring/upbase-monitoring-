import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import { getOrCreateActiveIncident, addIncidentEvent, resolveIncident } from './services/incidentService.js';

dotenv.config();

/**
 * 🛰️ CHAOS SIMULATOR: Proof of Value
 * This script dry-runs the high-fidelity timeline logic.
 */

async function runChaosTest() {
    try {
        console.log('🚀 INITIALIZING CHAOS SIMULATOR...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[DB] Connected to Matrix');

        const monitor = await Monitor.findOne({});
        if (!monitor) {
            console.error('[ERROR] No monitor found in DB. Go to dashboard and add a website first.');
            process.exit(1);
        }

        console.log(`\n🚨 SIMULATING INCIDENT FOR: ${monitor.name}`);
        
        // 1. OPEN INCIDENT (Fail threshold 3 reached)
        console.log('[STEP 1] Opening active incident...');
        const incident = await getOrCreateActiveIncident(monitor._id, monitor.user);

        // 2. ADD EVENTS
        console.log('[STEP 2] Logging system actions...');
        await addIncidentEvent(monitor._id, 'ALERT_SENT', 'Discord Tier 1 notification dispatched.');
        await new Promise(r => setTimeout(r, 1000));
        
        await addIncidentEvent(monitor._id, 'SELF_HEALING_TRIGGERED', 'Autopilot engaged: Strategy ROLLBACK.');
        await new Promise(r => setTimeout(r, 1000));

        await addIncidentEvent(monitor._id, 'ROLLBACK_STARTED', 'Reverting to commit: a7b1c3d (Last Stable).');
        await new Promise(r => setTimeout(r, 1000));

        // 3. RESOLVE & RCA
        console.log('[STEP 3] Resolving incident & triggering Gemini RCA...');
        const result = await resolveIncident(monitor._id);

        console.log('\n✅ SIMULATION COMPLETE.');
        console.log('-----------------------------------------');
        console.log('POST-MORTEM (AI RCA):');
        console.log(`"${result.aiRca}"`);
        console.log('-----------------------------------------');
        console.log('GO TO YOUR DASHBOARD TO SEE THE TIMELINE!');

        process.exit(0);
    } catch (err) {
        console.error('[FATAL CHAOS]', err);
        process.exit(1);
    }
}

runChaosTest();

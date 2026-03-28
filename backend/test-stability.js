import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import Deployment from './models/Deployment.js';
import Incident from './models/Incident.js';
import Insight from './models/Insight.js';
import { generateSmartInsights } from './services/insightService.js';

dotenv.config();

/**
 * 🛰️ CHAOS SIMULATOR: Deployment-Incident Correlation
 * This script forces a "STABILITY" insight by linking a fake deployment to a fake incident.
 */
async function runStabilityChaos() {
    try {
        console.log('🚀 INITIALIZING STABILITY CHAOS...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[DB] Connected');

        // 1. Get a monitor
        const monitor = await Monitor.findOne().sort({ createdAt: -1 });
        if (!monitor) {
            console.error('❌ No monitors found.');
            process.exit(1);
        }
        console.log(`[TARGET] ${monitor.name} (${monitor.url})`);

        // 2. Clear old insights to see fresh ones
        await Insight.deleteMany({ monitor: monitor._id });

        // 3. Create a fake deployment (10 mins ago)
        const deploy = await Deployment.create({
            monitor: monitor._id,
            user: monitor.user,
            repo: monitor.githubRepo?.repo || 'test-repo',
            branch: monitor.githubRepo?.branch || 'main',
            commitSha: 'c0ffee123456789',
            status: 'SUCCESS',
            createdAt: new Date(Date.now() - 10 * 60 * 1000)
        });
        console.log(`[DEPLOY] 🏗️ Mock deployment created: ${deploy.commitSha}`);

        // 4. Create a fake incident (5 mins ago)
        const incident = await Incident.create({
            monitor: monitor._id,
            user: monitor.user,
            deployment: deploy._id,
            status: 'OPEN',
            startedAt: new Date(Date.now() - 5 * 60 * 1000),
            timeline: [
                { type: 'DOWN_DETECTED', message: 'Node unreachable posts-deploy', timestamp: new Date() }
            ]
        });
        console.log(`[INCIDENT] 🚨 Mock incident linked to deployment: ${incident._id}`);

        // 5. Trigger the Intelligence Engine
        console.log('[ENGINE] 🧠 Running Smart Insight analysis...');
        await generateSmartInsights(monitor._id);

        // 6. Verify result
        const stabilityInsight = await Insight.findOne({ monitor: monitor._id, type: 'STABILITY' });
        if (stabilityInsight) {
            console.log(`\n✨ SUCCESS! SMART INSIGHT DETECTED:`);
            console.log(`🚨 SEVERITY: ${stabilityInsight.severity}`);
            console.log(`🧠 MESSAGE: "${stabilityInsight.message}"`);
            console.log(`📍 TYPE: ${stabilityInsight.type}`);
        } else {
            console.log('\n❌ Stability insight not detected. Check service logic.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('💥 CHAOS FAILED:', err.message);
        process.exit(1);
    }
}

runStabilityChaos();

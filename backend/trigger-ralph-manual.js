import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

import Monitor from './models/Monitor.js';
import { triggerRalphLoop } from './services/ralphService.js';

async function run() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("❌ MONGODB_URI not found in environment variables.");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to Engine DB");

        // Find the monitor named "cab" (case-insensitive)
        const monitor = await Monitor.findOne({ name: { $regex: /^cab$/i } });
        
        if (!monitor) {
            console.error("❌ Monitor 'CAB' not found. Please ensure it exists on your dashboard.");
            const allMonitors = await Monitor.find({}).limit(5);
            console.log("Existing monitors:", allMonitors.map(m => m.name));
            process.exit(1);
        }

        console.log(`🚀 WAKING UP RALPH FOR: ${monitor.name} (ID: ${monitor._id})`);
        
        // This will trigger the actual reactive loop: 
        // ANALYZING -> RCA -> REMEDIATING -> STABILIZING -> IDLE
        // We force it to start by calling triggerRalphLoop
        await triggerRalphLoop(monitor._id);
        
        console.log("📡 Signal Dispatched. Watch your Dashboard Radar now!");
        
        // Wait a bit to let the loop progress
        setTimeout(() => {
            console.log("Check complete.");
            mongoose.disconnect();
            process.exit(0);
        }, 5000);

    } catch (err) {
        console.error("💥 CRITICAL ERROR:", err);
        process.exit(1);
    }
}

run();

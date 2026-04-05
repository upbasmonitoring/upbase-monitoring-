import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import { checkSingleMonitor } from './services/monitorService.js';

dotenv.config();

const forceUpdate = async () => {
    try {
        console.log('[ACCURACY-SYNC] Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('[ACCURACY-SYNC] Success! Fetching monitors...');

        const monitors = await Monitor.find({ isActive: true });
        console.log(`[ACCURACY-SYNC] Found ${monitors.length} targets. Starting High-Fidelity Audit...`);

        // Run checks in parallel
        await Promise.allSettled(monitors.map(monitor => {
            console.log(`[ACCURACY-SYNC] Probing ${monitor.name}...`);
            return checkSingleMonitor(monitor);
        }));

        console.log('[ACCURACY-SYNC] AUDIT COMPLETE. Dashboard is now synced with ground truth.');
        process.exit(0);
    } catch (err) {
        console.error('[ACCURACY-SYNC] CRITICAL ERROR:', err.message);
        process.exit(1);
    }
};

forceUpdate();

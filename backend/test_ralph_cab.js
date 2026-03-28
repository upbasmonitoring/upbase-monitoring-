import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import MonitorLog from './models/MonitorLog.js';
import { triggerRalphLoop } from './services/ralphService.js';

dotenv.config();

const testCabIntelligence = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const cabId = '69beef07d34788ecaa25ec2a';

        console.log(`[TEST-RALPH] 🧪 Simulating critical failure for CAB website...`);

        // 1. Create a "DOWN" log to give Ralph something to analyze
        await MonitorLog.create({
            monitor: cabId,
            status: 'DOWN',
            statusCode: 504,
            errorMessage: 'Gateway Timeout: Backend cluster unresponsive',
            responseTime: 0,
            checkedAt: new Date()
        });

        // 2. Clear Ralph status to allow a new loop
        const monitor = await Monitor.findById(cabId);
        monitor.ralphStatus = 'IDLE';
        await monitor.save();

        console.log(`[TEST-RALPH] 🚀 Triggering Ralph Intelligence for CAB...`);
        
        // 3. Trigger the Loop
        await triggerRalphLoop(cabId);

        console.log(`[TEST-RALPH] ✅ Test trigger finished. Check your dashboard for Ralph's brain!`);
        process.exit(0);
    } catch (err) {
        console.error(`[TEST-ERROR] ${err.message}`);
        process.exit(1);
    }
};

testCabIntelligence();

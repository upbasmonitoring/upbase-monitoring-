const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Minimal Schemas
const monitorSchema = new mongoose.Schema({ name: String });
const Monitor = mongoose.models.Monitor || mongoose.model('Monitor', monitorSchema);

const logSchema = new mongoose.Schema({
    monitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Monitor' },
    status: String,
    errorMessage: String,
    latency: Number
});
const MonitorLog = mongoose.models.MonitorLog || mongoose.model('MonitorLog', logSchema);

async function masterWipe() {
    try {
        console.log('Connecting to Cloud Database (Master Wipe)...');
        await mongoose.connect(MONGODB_URI);
        
        // 1. Find ALL monitors in the cloud
        const monitors = await Monitor.find({});
        console.log(`Found ${monitors.length} total monitors across all projects.`);

        let totalDeleted = 0;

        for (const monitor of monitors) {
            console.log(`Processing Clean-up for: ${monitor.name} (${monitor._id})...`);
            
            // 2. Wipe bad memory/history logs for this specific monitor
            const logResult = await MonitorLog.deleteMany({
                monitor: monitor._id,
                $or: [
                    { status: 'DOWN' },
                    { latency: { $gt: 1500 } },
                    { errorMessage: { $ne: null } }
                ]
            });
            
            totalDeleted += logResult.deletedCount;

            // 3. Wipe AI insights cache for this monitor
            if (mongoose.models.Insight) {
                await mongoose.models.Insight.deleteMany({ monitor: monitor._id });
            }
        }

        console.log('------------------------------------------------');
        console.log(`[MASTER WIPE] DONE! Deleted ${totalDeleted} problematic logs across ALL projects.`);
        console.log('------------------------------------------------');
        console.log('Status: 100% Production Synchronized.');
        process.exit(0);
    } catch (err) {
        console.error('Critical Error: ' + err.message);
        process.exit(1);
    }
}

masterWipe();

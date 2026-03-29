const mongoose = require('mongoose');
require('./models/MonitorLog.js');
require('./models/Insight.js');

const MonitorLog = mongoose.model('MonitorLog');
const Insight = mongoose.model('Insight');

async function cleanDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/monitring');
        
        // 1. Delete all high-latency or failed logs for NIRMAAN
        const logResult = await MonitorLog.deleteMany({ 
            monitor: '69c91ee0459b04fac20f1d1c', 
            $or: [
                { status: 'DOWN' },
                { latency: { $gt: 1500 } },
                { errorMessage: { $ne: null } }
            ]
        });
        console.log(`[CLEANUP] Deleted ${logResult.deletedCount} bad logs.`);
        
        // 2. Clear all High/Medium insights for this monitor
        const insightResult = await Insight.deleteMany({
            monitor: '69c91ee0459b04fac20f1d1c',
            severity: { $in: ['HIGH', 'MEDIUM'] }
        });
        console.log(`[CLEANUP] Deleted ${insightResult.deletedCount} stale insights.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanDB();

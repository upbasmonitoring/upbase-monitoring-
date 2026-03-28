import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';

dotenv.config();

const details = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const monitor = await Monitor.findOne({ name: 'cab moniting' });
        
        if (monitor) {
            console.log(`\nMonitor: ${monitor.name}`);
            console.log(`URL: ${monitor.url}`);
            console.log(`Status: ${monitor.status}`);
            console.log(`Last Error: ${monitor.lastError}`);
            console.log(`Consec Failures: ${monitor.consecutiveFailures}`);
            console.log(`Use Sentinel IQ: ${monitor.useSentinelIQ}`);
            console.log(`Health Score: ${monitor.healthScore}`);
        } else {
            console.log('Monitor not found');
        }
        
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

details();

const mongoose = require('mongoose');
const { triggerHealing } = require('./backend/selfHealingService.js');
require('dotenv').config({path: './backend/.env'});

// Mocking User model since internal logic uses it
const User = mongoose.model('User', new mongoose.Schema({ 
    github: { accessToken: { type: String, select: false } } 
}));

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find our test monitor
    const Monitor = mongoose.model('Monitor');
    const monitor = await Monitor.findOne({ name: 'Test GitHub Monitor' });
    
    if (!monitor) {
        console.error('Monitor not found. Run previous setup scripts first.');
        process.exit(1);
    }

    // Enable healing
    monitor.healingSettings = { enabled: true, mode: 'automatic', strategy: 'rollback' };
    await monitor.save();

    console.log('--- STARTING HEALING SIMULATION ---');
    const result = await triggerHealing(monitor._id, {
        type: 'deployment_failure',
        details: { state: 'failure', description: 'Simulated Deployment Failure' }
    });

    console.log('Healing Outcome:', result?.outcome);
    console.log('Record ID:', result?._id);
    
    process.exit();
}

runTest();

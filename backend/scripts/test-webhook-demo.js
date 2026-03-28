import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from '../models/Monitor.js';

dotenv.config({ path: './backend/.env' });

const API_URL = 'http://localhost:5000/api/webhooks/github';

async function runDemo() {
    console.log('🚀 Starting Section 3 Webhook Demo...');
    let testMonitor;

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to Database.');

        testMonitor = await Monitor.findOne({ 'githubRepo.owner': { $ne: null } });

        if (!testMonitor) {
            console.log('⚠️ No Git-Linked monitors found. SEEDING a test monitor for demo purposes...');
            testMonitor = await Monitor.create({
                name: "DEMO_APP (linked)",
                url: "https://google.com",
                status: "UP",
                githubRepo: {
                    owner: "demo_user",
                    repo: "demo_app",
                    branch: "main",
                    webhookSecret: "demo_secret_123"
                },
                user: (await mongoose.connection.db.collection('users').findOne())?._id || new mongoose.Types.ObjectId()
            });
            console.log(`✅ Seeded temporary monitor id: ${testMonitor._id}`);
        }

        const repoFullName = `${testMonitor.githubRepo.owner}/${testMonitor.githubRepo.repo}`;
        console.log(`📡 DEMO TARGET: ${testMonitor.name} (Repo: ${repoFullName})`);

        // 1. Simulating Push Event
        console.log('\n🔵 STEP 1: Sending Mock PUSH Event...');
        const pushPayload = {
            after: 'c8d2f1a3e5b7c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
            ref: `refs/heads/${testMonitor.githubRepo.branch}`,
            head_commit: {
                message: 'Update Section 3: Feature Polish 🚀',
                timestamp: new Date().toISOString()
            },
            repository: {
                full_name: repoFullName
            }
        };

        try {
            await axios.post(API_URL, pushPayload, {
                headers: { 'x-github-event': 'push' }
            });
            console.log('✅ Push Received. System should have stored the Commit SHA.');
        } catch (pushErr) {
            console.error('❌ Step 1 Failed:', pushErr.response?.data?.error || pushErr.message);
            process.exit(1);
        }

        // 2. Simulating Deployment Status Event (SUCCESS)
        console.log('\n🟢 STEP 2: Sending Mock DEPLOYMENT_STATUS (SUCCESS) Event...');
        const deployPayload = {
            deployment: {
                id: 123456,
                sha: 'c8d2f1a3e5b7c9d0e1f2a3b4c5d6e7f8a9b0c1d2'
            },
            deployment_status: {
                state: 'success',
                target_url: testMonitor.url,
                description: 'Deployment to Production finished.'
            },
            repository: {
                full_name: repoFullName
            }
        };

        try {
            await axios.post(API_URL, deployPayload, {
                headers: { 'x-github-event': 'deployment_status' }
            });
            console.log('✅ Deployment Success Received. System should have triggered a Health Check.');
        } catch (deployErr) {
            console.error('❌ Step 2 Failed:', deployErr.response?.data?.error || deployErr.message);
            process.exit(1);
        }

        console.log('\n✨ DEMO COMPLETE! Check your Dashboard to see the Latest Release SHA and Health status.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Demo Initialization Failed:', err.message);
        process.exit(1);
    }
}

runDemo();

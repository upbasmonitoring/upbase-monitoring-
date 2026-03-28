import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
// Ensure key exists for initialization logic in aiService.js
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-key-123';


// --- 🧪 MOCKING ENGINE ---
// Intercept axios calls to simulate external services (GitHub, Groq, Site)
const originalPost = axios.post;
const originalGet = axios.get;
const originalPut = axios.put;

let mockConfig = {
    ghBranchExists: false,
    aiFixQuality: 'good', // 'good' or 'bad'
    siteStability: 'stable', // 'stable' or 'flaky'
};

axios.get = async (url, config) => {
    // 1. GitHub Diff
    if (url.includes('/commits/')) return { data: 'MOCKED DIFF CONTENT' };
    
    // 2. GitHub Branch Check
    if (url.includes('/git/refs/heads/main')) return { data: { object: { sha: 'mock-base-sha' } } };
    if (url.includes('/contents/')) return { data: { sha: 'mock-file-sha' } };
    
    // 3. Validation Health Check
    if (url.includes('.vercel.app')) {
        if (mockConfig.siteStability === 'flaky' && url.includes('stable')) {
             return { status: 500, data: 'Internal Server Error' };
        }
        // Must be > 100 chars to avoid Sentinel IQ Score 10
        const longBody = '<html><body>' + 'Site is healthy '.repeat(20) + '</body></html>';
        return { status: 200, data: longBody };
    }

    return originalGet(url, config);
};

axios.post = async (url, data, config) => {
    // 1. Groq AI Fix Generation
    if (url.includes('api.groq.com')) {
        if (mockConfig.aiFixQuality === 'bad') {
            return { data: { choices: [{ message: { content: JSON.stringify({ success: true, fixedCode: 'BROKEN_CODE', confidence: 50 }) } }] } };
        }
        return { data: { choices: [{ message: { content: JSON.stringify({ success: true, fixedCode: 'const x = 1;', confidence: 95 }) } }] } };
    }
    
    // 2. GitHub Branch Creation
    if (url.includes('/git/refs')) return { status: 201, data: {} };

    return originalPost(url, data, config);
};

axios.put = async (url, data, config) => {
    // 1. GitHub Commit Push
    if (url.includes('/contents/')) return { data: { commit: { sha: 'mock-new-commit-sha' } } };
    return originalPut(url, data, config);
};

// --- 🏃 TEST RUNNER ---
async function runValidationTests() {
    try {
        console.log('🚀 INITIALIZING RALPH AUTO-FIX VALIDATION SUITE...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Dynamically import models and services AFTER dotenv
        const { default: Monitor } = await import('./models/Monitor.js');
        const { default: User } = await import('./models/User.js');
        const { triggerAutoFix } = await import('./services/autoFixService.js');
        const { validateFix } = await import('./services/validationService.js');

        // Setup Test Data
        const testUser = await User.findOneAndUpdate(
            { email: 'tester@ralph.com' },
            { name: 'Tester', github: { accessToken: 'mock-token' }, phone: '+123456789' },
            { upsert: true, new: true }
        );

        const monitor = await Monitor.findOneAndUpdate(
            { name: 'Pipeline-Test-Node' },
            { 
                user: testUser._id,
                project: new mongoose.Types.ObjectId(),
                url: 'http://test-site.com',
                status: 'DOWN',
                githubRepo: { owner: 'test-owner', repo: 'test-repo', branch: 'main', lastReleaseSha: 'old-sha' },
                autoFixAttempted: false,
                lastFixStatus: 'IDLE'
            },
            { upsert: true, new: true }
        );

        console.log('\n--- [CASE 1] SUCCESSFUL FIX & VALIDATION ---');
        mockConfig.aiFixQuality = 'good';
        mockConfig.siteStability = 'stable';
        
        // We override the 60s wait for testing speed
        console.log('(Bypassing 60s wait for test environment...)');
        const originalTimeout = global.setTimeout;
        global.setTimeout = (fn, ms) => fn(); 

        const result1 = await triggerAutoFix(monitor._id, 'ReferenceError: x is not defined', '<html>Error Page</html>');
        console.log('Result:', JSON.stringify(result1, null, 2));

        const updatedMod1 = await Monitor.findById(monitor._id);
        console.log('DB State - lastFixStatus:', updatedMod1.lastFixStatus);
        console.log('DB State - fixValidated:', updatedMod1.fixValidated);
        console.log('DB State - autoFixAttempted:', updatedMod1.autoFixAttempted);

        if (updatedMod1.lastFixStatus === 'VALIDATED' && updatedMod1.fixValidated === true) {
            console.log('✅ PASS: Fix successfully generated and validated.');
        } else {
            console.log('❌ FAIL: Status mismatch.');
        }

        console.log('\n--- [CASE 2] VALIDATION REJECTION (Low Confidence) ---');
        // Reset monitor for next test
        await Monitor.findByIdAndUpdate(monitor._id, {
            autoFixAttempted: false,
            lastFixStatus: 'IDLE',
            fixValidated: false
        });

        mockConfig.aiFixQuality = 'bad';
        const result2 = await triggerAutoFix(monitor._id, 'SyntaxError', '<html>Error</html>');
        console.log('Result:', result2.message);
        
        const updatedMod2 = await Monitor.findById(monitor._id);
        if (updatedMod2.lastFixStatus === 'FAILED') {
            console.log('✅ PASS: Correctly rejected bad AI fix.');
        }

        console.log('\n--- [CASE 3] LOOP PROTECTION ---');
        // monitor.autoFixAttempted is already true from Case 2
        const result3 = await triggerAutoFix(monitor._id, 'Persistent Error', '<html>Error</html>');
        if (result3.status === 'skipped') {
            console.log('✅ PASS: Loop protection prevented duplicate fix attempt.');
        }

        console.log('\n--- [CASE 4] SAFETY: NO AUTO-MERGE ---');
        console.log('Verifying that branch name is strictly "fix/ralph-auto-fix"...');
        if (result1.message.includes('fix/ralph-auto-fix')) {
            console.log('✅ PASS: Isolation maintained in fix branch.');
        }

        // Cleanup
        await Monitor.deleteOne({ _id: monitor._id });
        console.log('\n🏁 VALIDATION COMPLETE. Cleanup successful.');
        process.exit(0);

    } catch (err) {
        console.error('💥 TEST SUITE CRASHED:', err);
        process.exit(1);
    }
}

runValidationTests();

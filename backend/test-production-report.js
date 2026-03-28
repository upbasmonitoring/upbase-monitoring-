import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';
const MOCK_API_KEY = 'pw_4d722d96d9d077ffa586ebfe6c9b38ac0e92db3a8ec4e798';

async function testProductionReport() {
    console.log('Testing Production Error Reporting...');
    try {
        const response = await axios.post(`${API_BASE_URL}/production/report`, {
            project: 'Test Project Alpha',
            section: 'Checkout API',
            message: 'Database connection timeout in production cluster',
            stack: 'Error: Database connection timeout\n    at Pool.acquire (pool.js:45:12)\n    at Transaction.begin (db.js:88:5)',
            details: {
                server: 'aws-us-east-1-node-4',
                version: '2.4.0',
                requestId: 'req_12345abcdef'
            }
        }, {
            headers: {
                'x-api-key': MOCK_API_KEY
            }
        });
        console.log('✅ Success! Error reported:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ Failed to report error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Failed to report error:', error.message);
        }
    }
}

async function testSecurityReport() {
    console.log('\nTesting Security Finding Reporting...');
    try {
        const response = await axios.post(`${API_BASE_URL}/security/report`, {
            project: 'Test Project Alpha',
            type: 'vulnerability',
            severity: 'high',
            message: 'Suspicious SQL injection attempt detected in query parameter "id"',
            details: {
                ip: '192.168.1.100',
                payload: "'; DROP TABLE users; --",
                endpoint: '/api/v1/users/profile'
            }
        }, {
            headers: {
                'x-api-key': MOCK_API_KEY
            }
        });
        console.log('✅ Success! Security finding reported:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ Failed to report security finding:', error.response.status, error.response.data);
        } else {
            console.error('❌ Failed to report security finding:', error.message);
        }
    }
}

console.log('--- PULSEWATCH PRODUCTION CHECK TEST SCRIPT ---');
console.log('Note: Ensure backend is running and you have a valid API key.');
console.log('------------------------------------------------');

testProductionReport();
testSecurityReport();

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';
// Use the API Key you generated earlier for production checks
const API_KEY = 'pw_4d722d96d9d077ffa586ebfe6c9b38ac0e92db3a8ec4e798'; 

async function checkKerberos() {
    console.log('--- PULSEWATCH KERBEROS INTEGRATION CHECK ---');
    
    try {
        console.log('1. Connecting Kerberos with Enterprise Config...');
        const connectRes = await axios.post(`${API_BASE_URL}/integrations/kerberos`, {
            enabled: true,
            config: {
                realm: 'PULSEWATCH.PRODUCTION.INTERNAL',
                kdc: 'kdc01.pulsewatch.internal'
            }
        }, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log('✅ Connection Saved:', connectRes.data.message);

        console.log('\n2. Running Kerberos Handshake Simulation...');
        const testRes = await axios.post(`${API_BASE_URL}/integrations/kerberos/test`, {}, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log('✅ Handshake Result:', testRes.data.message);
        
        console.log('\n--- VERIFICATION COMPLETE ---');
    } catch (error) {
        console.error('❌ Integration check failed:', error.response?.data?.message || error.message);
    }
}

checkKerberos();

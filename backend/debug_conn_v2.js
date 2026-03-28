import axios from 'axios';
import https from 'https';

const url = 'https://testing1-exq.pages.dev';

const test = async () => {
    const agent = new https.Agent({ 
        keepAlive: false,
        rejectUnauthorized: false // Just for test
    });

    const commonHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    console.log(`Connecting to ${url} (No Keep-Alive)...`);
    try {
        const response = await axios.get(url, { 
            timeout: 10000, 
            headers: commonHeaders,
            httpsAgent: agent
        });
        console.log(`Status: ${response.status}`);
    } catch (err) {
        console.log(`Error Message: ${err.message}`);
        console.log(`Error Code: ${err.code}`);
    }
};

test();

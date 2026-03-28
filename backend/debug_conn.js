import axios from 'axios';

const url = 'https://testing1-exq.pages.dev';

const test = async () => {
    const commonHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };

    console.log(`Connecting to ${url}...`);
    try {
        const response = await axios.get(url, { 
            timeout: 10000, 
            headers: commonHeaders 
        });
        console.log(`Status: ${response.status}`);
        console.log(`Content-Length: ${response.data.length}`);
        console.log(`Headers:`, response.headers);
    } catch (err) {
        console.log(`Error Type: ${err.name}`);
        console.log(`Error Message: ${err.message}`);
        console.log(`Error Code: ${err.code}`);
        if (err.response) {
            console.log(`Response Status: ${err.response.status}`);
            console.log(`Response Headers:`, err.response.headers);
        }
    }
};

test();

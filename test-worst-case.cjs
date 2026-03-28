const axios = require('axios');
const http = require('http');

/**
 * 💀 Sentinel IQ Worst-Case Simulation
 * This script starts a mock "Broken" server that returns 200 OK
 * but contains a hidden "Application Error" pattern.
 */

const PORT = 3999;
const FAIL_PATTERN = "Application error: a client-side exception has occurred";

const server = http.createServer((req, res) => {
    console.log(`[MOCK-SERVER] 📡 Received probe from PulseWatch...`);
    
    // THE SABOTAGE: Sending 200 OK + Error Page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
            <head><title>Broken Web App</title></head>
            <body>
                <div id="__next">
                    <h1>Server Side Loading...</h1>
                </div>
                <!-- HIDDEN FAILURE PATTERN -->
                <script>
                   console.error("${FAIL_PATTERN}");
                </script>
                <div style="color: red; padding: 50px;">
                    ${FAIL_PATTERN}
                </div>
            </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(`\n🚀 💀 Sentinel IQ Simulation Server Started at http://localhost:${PORT}`);
    console.log(`👉 Step 1: Add http://localhost:${PORT} to your PulseWatch Dashboard.`);
    console.log(`👉 Step 2: Ensure "Sentinel IQ" is enabled in settings.`);
    console.log(`👉 Step 3: Wait 30 seconds...`);
    console.log(`\n🛡️ EXPECTED RESULT:`);
    console.log(`   PulseWatch will report DOWN: "SENTINEL_IQ: Hidden failure detected (Score: 3/10)"`);
    console.log(`   Notice: HTTP Status is 200, but the system understands the CONTENT is broken!`);
    console.log(`\nPress Ctrl+C to stop simulation.\n`);
});

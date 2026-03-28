import axios from 'axios';

export async function scanVulnerabilities(targetUrl) {
    if (!targetUrl) return { issues: ["No target URL provided"] };

    const report = {
        issues: []
    };

    try {
        // Fetch target URL to check security headers
        const response = await axios.get(targetUrl, { 
            validateStatus: () => true, // Don't throw on 4xx/5xx
            timeout: 5000
        });

        const headers = response.headers;

        // Check Content-Security-Policy
        if (!headers['content-security-policy']) {
            report.issues.push("Missing CSP header");
        }

        // Check Strict-Transport-Security
        if (!headers['strict-transport-security']) {
            report.issues.push("No HSTS");
        }

        // Check X-Frame-Options
        if (!headers['x-frame-options']) {
            report.issues.push("Missing X-Frame-Options header");
        }

        if (report.issues.length === 0) {
            report.issues.push("Basic security headers are present.");
        }

    } catch (error) {
        console.error('tinyfishTool error:', error.message);
        report.issues.push(`Failed to scan target URL: ${error.message}`);
    }

    return report;
}

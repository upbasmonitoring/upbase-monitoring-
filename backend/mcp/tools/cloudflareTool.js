import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export async function detectWafIncidents(monitorId) {
    try {
        // Fetch Cloudflare WAF block events from our observability engine APIs
        const response = await axios.get(`${BASE_URL}/api/alerts/${monitorId}?type=waf`);
        
        const blocks = response.data?.alerts || [];
        if (blocks.length > 0) {
            return `Detected ${blocks.length} possible WAF blocking or rate limiting events.`;
        }
        return "No WAF blocks detected.";
    } catch (error) {
        console.error('cloudflareTool error:', error.message);
        return "Could not determine WAF status.";
    }
}

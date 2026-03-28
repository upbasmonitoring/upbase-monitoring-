import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export async function fetchRenderLogs(monitorId) {
    try {
        // Fetch deployment/backend logs
        const response = await axios.get(`${BASE_URL}/api/monitors/${monitorId}/deploy-logs`);
        return response.data?.logs || "No recent deployment issues.";
    } catch (error) {
        console.error('renderTool error:', error.message);
        return "Failed to fetch deployment logs.";
    }
}

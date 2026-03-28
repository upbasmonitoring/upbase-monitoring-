import axios from 'axios';

// Correct API URL logic - must call /mcp/query exactly
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_BASE}/mcp/query`;

const MCP_API_KEY = import.meta.env.VITE_MCP_API_KEY || 'super-secret-mcp-key';

export interface MCPResponse {
  requestId: string;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  severity: 'low' | 'medium' | 'high';
  totalExecutionTime: number;
  latency: {
    p50: string;
    p95: string;
  };
  errors: string[];
  waf: string;
  render: string;
  security: {
    issues: string[];
  };
  summary: string;
  toolsMeta: Record<string, {
    time: number;
    success: boolean;
    timeout: boolean;
  }>;
}

export async function queryMCP(query: string, monitorId?: string, targetUrl?: string, debug: boolean = false): Promise<MCPResponse> {
  const currentKey = import.meta.env.VITE_MCP_API_KEY;
  console.log(`[MCP][DEBUG] Frontend Token: ${currentKey ? 'LOADED' : 'MISSING'}`);
  console.log(`[MCP][DEBUG] Calling AI Diagnostics: ${API_URL}`);
  
  try {
    const response = await axios.post(`${API_URL}?debug=${debug}`, {
      query,
      monitorId,
      targetUrl,
      debug
    }, {
      headers: {
        Authorization: `Bearer ${currentKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
        console.error(`[MCP][ERROR] 404 Not Found at ${API_URL}. Check if backend routes are mounted correctly.`);
        throw new Error("MCP endpoint not found. Check if the API URL is correct and the backend is running.");
    }
    if (error.response?.status === 401) {
        console.error(`[MCP][ERROR] 401 Unauthorized. Key mismatch or missing.`);
        throw new Error("Authentication failed: Invalid MCP API key. Please check your .env configuration.");
    }
    throw error;
  }
}


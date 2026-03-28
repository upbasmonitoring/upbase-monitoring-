import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const offlineHeuristicAnalysis = (monitor, statusCode, message, responseTime) => {
  // Common knowledge heuristics for incident analysis
  // Health check for online sites
  if (statusCode >= 200 && statusCode < 300) {
    const isMainstream = monitor.url.includes('google') || monitor.url.includes('github') || monitor.url.includes('amazon');
    
    return {
      rootCause: `The service is ONLINE and performing within healthy parameters. Current latency is ${responseTime || 'nominal'}ms. Architecture appears stable.`,
      remediation: isMainstream ? 
        "This is a high-availability public endpoint. No remediation needed. For performance fine-tuning, verify edge-caching headers (X-Cache) and SSL handshake duration." :
        "Service is healthy. Recommendation: Implement 'Server-Timing' headers to monitor internal middleware performance directly in browser devtools.",
      estimatedComplexity: "None",
      suggestedAction: isMainstream ? "curl -I -L " + monitor.url : "curl -w \"\\nConnect: %{time_connect}s\\nTTFB: %{time_starttransfer}s\\nTotal: %{time_total}s\\n\" " + monitor.url
    };
  }

  if (statusCode === 404) {
    return {
      rootCause: `The endpoint "${monitor.url}" was not found on the server. This usually means a broken link, a missing route in your backend, or a deployment that didn't include the target file.`,
      remediation: "Verify the URL path is correct and ensure the route is registered in your application code. Check if the deployment was successful.",
      estimatedComplexity: "Low"
    };
  }
  
  if (statusCode === 500) {
    return {
      rootCause: "A generic internal server error occurred. This often indicates an unhandled exception in the backend code, a crashed process, or a syntax error in a recent deployment.",
      remediation: "Check the backend application logs for the exact stack trace. Verify if the database or other microservices are reachable.",
      estimatedComplexity: "High"
    };
  }

  if (statusCode === 503 || statusCode === 504) {
    return {
      rootCause: "The service is currently unavailable or a gateway timeout occurred. This typically happens when the server is overloaded or the upstream service is failing to respond in time.",
      remediation: "Scale your server resources or check if a heavy database query is blocking the main thread. Investigate the health of upstream services/load balancers.",
      estimatedComplexity: "Medium"
    };
  }

  if (statusCode === 401 || statusCode === 403) {
    return {
      rootCause: "The request was rejected due to an authorization or permission failure. This might be an expired API key, missing headers, or a change in firewall IP whitelisting.",
      remediation: "Verify the authentication tokens and headers being sent by the monitor. Ensure the server's permissions allow traffic from our monitoring agents.",
      estimatedComplexity: "Low"
    }
  }

  return {
    rootCause: `General failure (${statusCode}: ${message}). This is likely a network level rejection or an unhandled protocol mismatch.`,
    remediation: "Manually verify the server logs. Run a 'curl' command from your local machine to see if the error is reproducible.",
    estimatedComplexity: "Medium"
  };
};

export const analyzeIncident = async (monitor, statusCode, message, responseTime) => {
  // If no API key or dummy key, use deterministic heuristics
  if (!process.env.GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY === 'your_gemini_api_key_here' || 
      process.env.GEMINI_API_KEY.includes('AIzaSyDummy')) {
        
    return {
      ...offlineHeuristicAnalysis(monitor, statusCode, message, responseTime),
      _aiStatus: "Offline Mode (Heuristic)"
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const isOnline = statusCode >= 200 && statusCode < 300;
    
    const prompt = `
      As a Senior Site Reliability Engineer (SRE), analyze a service for a monitor named "${monitor.name}" with URL "${monitor.url}".
      
      DETAILS:
      - Status: ${isOnline ? 'ONLINE' : 'OFFLINE'}
      - Status Code: ${statusCode}
      - Error Message: ${message}
      - Latency: ${responseTime}ms
      - Request Method: ${monitor.method || 'GET'}

      ${isOnline ? 
        'Provide a "Performance Overview" and "Optimization Recommendation" (e.g. cache headers) based on these details.' : 
        'Provide a "Technical Root Cause" and "Remediation Steps" to fix this failure.'}
      
      REQUIRED JSON FORMAT:
      {
        "rootCause": "${isOnline ? 'Performance Overview' : 'Technical Root Cause'}",
        "remediation": "${isOnline ? 'Optimization Recommendation' : 'Immediate Remediation Steps'}",
        "estimatedComplexity": "Low/Medium/High/Critical",
        "suggestedAction": "A CLI command or config tweak"
      }
      
      Respond ONLY with the JSON object.
    `;

    // Tiered model attempt: Flash then Pro
    let result;
    let modelUsed = "gemini-1.5-flash";
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      result = await model.generateContent(prompt);
    } catch (flashErr) {
      console.warn('Gemini 1.5 Flash failed, attempting Gemini Pro fallback...');
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      result = await model.generateContent(prompt);
      modelUsed = "gemini-pro";
    }

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    
    // Normalize: Ensure all fields are strings (Mongoose schema constraint)
    const rootCause = Array.isArray(analysis.rootCause) ? analysis.rootCause.join(' ') : String(analysis.rootCause || '');
    const remediation = Array.isArray(analysis.remediation) ? analysis.remediation.join(' ') : String(analysis.remediation || '');
    const estimatedComplexity = String(analysis.estimatedComplexity || 'Medium');
    const suggestedAction = Array.isArray(analysis.suggestedAction) ? analysis.suggestedAction.join(' ') : String(analysis.suggestedAction || '');

    const truncate = (str, len = 500) => typeof str === 'string' ? (str.length > len ? str.substring(0, len) + "..." : str) : String(str);

    return { 
      rootCause: truncate(rootCause),
      remediation: truncate(remediation),
      estimatedComplexity,
      suggestedAction: truncate(suggestedAction, 200),
      _aiStatus: `Online (${modelUsed})` 
    };

  } catch (error) {
    const errorMsg = error.message || 'AI analysis unavailable';
    console.warn('Tiered AI Analysis failed. Reverting to Heuristics:', errorMsg.substring(0, 100));
    return {
      ...offlineHeuristicAnalysis(monitor, statusCode, message, responseTime),
      _aiStatus: `Fallback: ${errorMsg.substring(0, 25)}`
    };
  }
};

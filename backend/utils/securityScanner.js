import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Analyzes HTTP headers for security vulnerabilities using AI.
 * @param {string} url - The URL being monitored.
 * @param {object} headers - The HTTP response headers.
 * @returns {object} - Security finding and calculated score.
 */
export const analyzeInfrastructureSecurity = async (url, headers) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return {
      message: "AI Security Scan skipped (API Key missing)",
      severity: "info",
      score: 100
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Clean headers for prompt (don't send everything if too large)
    const headerString = JSON.stringify(headers, null, 2);

    const prompt = `
      As a Cyber Security Infrastructure Auditor, analyze the following HTTP response headers for "${url}".
      Look for:
      - Missing Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
      - Information leakage (Server header, X-Powered-By)
      - Insecure configurations
      
      HEADERS:
      ${headerString}
      
      Provide a concise security report in JSON:
      {
        "message": "Summary of your most critical finding",
        "severity": "low|medium|high|critical",
        "score": 0-100 (100 is perfect)
      }
      Respond ONLY with JSON.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    return {
      message: analysis.message || "Security scan complete.",
      severity: analysis.severity || "info",
      score: analysis.score !== undefined ? analysis.score : 100
    };
  } catch (error) {
    console.error('[SECURITY SCAN ERROR]', error.message);
    // Fallback logic
    const missingHSTS = !headers['strict-transport-security'];
    const missingCSP = !headers['content-security-policy'];
    
    return {
      message: missingHSTS ? "HSTS Header Missing (Basic Scan)" : "Basic security checks passed.",
      severity: missingHSTS ? "medium" : "low",
      score: missingHSTS ? 75 : 100
    };
  }
};

import axios from 'axios';

/**
 * 🛰️ Groq AI Service: Sentinel IQ Intelligence Layer
 * Uses Llama-3-70B via Groq for ultra-fast hidden failure analysis.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const analyzeWithGroq = async (htmlSample) => {
    if (!GROQ_API_KEY) {
        console.warn('[GROQ-AI] 🚨 No GROQ_API_KEY found. Skipping AI intelligence layer.');
        return null;
    }

    try {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GROQ_TIMEOUT')), 2500)
        );

        const groqCall = axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: `You are a specialized Web Monitoring AI. Your task is to detect "Ghost Failures" where a site returns 200 OK but shows an error page.
                        Analyze the HTML snippet and output ONLY in this structured format:
                        IsFailure: YES/NO
                        Reason: [Short description]
                        Confidence: [0-100]`
                    },
                    {
                        role: 'user',
                        content: htmlSample.substring(0, 2000)
                    }
                ],
                temperature: 0.1, // High precision
                max_tokens: 150
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Race between the API call and the 2.5s timeout
        const response = await Promise.race([groqCall, timeout]);
        const content = response.data.choices[0].message.content;

        // Parse structured output
        const isFailure = content.includes('IsFailure: YES');
        const confidenceMatch = content.match(/Confidence:\s*(\d+)/);
        const reasonMatch = content.match(/Reason:\s*(.*)/);

        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
        const reason = reasonMatch ? reasonMatch[1].trim() : 'Unknown AI analysis';

        return {
            isFailure,
            confidence,
            reason,
            raw: content
        };
    } catch (error) {
        if (error.message === 'GROQ_TIMEOUT') {
            console.error('[GROQ-AI] ⏳ AI Analysis timed out. Falling back to rule-based logic.');
        } else {
            console.error('[GROQ-AI] ❌ API Error:', error.message);
        }
        return null;
    }
};

import axios from 'axios';

/**
 * Ralph AI Service: Automated Code Correction Layer
 * Uses Groq (Llama-3-70B) to generate mission-critical code fixes.
 */
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const generateFix = async ({ error, html, diff }) => {
    if (!GROQ_API_KEY) {
        console.warn('[AI-SERVICE] 🚨 No GROQ_API_KEY found. Skipping auto-fix generation.');
        return { success: false, message: 'Missing API Key' };
    }

    try {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI_TIMEOUT')), 2000) // STACK RULE: 2s timeout
        );

        const aiPrompt = `
            You are "Ralph Auto-Fix", a Senior Backend Engineer.
            FIX the following code error based on the provided diagnostics.

            ERROR: ${error}
            HTML SNIPPET: ${html.substring(0, 2000)}
            LAST COMMIT DIFF:
            ${diff}

            INSTRUCTIONS:
            1. Analyze the diff and the error to identify the breaking change.
            2. Return ONLY the corrected version of the code that needs replacement.
            3. Do not include markdown code blocks.
            4. Do not explain.
            5. Output must be a valid JSON object in this format:
               {
                 "success": true,
                 "fixedCode": "...",
                 "confidence": 0-100
               }
        `;

        const groqCall = axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: 'You are a mission-critical code-fix engine. Return JSON only.' },
                    { role: 'user', content: aiPrompt }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const response = await Promise.race([groqCall, timeout]);
        const result = response.data.choices[0].message.content;

        // Parse result
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;

        return {
            success: parsed.success || false,
            fixedCode: parsed.fixedCode || '',
            confidence: parsed.confidence || 0
        };

    } catch (err) {
        console.error(`[AI-SERVICE] ❌ Fix generation failed: ${err.message}`);
        return { success: false, message: err.message };
    }
};

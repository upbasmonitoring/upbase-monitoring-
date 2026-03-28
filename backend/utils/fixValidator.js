/**
 * Fix Validator: Safety Layer for AI-Generated Corrections
 * Ensures the generated code is robust and meets quality thresholds.
 */
export const validateFix = (response) => {
    if (!response) {
        console.error('[FIX-VALIDATOR] ❌ Empty response from AI.');
        return false;
    }

    const { success, fixedCode, confidence } = response;

    // RULE: Response exists & successful
    if (!success) {
        console.warn('[FIX-VALIDATOR] ⚠️ AI reported failure to generate fix.');
        return false;
    }

    // RULE: Confidence > 70
    if (confidence < 70) {
        console.warn(`[FIX-VALIDATOR] ⚠️ Fix confidence too low: ${confidence}% (Threshold: 70%)`);
        return false;
    }

    // RULE: Code not empty
    if (!fixedCode || fixedCode.trim().length === 0) {
        console.error('[FIX-VALIDATOR] ❌ AI returned empty code snippet.');
        return false;
    }

    // RULE: Basic code structure check (e.g. no markdown backticks)
    if (fixedCode.includes('```')) {
        console.warn('[FIX-VALIDATOR] ⚠️ Fix contains markdown fences. Potentially invalid code.');
        // We'll let it pass but log it (or we could clean it)
    }

    console.log(`[FIX-VALIDATOR] ✅ Pass: ${confidence}% confidence score.`);
    return true;
};

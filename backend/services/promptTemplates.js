/**
 * Prompt Templates — Structured prompts for AI log analysis
 * 
 * Designed for Gemini / any LLM that accepts structured system+user messages.
 * Templates enforce consistent, controlled output format to prevent hallucinations.
 */

/**
 * Build the system prompt for the AI analysis engine.
 */
export function buildSystemPrompt() {
  return `You are "Upbase AI Analyst", an expert Site Reliability Engineer (SRE) working inside a monitoring platform. Your job is to analyze correlated production incidents and explain them clearly.

RULES:
1. Be CONCISE. Maximum 3 sentences for the explanation.
2. Use SIMPLE language a junior developer or product manager would understand.
3. NEVER speculate beyond what the logs show. If uncertain, say so.
4. Base your analysis ONLY on the provided logs, timeline, and rule-based root cause.
5. Suggest only SAFE, reversible actions. Never suggest deleting production data.
6. Return ONLY valid JSON in the exact format specified. No markdown, no code blocks.
7. Do NOT include any text outside the JSON object.`;
}

/**
 * Build the analysis prompt from a correlated trace.
 * 
 * @param {Object} trace - The Trace document from the correlation engine
 * @returns {string} The user prompt
 */
export function buildAnalysisPrompt(trace) {
  // Summarize timeline (limit to avoid token overflow)
  const timelineStr = (trace.timeline || [])
    .slice(0, 20) // Max 20 entries
    .map((e, i) => {
      const ts = new Date(e.timestamp).toISOString().substring(11, 23);
      const meta = e.metadata ? ` | meta: ${JSON.stringify(e.metadata).substring(0, 200)}` : '';
      return `  ${i + 1}. [${ts}] [${e.type}/${e.source}] [${e.severity}] ${e.message?.substring(0, 256)}${meta}`;
    })
    .join('\n');

  const rootCause = trace.root_cause || {};

  return `Analyze this production incident and provide a structured response.

INCIDENT CONTEXT:
- Trace ID: ${trace.trace_id}
- Duration: ${trace.duration_ms}ms
- Log Count: ${trace.log_count}
- Types Involved: ${(trace.types_involved || []).join(', ')}
- Max Severity: ${trace.max_severity}
- Impact Level: ${trace.impact_level}
- Environment: ${trace.environment || 'unknown'}
- Project: ${trace.project_id || 'unknown'}

RULE-BASED ROOT CAUSE (pre-computed):
- Category: ${rootCause.category || 'unknown'}
- Description: ${rootCause.description || 'none'}
- Matched Rule: ${rootCause.matched_rule || 'none'}
- Confidence: ${rootCause.confidence || 'low'}

TIMELINE (ordered by timestamp):
${timelineStr || '  No timeline data'}

RESPOND WITH THIS EXACT JSON FORMAT:
{
  "explanation": "A clear, non-technical 1-3 sentence explanation of what happened and why.",
  "technical_summary": "A technical 1-2 sentence summary for engineers.",
  "root_cause_validated": true or false (does the AI agree with the rule-based root cause?),
  "ai_root_cause": "The AI's own root cause assessment if different from rule-based, otherwise same.",
  "severity_assessment": "low | medium | high | critical",
  "suggested_fixes": [
    {
      "action": "Short action title",
      "description": "What this fix does and why",
      "type": "manual | automated",
      "risk": "low | medium | high",
      "command": "Optional: shell command or API call"
    }
  ],
  "prevention_tips": ["Tip 1", "Tip 2"],
  "confidence": 0.0 to 1.0
}`;
}

/**
 * Build a prompt for analyzing a batch of recent errors for patterns.
 * 
 * @param {Array} traces - Array of recent Trace documents
 * @returns {string}
 */
export function buildPatternAnalysisPrompt(traces) {
  const summaries = traces.slice(0, 15).map((t, i) => {
    return `  ${i + 1}. [${t.impact_level}] ${t.root_cause?.category}: ${t.root_cause?.description?.substring(0, 150)} (${t.log_count} logs, ${t.duration_ms}ms)`;
  }).join('\n');

  return `Analyze these recent production incidents and identify patterns.

RECENT INCIDENTS (last ${traces.length}):
${summaries}

RESPOND WITH THIS EXACT JSON FORMAT:
{
  "pattern_detected": true or false,
  "pattern_summary": "Description of any recurring pattern",
  "top_issues": [
    {
      "category": "root cause category",
      "frequency": number,
      "trend": "increasing | stable | decreasing",
      "recommendation": "What to do about it"
    }
  ],
  "overall_health": "healthy | degraded | critical",
  "priority_action": "The single most important action to take right now"
}`;
}

export default {
  buildSystemPrompt,
  buildAnalysisPrompt,
  buildPatternAnalysisPrompt,
};

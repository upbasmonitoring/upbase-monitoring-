import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt, buildAnalysisPrompt, buildPatternAnalysisPrompt } from './promptTemplates.js';
import { getTrace, getRecentErrors } from './correlationEngine.js';
import { getFixSuggestions } from './fixSuggestionEngine.js';
import logger from '../utils/logger.js';

// ─── Gemini Client ──────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

function initGemini() {
  if (!GEMINI_API_KEY) {
    logger.warn('[AI-ANALYSIS] No GEMINI_API_KEY found. AI analysis disabled.');
    return false;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return true;
}

/**
 * Call Gemini with a structured prompt and parse JSON response.
 */
async function callGemini(systemPrompt, userPrompt, timeoutMs = 15000) {
  if (!initGemini()) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    clearTimeout(timer);

    const text = result.response.text();
    
    // Parse JSON from response (handle potential markdown wrapping)
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(cleaned);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      logger.error('[AI-ANALYSIS] Gemini request timed out');
    } else {
      logger.error('[AI-ANALYSIS] Gemini call failed', { error: err.message });
    }
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Analyze a single trace using AI.
 * 
 * Flow: Fetch trace → Build prompt → Call Gemini → Merge with rule-based suggestions
 * 
 * @param {string} traceId - The trace_id to analyze
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh] - Re-correlate before analysis
 * @returns {Object} Complete analysis result
 */
export async function analyzeTrace(traceId, { forceRefresh = false } = {}) {
  // 1. Get the correlated trace
  const trace = await getTrace(traceId, forceRefresh);
  if (!trace) {
    return { success: false, error: `No trace found for trace_id: ${traceId}` };
  }

  // 2. Get rule-based fix suggestions (always available, no AI needed)
  const ruleSuggestions = getFixSuggestions(trace.root_cause?.category, trace);

  // 3. Try AI analysis
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildAnalysisPrompt(trace);
  const aiResult = await callGemini(systemPrompt, userPrompt);

  // 4. Build response (merge AI + rule-based)
  const analysis = {
    trace_id: traceId,
    trace_summary: {
      log_count: trace.log_count,
      types_involved: trace.types_involved,
      max_severity: trace.max_severity,
      impact_level: trace.impact_level,
      duration_ms: trace.duration_ms,
      first_seen: trace.first_seen,
      last_seen: trace.last_seen,
      environment: trace.environment,
      project_id: trace.project_id,
    },

    // Rule-based (always present)
    root_cause: {
      category: trace.root_cause?.category,
      description: trace.root_cause?.description,
      matched_rule: trace.root_cause?.matched_rule,
      confidence: trace.root_cause?.confidence,
    },

    // AI-powered (null if AI unavailable)
    ai_analysis: aiResult ? {
      explanation: aiResult.explanation,
      technical_summary: aiResult.technical_summary,
      root_cause_validated: aiResult.root_cause_validated,
      ai_root_cause: aiResult.ai_root_cause,
      severity_assessment: aiResult.severity_assessment,
      prevention_tips: aiResult.prevention_tips || [],
      confidence: aiResult.confidence,
    } : null,

    // Merged suggestions: rule-based + AI
    suggested_fixes: mergeSuggestions(ruleSuggestions, aiResult?.suggested_fixes || []),

    // Timeline for UI rendering
    timeline: trace.timeline,

    // Metadata
    analyzed_at: new Date().toISOString(),
    ai_available: !!aiResult,
  };

  logger.info(`[AI-ANALYSIS] Trace ${traceId}: ai=${!!aiResult}, root_cause=${trace.root_cause?.category}, fixes=${analysis.suggested_fixes.length}`);

  return { success: true, data: analysis };
}

/**
 * Analyze recent errors for patterns.
 * 
 * @param {Object} [options]
 * @param {string} [options.project_id]
 * @param {string} [options.environment]
 * @param {number} [options.limit=15]
 * @returns {Object}
 */
export async function analyzePatterns({ project_id, environment, limit = 15 } = {}) {
  const traces = await getRecentErrors({ project_id, environment, limit, severity: 'warning' });

  if (!traces || traces.length === 0) {
    return { success: true, data: { pattern_detected: false, message: 'No recent errors to analyze' } };
  }

  // Try AI pattern analysis
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildPatternAnalysisPrompt(traces);
  const aiResult = await callGemini(systemPrompt, userPrompt);

  // Build manual pattern summary as fallback
  const categoryCounts = {};
  for (const t of traces) {
    const cat = t.root_cause?.category || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const fallbackPatterns = {
    pattern_detected: Object.keys(categoryCounts).length < traces.length,
    top_issues: Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, frequency]) => ({ category, frequency, trend: 'stable', recommendation: `Investigate recurring ${category} issues` })),
    overall_health: traces.some(t => t.impact_level === 'critical') ? 'critical' :
                    traces.some(t => t.impact_level === 'high') ? 'degraded' : 'healthy',
    total_incidents: traces.length,
  };

  return {
    success: true,
    data: aiResult ? { ...aiResult, total_incidents: traces.length } : fallbackPatterns,
    ai_available: !!aiResult,
    analyzed_at: new Date().toISOString(),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Merge rule-based and AI suggestions, deduplicating by action title.
 */
function mergeSuggestions(ruleBased, aiSuggested) {
  const merged = [...ruleBased];
  const existingTitles = new Set(merged.map(s => s.action.toLowerCase()));

  for (const aiSug of aiSuggested) {
    if (!existingTitles.has(aiSug.action?.toLowerCase())) {
      merged.push({
        ...aiSug,
        source: 'ai',
      });
      existingTitles.add(aiSug.action?.toLowerCase());
    }
  }

  // Mark rule-based ones
  return merged.map(s => ({ ...s, source: s.source || 'rule-engine' }));
}

export default { analyzeTrace, analyzePatterns };

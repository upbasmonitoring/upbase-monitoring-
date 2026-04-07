/**
 * Observability API Client — Connects to the PulseWatch backend
 * 
 * Uses the log API key (not JWT auth) for trace/analysis endpoints.
 */

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL.replace(/\/$/, '')}/api`;

// Log API key — stored separately from user auth
const LOG_API_KEY = import.meta.env.VITE_LOG_API_KEY || 'upbase-log-dev-key-2026';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-log-api-key': LOG_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────

export interface TimelineEntry {
  log_id: string;
  timestamp: string;
  type: 'frontend' | 'backend' | 'system';
  source: string;
  service: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, any>;
}

export interface RootCause {
  category: string;
  description: string;
  matched_rule: string | null;
  confidence: 'low' | 'medium' | 'high';
  source_log_id?: string | null;
}

export interface TraceData {
  _id: string;
  trace_id: string;
  timeline: TimelineEntry[];
  log_count: number;
  types_involved: string[];
  max_severity: string;
  root_cause: RootCause;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  first_seen: string;
  last_seen: string;
  duration_ms: number;
  project_id: string | null;
  environment: string | null;
  status: string;
  is_demo?: boolean;
}

export interface TraceSummary {
  _id: string;
  trace_id: string;
  log_count: number;
  types_involved: string[];
  max_severity: string;
  root_cause: RootCause;
  impact_level: string;
  first_seen: string;
  last_seen: string;
  duration_ms: number;
  project_id: string | null;
  environment: string | null;
  is_demo?: boolean;
}

export interface FixSuggestion {
  action: string;
  description: string;
  type: 'manual' | 'automated';
  risk: 'low' | 'medium' | 'high';
  action_id?: string;
  source: 'rule-engine' | 'ai';
  context?: Record<string, any>;
}

export interface AIAnalysis {
  explanation: string;
  technical_summary: string;
  root_cause_validated: boolean;
  ai_root_cause: string;
  severity_assessment: string;
  prevention_tips: string[];
  confidence: number;
}

export interface AnalysisResult {
  trace_id: string;
  trace_summary: Record<string, any>;
  root_cause: RootCause;
  ai_analysis: AIAnalysis | null;
  suggested_fixes: FixSuggestion[];
  timeline: TimelineEntry[];
  analyzed_at: string;
  ai_available: boolean;
}

export interface ActionResult {
  id: string;
  action_id: string;
  action_name: string;
  description?: string;
  risk: string;
  status: string;
  requires_confirmation?: boolean;
  message?: string;
  result?: { success: boolean; message: string; output?: string };
  duration_ms?: number;
}

export interface RootCauseSummary {
  total_traces: number;
  by_category: { category: string; count: number; latest: string; avg_duration_ms: number }[];
  by_impact: Record<string, number>;
}

// ─── API Functions ──────────────────────────────────────────────

export const observabilityApi = {
  /** Get recent error traces */
  getErrors: (params?: { severity?: string; limit?: number; project_id?: string; environment?: string }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.set('severity', params.severity);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.project_id) query.set('project_id', params.project_id);
    if (params?.environment) query.set('environment', params.environment);
    return request<{ success: boolean; count: number; data: TraceSummary[] }>(
      `/traces/errors?${query.toString()}`
    );
  },

  /** Get full trace by ID */
  getTrace: (traceId: string, refresh = false) =>
    request<{ success: boolean; data: TraceData }>(
      `/traces/${traceId}${refresh ? '?refresh=true' : ''}`
    ),

  /** Get root cause summary */
  getRootCauseSummary: (params?: { project_id?: string }) => {
    const query = params?.project_id ? `?project_id=${params.project_id}` : '';
    return request<{ success: boolean; data: RootCauseSummary }>(`/traces/root-cause-summary${query}`);
  },

  /** AI analysis of a trace */
  analyzeTrace: (traceId: string) =>
    request<{ success: boolean; data: AnalysisResult }>('/obs/analyze', {
      method: 'POST',
      body: JSON.stringify({ trace_id: traceId }),
    }),

  /** Create a pending action */
  createAction: (data: { action_id: string; trace_id?: string; project_id?: string; environment?: string }) =>
    request<{ success: boolean; data: ActionResult }>('/obs/action', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Confirm or cancel action */
  confirmAction: (actionLogId: string, confirmed: boolean) =>
    request<{ success: boolean; data: ActionResult }>(`/obs/action/${actionLogId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ confirmed }),
    }),

  /** Submit feedback */
  submitFeedback: (actionLogId: string, helpful: boolean, comment?: string) =>
    request<{ success: boolean; message: string }>(`/obs/action/${actionLogId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ helpful, comment }),
    }),

  /** Get action history */
  getActionHistory: (params?: { trace_id?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.trace_id) query.set('trace_id', params.trace_id);
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{ success: boolean; count: number; data: any[] }>(`/obs/action/history?${query.toString()}`);
  },
};

/**
 * Root Cause Detection Rules — Rule-Based Engine
 * 
 * Each rule has:
 *   - id:          Unique identifier
 *   - name:        Human-readable rule name
 *   - category:    Root cause category (database, network, cdn, etc.)
 *   - impact:      Default impact level
 *   - confidence:  How confident we are when this rule matches
 *   - priority:    Higher = evaluated first (overrides lower-priority matches)
 *   - match(logs): Function that returns true if the rule matches the log set
 *   - describe(logs): Function that returns a human-readable description
 * 
 * Rules are evaluated in priority order (highest first).
 * First match wins unless a higher-confidence match is found.
 */

// ─── Helper matchers ─────────────────────────────────────────────
const hasType = (logs, type) => logs.some(l => l.type === type);
const hasSeverity = (logs, sev) => logs.some(l => l.severity === sev);
const hasSource = (logs, src) => logs.some(l => l.source?.toLowerCase() === src.toLowerCase());
const hasMessageMatch = (logs, regex) => logs.some(l => regex.test(l.message || ''));
const hasMetadataMatch = (logs, key, valueRegex) =>
  logs.some(l => l.metadata && valueRegex.test(String(l.metadata[key] || '')));

const getLogsWith = (logs, predicate) => logs.filter(predicate);

// ─── SEVERITY WEIGHTS ────────────────────────────────────────────
const SEVERITY_WEIGHT = { info: 0, warning: 1, error: 2, critical: 3 };

function getMaxSeverity(logs) {
  let max = 'info';
  for (const log of logs) {
    if ((SEVERITY_WEIGHT[log.severity] || 0) > (SEVERITY_WEIGHT[max] || 0)) {
      max = log.severity;
    }
  }
  return max;
}

// ─── IMPACT CALCULATION ──────────────────────────────────────────
function calculateImpact(logs, baseImpact) {
  const maxSev = getMaxSeverity(logs);
  const hasCritical = maxSev === 'critical';
  const hasMultipleTypes = new Set(logs.map(l => l.type)).size >= 2;
  const errorCount = logs.filter(l => l.severity === 'error' || l.severity === 'critical').length;

  if (hasCritical || errorCount >= 5) return 'critical';
  if (hasMultipleTypes && errorCount >= 2) return 'high';
  if (errorCount >= 1) return baseImpact === 'low' ? 'medium' : baseImpact;
  return baseImpact;
}

// ─── RULE DEFINITIONS ────────────────────────────────────────────
export const ROOT_CAUSE_RULES = [
  // ─── Priority 100: Infrastructure / System-level ──────────────
  {
    id: 'oom_kill',
    name: 'Out of Memory (OOM)',
    category: 'memory',
    impact: 'critical',
    confidence: 'high',
    priority: 100,
    match: (logs) =>
      hasMessageMatch(logs, /oom|out of memory|memory limit|heap.*exceeded|killed.*process/i),
    describe: (logs) => {
      const oom = logs.find(l => /oom|out of memory|memory limit/i.test(l.message));
      return `Process killed due to memory exhaustion on ${oom?.source || 'unknown'}: "${oom?.message?.substring(0, 128)}"`;
    },
  },

  {
    id: 'db_connection_failure',
    name: 'Database Connection Failure',
    category: 'database',
    impact: 'critical',
    confidence: 'high',
    priority: 95,
    match: (logs) =>
      hasMessageMatch(logs, /database.*connect|db.*connect|mongo.*connect|postgres.*connect|mysql.*connect|connection.*pool.*exhaust/i) &&
      hasSeverity(logs, 'error') || hasSeverity(logs, 'critical'),
    describe: (logs) => {
      const db = logs.find(l => /database|db|mongo|postgres|mysql|connection.*pool/i.test(l.message) && (l.severity === 'error' || l.severity === 'critical'));
      return `Database connectivity lost: "${db?.message?.substring(0, 128)}"`;
    },
  },

  {
    id: 'db_timeout',
    name: 'Database Timeout',
    category: 'database',
    impact: 'high',
    confidence: 'high',
    priority: 90,
    match: (logs) =>
      hasMessageMatch(logs, /db.*timeout|query.*timeout|database.*timeout|connection.*timeout.*db/i),
    describe: (logs) => {
      const t = logs.find(l => /timeout/i.test(l.message) && /db|database|query|mongo|postgres/i.test(l.message));
      return `Database query timed out: "${t?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 85: CDN / Edge ──────────────────────────────────
  {
    id: 'cdn_502',
    name: 'CDN 502 Bad Gateway',
    category: 'cdn',
    impact: 'high',
    confidence: 'high',
    priority: 85,
    match: (logs) =>
      hasSource(logs, 'cloudflare') &&
      (hasMessageMatch(logs, /502|bad gateway/i) || hasMetadataMatch(logs, 'statusCode', /502/)),
    describe: (logs) => {
      const cf = logs.find(l => l.source?.toLowerCase() === 'cloudflare' && /502|bad gateway/i.test(l.message));
      return `Cloudflare returned 502 Bad Gateway: "${cf?.message?.substring(0, 128)}"`;
    },
  },

  {
    id: 'cdn_503',
    name: 'CDN 503 Service Unavailable',
    category: 'cdn',
    impact: 'high',
    confidence: 'high',
    priority: 84,
    match: (logs) =>
      hasSource(logs, 'cloudflare') &&
      (hasMessageMatch(logs, /503|service unavailable/i) || hasMetadataMatch(logs, 'statusCode', /503/)),
    describe: (logs) => {
      const cf = logs.find(l => l.source?.toLowerCase() === 'cloudflare' && /503/i.test(l.message));
      return `CDN origin is unreachable (503): "${cf?.message?.substring(0, 128)}"`;
    },
  },

  {
    id: 'cdn_edge_latency',
    name: 'CDN Edge High Latency',
    category: 'cdn',
    impact: 'medium',
    confidence: 'medium',
    priority: 60,
    match: (logs) =>
      hasSource(logs, 'cloudflare') &&
      hasMessageMatch(logs, /latency|slow|high.*p99|p95|response.*time/i),
    describe: (logs) => {
      const cf = logs.find(l => l.source?.toLowerCase() === 'cloudflare' && /latency|slow/i.test(l.message));
      return `High latency detected at CDN edge: "${cf?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 80: Authentication ──────────────────────────────
  {
    id: 'auth_failure',
    name: 'Authentication / Authorization Failure',
    category: 'authentication',
    impact: 'medium',
    confidence: 'high',
    priority: 80,
    match: (logs) =>
      hasMessageMatch(logs, /auth.*fail|unauthorized|forbidden|jwt.*expired|token.*invalid|403|401/i) &&
      hasSeverity(logs, 'error'),
    describe: (logs) => {
      const a = logs.find(l => /auth|unauthorized|forbidden|jwt|token|403|401/i.test(l.message));
      return `Authentication/authorization failure: "${a?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 75: Network / Timeout ───────────────────────────
  {
    id: 'network_timeout',
    name: 'Network Timeout',
    category: 'timeout',
    impact: 'high',
    confidence: 'medium',
    priority: 75,
    match: (logs) =>
      hasMessageMatch(logs, /timeout|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENOTFOUND|socket hang up/i) &&
      !hasMessageMatch(logs, /db.*timeout|database.*timeout|query.*timeout/i), // Don't overlap with DB rules
    describe: (logs) => {
      const t = logs.find(l => /timeout|ETIMEDOUT|ECONNREFUSED|ECONNRESET/i.test(l.message));
      return `Network connectivity issue: "${t?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 70: Third-party ─────────────────────────────────
  {
    id: 'third_party_failure',
    name: 'Third-Party Service Failure',
    category: 'third_party',
    impact: 'medium',
    confidence: 'medium',
    priority: 70,
    match: (logs) =>
      hasMessageMatch(logs, /stripe|paypal|twilio|sendgrid|aws|s3|firebase|webhook.*fail/i) &&
      hasSeverity(logs, 'error'),
    describe: (logs) => {
      const tp = logs.find(l => /stripe|paypal|twilio|sendgrid|aws|s3|firebase|webhook/i.test(l.message) && l.severity === 'error');
      return `Third-party service failure: "${tp?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 65: Deploy / Build ──────────────────────────────
  {
    id: 'deploy_failure',
    name: 'Deployment Failure',
    category: 'infrastructure',
    impact: 'high',
    confidence: 'high',
    priority: 65,
    match: (logs) =>
      hasSource(logs, 'render') &&
      hasMessageMatch(logs, /deploy.*fail|build.*fail|deploy.*error/i),
    describe: (logs) => {
      const d = logs.find(l => /deploy|build/i.test(l.message) && /fail|error/i.test(l.message));
      return `Deployment failed: "${d?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 50: Backend errors (generic) ────────────────────
  {
    id: 'backend_unhandled',
    name: 'Backend Unhandled Exception',
    category: 'backend',
    impact: 'medium',
    confidence: 'medium',
    priority: 50,
    match: (logs) =>
      hasType(logs, 'backend') &&
      (hasSeverity(logs, 'error') || hasSeverity(logs, 'critical')) &&
      hasMessageMatch(logs, /uncaught|unhandled|exception|crash|fatal/i),
    describe: (logs) => {
      const be = logs.find(l => l.type === 'backend' && /uncaught|unhandled|exception|crash|fatal/i.test(l.message));
      return `Backend unhandled exception: "${be?.message?.substring(0, 128)}"`;
    },
  },

  {
    id: 'backend_5xx',
    name: 'Backend 5xx Response',
    category: 'backend',
    impact: 'medium',
    confidence: 'medium',
    priority: 45,
    match: (logs) =>
      hasType(logs, 'backend') &&
      (hasMetadataMatch(logs, 'statusCode', /^5\d{2}$/) ||
       hasMessageMatch(logs, /\b5\d{2}\b.*error|internal server error/i)),
    describe: (logs) => {
      const be = logs.find(l => l.type === 'backend' && (/5\d{2}/.test(l.message) || /5\d{2}/.test(String(l.metadata?.statusCode))));
      return `Backend returned 5xx error: "${be?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 40: Frontend-only ───────────────────────────────
  {
    id: 'frontend_crash',
    name: 'Frontend JavaScript Crash',
    category: 'frontend',
    impact: 'medium',
    confidence: 'high',
    priority: 40,
    match: (logs) => {
      const feErrors = getLogsWith(logs, l => l.type === 'frontend' && (l.severity === 'error' || l.severity === 'critical'));
      const beErrors = getLogsWith(logs, l => l.type === 'backend' && (l.severity === 'error' || l.severity === 'critical'));
      // Frontend error with no corresponding backend errors → frontend is the root cause
      return feErrors.length > 0 && beErrors.length === 0;
    },
    describe: (logs) => {
      const fe = logs.find(l => l.type === 'frontend' && (l.severity === 'error' || l.severity === 'critical'));
      return `Frontend crash with no backend errors: "${fe?.message?.substring(0, 128)}"`;
    },
  },

  {
    id: 'frontend_network_error',
    name: 'Frontend Network Request Failed',
    category: 'network',
    impact: 'medium',
    confidence: 'medium',
    priority: 35,
    match: (logs) =>
      hasType(logs, 'frontend') &&
      hasMessageMatch(logs, /fetch.*fail|network.*error|xhr.*error|http.*request.*fail/i),
    describe: (logs) => {
      const fe = logs.find(l => l.type === 'frontend' && /fetch|network|xhr|http.*request/i.test(l.message));
      return `Frontend network request failure: "${fe?.message?.substring(0, 128)}"`;
    },
  },

  // ─── Priority 10: Catch-all ───────────────────────────────────
  {
    id: 'generic_error',
    name: 'Unclassified Error',
    category: 'unknown',
    impact: 'low',
    confidence: 'low',
    priority: 10,
    match: (logs) =>
      hasSeverity(logs, 'error') || hasSeverity(logs, 'critical'),
    describe: (logs) => {
      const e = logs.find(l => l.severity === 'error' || l.severity === 'critical');
      return `Error detected but no specific rule matched: "${e?.message?.substring(0, 128)}"`;
    },
  },
];

/**
 * Run all rules against a set of logs and return the best match.
 * @param {Array} logs - Array of log objects from a single trace
 * @returns {{ rule: Object, impact: string, description: string, source_log: Object|null }}
 */
export function detectRootCause(logs) {
  if (!logs || logs.length === 0) {
    return {
      rule: null,
      category: 'unknown',
      description: 'No logs available for analysis',
      impact: 'low',
      confidence: 'low',
      source_log: null,
    };
  }

  // Sort rules by priority (highest first)
  const sortedRules = [...ROOT_CAUSE_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    try {
      if (rule.match(logs)) {
        const description = rule.describe(logs);
        const impact = calculateImpact(logs, rule.impact);

        // Find the most relevant log for this rule
        const errorLogs = logs.filter(l => l.severity === 'error' || l.severity === 'critical');
        const source_log = errorLogs[0] || logs[0];

        return {
          rule: { id: rule.id, name: rule.name },
          category: rule.category,
          description,
          impact,
          confidence: rule.confidence,
          source_log,
        };
      }
    } catch (err) {
      // Skip broken rules gracefully
      console.warn(`[ROOT-CAUSE] Rule "${rule.id}" threw: ${err.message}`);
    }
  }

  // No rules matched
  return {
    rule: null,
    category: 'unknown',
    description: 'No matching root cause rule',
    impact: calculateImpact(logs, 'low'),
    confidence: 'low',
    source_log: null,
  };
}

export default { ROOT_CAUSE_RULES, detectRootCause };

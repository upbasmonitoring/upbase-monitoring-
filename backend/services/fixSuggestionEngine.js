/**
 * Fix Suggestion Engine — Maps root cause categories to actionable fixes
 * 
 * Each fix has:
 *   - action:      Short title
 *   - description: What it does
 *   - type:        'manual' | 'automated'
 *   - risk:        'low' | 'medium' | 'high'
 *   - action_id:   Unique ID for the action engine
 *   - command:     Optional shell / API command
 * 
 * These are deterministic, rule-based suggestions — no AI needed.
 * AI suggestions are merged on top by aiAnalysisService.
 */

const FIX_MAP = {
  database: [
    {
      action: 'Increase database connection pool',
      description: 'Your database ran out of available connections. Increase the pool size in your database config (e.g., MONGODB_POOL_SIZE or PG_MAX_CONNECTIONS).',
      type: 'manual',
      risk: 'low',
      action_id: 'db_increase_pool',
    },
    {
      action: 'Restart database service',
      description: 'Restart the database container or service to clear stuck connections and reset the pool.',
      type: 'automated',
      risk: 'medium',
      action_id: 'db_restart',
      command: 'render services restart --service-id $DB_SERVICE_ID',
    },
    {
      action: 'Add query timeout safeguards',
      description: 'Set explicit query timeouts (e.g., serverSelectionTimeoutMS=5000) to prevent queries from hanging indefinitely.',
      type: 'manual',
      risk: 'low',
      action_id: 'db_add_timeout',
    },
    {
      action: 'Check slow query log',
      description: 'Review the database slow query log to identify and optimize expensive queries causing timeouts.',
      type: 'manual',
      risk: 'low',
      action_id: 'db_check_slow_queries',
    },
  ],

  cdn: [
    {
      action: 'Check origin server health',
      description: 'The CDN returned 502/503 which means your origin server is unreachable. Check if the backend is running.',
      type: 'manual',
      risk: 'low',
      action_id: 'cdn_check_origin',
    },
    {
      action: 'Restart backend service',
      description: 'Restart your backend to restore connectivity with the CDN edge.',
      type: 'automated',
      risk: 'medium',
      action_id: 'backend_restart',
      command: 'render services restart --service-id $BACKEND_SERVICE_ID',
    },
    {
      action: 'Purge CDN cache',
      description: 'Clear the Cloudflare cache to ensure stale error responses are not served.',
      type: 'automated',
      risk: 'low',
      action_id: 'cdn_purge_cache',
      command: 'curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" -H "Authorization: Bearer $CF_TOKEN" -d \'{"purge_everything":true}\'',
    },
    {
      action: 'Enable Cloudflare Always Online',
      description: 'Enable "Always Online" in Cloudflare to serve cached pages when your origin is down.',
      type: 'manual',
      risk: 'low',
      action_id: 'cdn_always_online',
    },
  ],

  frontend: [
    {
      action: 'Deploy frontend hotfix',
      description: 'The crash is isolated to the frontend with no backend errors. Deploy a fix for the JavaScript error.',
      type: 'manual',
      risk: 'medium',
      action_id: 'fe_deploy_hotfix',
    },
    {
      action: 'Rollback to previous frontend build',
      description: 'Roll back to the last working frontend deployment to restore functionality while investigating.',
      type: 'automated',
      risk: 'medium',
      action_id: 'fe_rollback',
      command: 'render deploys rollback --service-id $FRONTEND_SERVICE_ID',
    },
    {
      action: 'Add error boundary component',
      description: 'Wrap the crashing component in a React Error Boundary (or equivalent) to prevent full-page crashes.',
      type: 'manual',
      risk: 'low',
      action_id: 'fe_error_boundary',
    },
  ],

  backend: [
    {
      action: 'Restart backend service',
      description: 'Restart the backend process to clear crashed state and restore normal operation.',
      type: 'automated',
      risk: 'medium',
      action_id: 'backend_restart',
      command: 'render services restart --service-id $BACKEND_SERVICE_ID',
    },
    {
      action: 'Rollback to previous deployment',
      description: 'Roll back to the last successful backend deployment.',
      type: 'automated',
      risk: 'medium',
      action_id: 'backend_rollback',
      command: 'render deploys rollback --service-id $BACKEND_SERVICE_ID',
    },
    {
      action: 'Check application logs',
      description: 'Review recent application logs for stack traces and error patterns.',
      type: 'manual',
      risk: 'low',
      action_id: 'backend_check_logs',
    },
  ],

  authentication: [
    {
      action: 'Verify JWT secret configuration',
      description: 'Check that JWT_SECRET is set correctly in environment variables and matches across services.',
      type: 'manual',
      risk: 'low',
      action_id: 'auth_check_jwt',
    },
    {
      action: 'Clear user session cache',
      description: 'Clear the Redis/in-memory session cache to force token re-validation.',
      type: 'automated',
      risk: 'low',
      action_id: 'auth_clear_sessions',
      command: 'redis-cli FLUSHDB',
    },
    {
      action: 'Rotate API keys',
      description: 'If keys were compromised, generate new API keys and revoke old ones.',
      type: 'manual',
      risk: 'medium',
      action_id: 'auth_rotate_keys',
    },
  ],

  timeout: [
    {
      action: 'Add retry with exponential backoff',
      description: 'The request timed out. Add retry logic with exponential backoff to handle transient failures.',
      type: 'manual',
      risk: 'low',
      action_id: 'timeout_add_retry',
    },
    {
      action: 'Increase timeout threshold',
      description: 'If the target service is legitimately slow, increase the timeout value.',
      type: 'manual',
      risk: 'low',
      action_id: 'timeout_increase',
    },
    {
      action: 'Add response caching',
      description: 'Cache responses for frequently requested endpoints to reduce dependency on slow upstreams.',
      type: 'manual',
      risk: 'low',
      action_id: 'timeout_add_cache',
    },
  ],

  memory: [
    {
      action: 'Restart service to free memory',
      description: 'The process was killed due to memory exhaustion. Restart to free memory immediately.',
      type: 'automated',
      risk: 'low',
      action_id: 'memory_restart',
      command: 'render services restart --service-id $SERVICE_ID',
    },
    {
      action: 'Upgrade server resources',
      description: 'Increase the RAM allocation for this service to prevent future OOM kills.',
      type: 'manual',
      risk: 'low',
      action_id: 'memory_upgrade',
    },
    {
      action: 'Profile memory usage',
      description: 'Run a heap snapshot or memory profiler to identify memory leaks.',
      type: 'manual',
      risk: 'low',
      action_id: 'memory_profile',
    },
  ],

  network: [
    {
      action: 'Check DNS resolution',
      description: 'Verify DNS is resolving correctly for the target service.',
      type: 'manual',
      risk: 'low',
      action_id: 'network_check_dns',
    },
    {
      action: 'Verify firewall rules',
      description: 'Ensure security groups and firewall rules allow traffic to the target.',
      type: 'manual',
      risk: 'low',
      action_id: 'network_check_firewall',
    },
  ],

  third_party: [
    {
      action: 'Check third-party status page',
      description: 'The external service may be experiencing an outage. Check their status page.',
      type: 'manual',
      risk: 'low',
      action_id: 'tp_check_status',
    },
    {
      action: 'Enable fallback/circuit breaker',
      description: 'Implement a circuit breaker pattern to gracefully degrade when the third-party is down.',
      type: 'manual',
      risk: 'low',
      action_id: 'tp_circuit_breaker',
    },
  ],

  infrastructure: [
    {
      action: 'Rollback deployment',
      description: 'The latest deployment caused issues. Roll back to the previous version.',
      type: 'automated',
      risk: 'medium',
      action_id: 'infra_rollback',
      command: 'render deploys rollback --service-id $SERVICE_ID',
    },
    {
      action: 'Check build logs',
      description: 'Review the build logs for compilation errors or missing dependencies.',
      type: 'manual',
      risk: 'low',
      action_id: 'infra_check_build',
    },
  ],

  configuration: [
    {
      action: 'Audit environment variables',
      description: 'Check that all required environment variables are set correctly.',
      type: 'manual',
      risk: 'low',
      action_id: 'config_audit_env',
    },
  ],

  unknown: [
    {
      action: 'Review full trace timeline',
      description: 'The root cause could not be automatically determined. Review the full trace timeline for clues.',
      type: 'manual',
      risk: 'low',
      action_id: 'unknown_review',
    },
    {
      action: 'Escalate to on-call engineer',
      description: 'This issue needs human investigation. Escalate to the on-call team.',
      type: 'manual',
      risk: 'low',
      action_id: 'unknown_escalate',
    },
  ],
};

/**
 * Get fix suggestions for a root cause category.
 * 
 * @param {string} category - Root cause category from the correlation engine
 * @param {Object} trace - The trace document (for context-specific suggestions)
 * @returns {Array} Array of fix suggestion objects
 */
export function getFixSuggestions(category, trace = {}) {
  const suggestions = FIX_MAP[category] || FIX_MAP.unknown;

  // Enrich with trace-specific data
  return suggestions.map(s => ({
    ...s,
    context: {
      trace_id: trace.trace_id,
      project_id: trace.project_id,
      environment: trace.environment,
    },
  }));
}

/**
 * Get all available action IDs.
 */
export function getAvailableActions() {
  const actions = {};
  for (const [category, fixes] of Object.entries(FIX_MAP)) {
    for (const fix of fixes) {
      if (fix.type === 'automated') {
        actions[fix.action_id] = {
          action: fix.action,
          description: fix.description,
          risk: fix.risk,
          category,
        };
      }
    }
  }
  return actions;
}

export default { getFixSuggestions, getAvailableActions };

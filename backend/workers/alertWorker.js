import { Worker, Queue } from 'bullmq';
import redis from '../config/redis.js';
import AlertRule from '../models/AlertRule.js';
import Alert from '../models/Alert.js';
import RequestLog from '../models/RequestLog.js';
import { dispatchAlert } from '../alertService.js'; // Existing dispatch alert for now

import { getRedisStatus } from '../config/redis.js';

export const alertQueue = !getRedisStatus().isMock ? new Queue('alert-eval', { connection: redis }) : null;

let worker = null;

if (!getRedisStatus().isMock) {
    worker = new Worker('alert-eval', async (job) => {
      const { type, projectId, monitorId, result } = job.data;
      
      const rules = await AlertRule.find({
        project: projectId,
        isActive: true,
        metric: getMetricForType(type),
      });

      for (const rule of rules) {
        // Cooldown check
        if (rule.lastTriggeredAt) {
          const cooldownMs = (rule.cooldownMinutes || 30) * 60 * 1000;
          if (Date.now() - rule.lastTriggeredAt.getTime() < cooldownMs) {
            continue;
          }
        }

        const shouldAlert = await evaluateCondition(rule, result, projectId);

        if (shouldAlert) {
          await AlertRule.updateOne({ _id: rule._id }, { lastTriggeredAt: new Date() });

          const alert = await Alert.create({
            project: projectId,
            rule: rule._id,
            monitor: monitorId,
            severity: rule.severity,
            message: buildMessage(rule, result),
            triggeredAt: new Date(),
            status: 'active',
            metadata: result,
          });

          // Call notification service (dispatchAlert already handles some channels)
          console.log(`[ALERT] Rule ${rule.name} triggered for project ${projectId}`);
        }
      }
    }, { connection: redis });
}

function getMetricForType(type) {
  const map = {
    'uptime': 'uptime',
    'new_error': 'new_error',
    'traffic': 'error_rate',
    'security': 'security_threat'
  };
  return map[type] || type;
}

async function evaluateCondition(rule, result, projectId) {
  switch (rule.metric) {
    case 'uptime':
      return rule.operator === 'eq' && result.status === 'down' || result.status === 'offline';
    
    case 'response_time':
      if (!result.responseTime) return false;
      return compareValues(result.responseTime, rule.operator, rule.threshold);
      
    case 'error_rate': {
      const windowStart = new Date(Date.now() - (rule.window || 5) * 60 * 1000);
      const total = await RequestLog.countDocuments({ project: projectId, timestamp: { $gte: windowStart } });
      const errors = await RequestLog.countDocuments({ project: projectId, timestamp: { $gte: windowStart }, statusCode: { $gte: 400 } });
      const rate = total > 0 ? (errors / total) * 100 : 0;
      return compareValues(rate, rule.operator, rule.threshold);
    }

    case 'new_error':
      return true; // Simple trigger for any new unique error

    default:
      return false;
  }
}

function compareValues(actual, operator, threshold) {
  switch (operator) {
    case 'gt': return actual > threshold;
    case 'lt': return actual < threshold;
    case 'eq': return actual === threshold;
    default: return false;
  }
}

function buildMessage(rule, result) {
  return `${rule.name}: ${rule.metric.toUpperCase()} threshold exceeded. Current value: ${JSON.stringify(result)}`;
}

export default worker;

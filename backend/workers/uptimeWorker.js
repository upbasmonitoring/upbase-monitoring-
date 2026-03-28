import { Worker } from 'bullmq';
import axios from 'axios';
import redis from '../config/redis.js';
import Monitor from '../models/Monitor.js';
import Heartbeat from '../models/Heartbeat.js';
// import { analyzeIncident } from './utils/aiAnalyzer.js'; // Removed due to incorrect path and redundant with dynamic import
import { runSyntheticFlow } from '../syntheticService.js';
import { analyzeInfrastructureSecurity } from '../utils/securityScanner.js';
import { triggerHealing } from '../selfHealingService.js';
import { dispatchAlert } from '../alertService.js';
import { alertQueue } from './alertWorker.js';

import { getRedisStatus } from '../config/redis.js';

export const processUptimeCheck = async (monitorId, stats = { id: 'local' }) => {
  try {
    const monitor = await Monitor.findById(monitorId);
    if (!monitor || !monitor.isActive) return;

    const start = Date.now();
    let status = 'offline';
    let statusCode = 0;
    let message = '';
    let responseTime = 0;
    let stepResults = [];
    let lastHeaders = {};
    let responseBody = null;

    try {
      if (monitor.monitorType === 'synthetic') {
        const result = await runSyntheticFlow(monitor);
        status = result.status;
        responseTime = result.responseTime;
        message = result.message;
        stepResults = result.stepResults;
      } else {
        const response = await axios({
          method: monitor.method || 'GET',
          url: monitor.url,
          timeout: 10000,
          headers: {
            'User-Agent': 'Sentinel-Bot/1.0'
          },
          validateStatus: () => true 
        });
        
        const expected = monitor.expectedStatusCode || 200;
        status = response.status === expected ? 'online' : 'offline';
        statusCode = response.status;
        message = response.statusText || (status === 'online' ? 'OK' : `Unexpected status: ${response.status}`);
        responseTime = Date.now() - start;
        lastHeaders = response.headers;
        responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }
    } catch (error) {
      status = 'offline';
      statusCode = error.response ? error.response.status : (error.code === 'ECONNABORTED' ? 408 : 0);
      message = error.message;
      responseTime = Date.now() - start;
      if (error.response) {
        responseBody = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      }
    }

    // Security Uptime Correlation
    let securityFinding = null;
    const shouldCheckSecurity = !monitor.lastSecurityCheck || 
                              (Date.now() - new Date(monitor.lastSecurityCheck).getTime() > 3600000); // Once per hour

    if (status === 'online' && shouldCheckSecurity && Object.keys(lastHeaders).length > 0) {
      securityFinding = await analyzeInfrastructureSecurity(monitor.url, lastHeaders);
      monitor.securityScore = securityFinding.score;
      monitor.lastSecurityCheck = new Date();
    }

    const previousStatus = monitor.status;
    monitor.responseTime = responseTime;
    monitor.lastChecked = new Date();
    // basic save for telemetry, status will be updated by handleMonitorCheck
    await monitor.save();

    let aiAnalysis = null;
    if (status === 'offline') {
        // AI Diagnostic (Proactive)
        try {
            const { analyzeIncident } = await import('../utils/aiAnalyzer.js');
            aiAnalysis = await analyzeIncident(monitor, statusCode, message, responseTime);
        } catch (e) {}

        // Trigger Healing — but RESPECT the deployment cooldown lock
        // After a rollback, we set a 5-min cooldown so the deployment platform
        // (Cloudflare Pages, Vercel, etc.) has time to propagate before we act again.
        try {
            const isCoolingDown = monitor.healingCooldownUntil && new Date(monitor.healingCooldownUntil) > new Date();
            if (isCoolingDown) {
                console.log(`[MONITOR] Healing cooldown active for ${monitor.name}. Skipping healing until ${new Date(monitor.healingCooldownUntil).toLocaleTimeString()}. Waiting for rollback deployment to propagate.`);
            } else {
                await triggerHealing(monitor._id);
            }
        } catch (e) {}
    }

    // Auto-clear cooldown when site comes back UP after a rollback
    if (status === 'online' && monitor.healingCooldownUntil && new Date(monitor.healingCooldownUntil) > new Date()) {
        console.log(`[MONITOR] Site ${monitor.name} is back UP. Clearing healing cooldown early.`);
        monitor.healingCooldownUntil = null;
        await monitor.save();
    }

    // 🏆 Intelligent Alerting Logic
    try {
        const { handleMonitorCheck } = await import('../alertService.js');
        await handleMonitorCheck(monitor._id, {
            status,
            statusCode,
            responseTime,
            message,
            aiAnalysis,
            responseBody
        });
    } catch (e) {
        console.error(`[ALERT-ERROR] handleMonitorCheck failed: ${e.message}`);
    }

    // Save Heartbeat log
    await Heartbeat.create({
      monitor: monitor._id,
      status,
      statusCode,
      responseTime,
      message,
      responseBody: status === 'offline' ? responseBody : null, // Only store body if it failed to save space
      aiAnalysis,
      stepResults,
      securityFinding
    });

    console.log(`[MONITOR] ${status.toUpperCase()} | ${responseTime}ms | ${monitor.url}`);

    // Trigger alert evaluation - Only if Redis is real (otherwise skip or handle direct)
    if (!getRedisStatus().isMock) {
        await alertQueue.add('evaluate', {
          type: 'uptime',
          projectId: monitor.project,
          monitorId: monitor._id,
          result: { status, statusCode, responseTime },
        });
    }

  } catch (err) {
    console.error(`[PROCESSOR ERROR] Monitor ${monitorId} failed:`, err.message);
  }
};

let worker = null;
if (!getRedisStatus().isMock) {
    worker = new Worker('uptime-checks', async (job) => {
      return processUptimeCheck(job.data.monitorId, { id: job.id });
    }, { 
      connection: redis,
      concurrency: 50 
    });

    worker.on('failed', (job, err) => {
      console.error(`[BULL-WORKER] Job ${job.id} failed: ${err.message}`);
    });
}


export default worker;

import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    createMonitor,
    getMonitors,
    getMonitorById,
    updateMonitor,
    getMonitorLogs,
    deleteMonitor,
    getMonitorStats,
    getRecentEvents,
    getDeployments,
    getActiveAlerts,
    getAlertHistory,
    getSelfHealingLogs,
    triggerManualRecovery,
    getMonitorIncidentTimeline,
    getMonitorInsights,
    toggleAutoHeal,
    silenceMonitor,
    getGlobalIntelligence,
    ingestRumTelemetry
} from '../controllers/monitorController.js';

import { validateMonitor } from '../middleware/validator.js';
import { rumLimiter } from '../middleware/securityShield.js';
import { calculateSLO, generateHourlySummary, detectAnomaly } from '../services/observabilityService.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// --- PUBLIC RUM ENDPOINT ---
router.post('/rum/telemetry', rumLimiter, ingestRumTelemetry);

router.route('/')
    .post(protect, validateMonitor, createMonitor)
    .get(protect, getMonitors);

router.get('/stats', protect, getMonitorStats);
router.get('/events', protect, getRecentEvents);
router.get('/deployments', protect, getDeployments);
router.get('/alerts/active', protect, (req, res) => res.json([]));
router.get('/alerts/history', protect, (req, res) => res.json([]));


router.get('/healing/logs', protect, getSelfHealingLogs);
router.get('/intelligence/feed', protect, getGlobalIntelligence);

router.route('/:id')
    .get(protect, getMonitorById)
    .put(protect, validateMonitor, updateMonitor)
    .delete(protect, deleteMonitor);

router.post('/:id/recover', protect, triggerManualRecovery);
router.put('/:id/healing/toggle', protect, toggleAutoHeal);
router.put('/:id/silence', protect, silenceMonitor);

router.get('/:id/incidents', protect, getMonitorIncidentTimeline);
router.get('/:id/insights', protect, getMonitorInsights);

router.get('/:id/logs', protect, getMonitorLogs);

// --- LUXURY OBSERVABILITY ENDPOINTS ---
router.get('/:id/slo', protect, asyncHandler(async (req, res) => {
    const windowHours = parseInt(req.query.window) || 24;
    const slo = await calculateSLO(req.params.id, windowHours);
    res.json(slo);
}));

router.get('/:id/analytics/hourly', protect, asyncHandler(async (req, res) => {
    const summary = await generateHourlySummary(req.params.id);
    res.json(summary || { message: 'No data in the last hour' });
}));

router.get('/:id/anomaly', protect, asyncHandler(async (req, res) => {
    const latency = parseInt(req.query.latency) || 0;
    const result = await detectAnomaly(req.params.id, latency);
    res.json(result);
}));

export default router;

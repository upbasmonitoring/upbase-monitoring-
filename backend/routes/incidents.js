import express from 'express';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getMonitorIncidents, getProjectIncidents, addIncidentEvent } from '../services/incidentService.js';

const router = express.Router();

/**
 * @desc    Get all incidents for a project
 * @route   GET /api/incidents/project/:projectId
 * @access  Private
 */
router.get('/project/:projectId', protect, asyncHandler(async (req, res) => {
    const incidents = await getProjectIncidents(req.params.projectId);
    res.json(incidents);
}));

/**
 * @desc    Get incident timeline for a site/monitor
 * @route   GET /api/incidents/:siteId
 * @access  Private
 */
router.get('/:siteId', protect, asyncHandler(async (req, res) => {
    const incidents = await getMonitorIncidents(req.params.siteId);
    res.json(incidents);
}));


/**
 * @desc    Add event to active incident (internal/diagnostic)
 * @route   POST /api/incidents/event
 * @access  Private
 */
router.post('/event', protect, asyncHandler(async (req, res) => {
    const { siteId, type, message } = req.body;
    const result = await addIncidentEvent(siteId, type, message);
    if (!result) {
        return res.status(404).json({ message: 'No active incident found for this site' });
    }
    res.json(result);
}));

export default router;

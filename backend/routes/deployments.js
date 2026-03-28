import express from 'express';
import { protect } from '../middleware/auth.js';
import Deployment from '../models/Deployment.js';
import Incident from '../models/Incident.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

/**
 * @desc    Get detailed impact and timeline for a deployment
 * @route   GET /api/deployments/:id/impact
 * @access  Private
 */
router.get('/:id/impact', protect, asyncHandler(async (req, res) => {
    const deployment = await Deployment.findById(req.params.id).populate('monitor');
    if (!deployment) return res.status(404).json({ message: 'Deployment not found' });

    // Find incident associated with this deployment
    const incident = await Incident.findOne({ deployment: deployment._id })
        .populate('timeline');

    res.json({
        commitId: deployment.commitSha,
        repo: deployment.repo,
        status: deployment.status,
        impact: deployment.impact,
        incident: incident || null,
        // Synthesized timeline for the "Impact View"
        timeline: incident ? incident.timeline : []
    });
}));

export default router;

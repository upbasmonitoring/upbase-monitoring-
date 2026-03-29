import express from 'express';
import authRoutes from './auth.js';
import teamRoutes from './team.js';
import projectRoutes from './projects.js';
import monitorRoutes from './monitors.js';
import apiKeyRoutes from './apikeys.js'; // Added import for apiKeys routes
import incidentRoutes from './incidents.js';
import deploymentRoutes from './deployments.js';
import externalRoutes from './external.js';
import fixRoutes from './fixRoutes.js';
import statsRoutes from './stats.js';

const router = express.Router();

// Essential Core Routes
router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/projects', projectRoutes);
router.use('/monitors', monitorRoutes);
router.use('/keys', apiKeyRoutes); // Added usage for apiKeys routes
router.use('/external', externalRoutes); // Mount external API
router.use('/incidents', incidentRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/fixes', fixRoutes);
router.use('/stats', statsRoutes);

export default router;

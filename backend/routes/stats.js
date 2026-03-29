import express from 'express';
import { getGlobalStats } from '../services/statsService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /api/stats/global
 * @desc Get global uptime and monitoring stats for landing page (Redis Cached)
 */
router.get('/global', async (req, res) => {
    try {
        const stats = await getGlobalStats();
        res.json(stats);
    } catch (error) {
        logger.error(`[STATS_ROUTE] Error: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch global metrics' });
    }
});

export default router;

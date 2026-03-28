import express from 'express';
import { protect } from '../middleware/auth.js';
import { registerExternalSite } from '../controllers/externalController.js';

const router = express.Router();

// --- 🌐 EXTERNAL INGEST NODE ---
// This route is specifically designed for 'monitr_' API Key access
router.post('/site', protect, registerExternalSite);

export default router;

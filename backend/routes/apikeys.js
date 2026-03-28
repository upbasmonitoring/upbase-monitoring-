import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    createApiKey,
    getProjectApiKeys,
    revokeApiKey
} from '../controllers/apiKeyController.js';

const router = express.Router();

router.route('/')
    .post(protect, createApiKey);

router.route('/project/:projectId')
    .get(protect, getProjectApiKeys);

router.route('/:id')
    .delete(protect, revokeApiKey);

export default router;

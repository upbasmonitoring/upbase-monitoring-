import express from 'express';
import { getFixByMonitorId, mergeFix, rejectFix, postMergeValidate } from '../controllers/fixController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:monitorId', protect, getFixByMonitorId);
router.post('/:id/merge', protect, mergeFix);
router.post('/:id/post-merge-validate', protect, postMergeValidate);
router.post('/:id/reject', protect, rejectFix);

export default router;

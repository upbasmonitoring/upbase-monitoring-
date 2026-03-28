import express from 'express';
import { protect } from '../middleware/auth.js';
import HealingLog from '../models/HealingLog.js';
import Monitor from '../models/Monitor.js';
import { triggerGitHubHealing, applyAICodeFix } from '../selfHealingService.js';
import ProductionError from '../models/ProductionError.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get all healing logs for the current user
// @route   GET /api/healing-logs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const logs = await HealingLog.find({ user: req.user.id })
      .populate('monitor', 'name url githubRepo')
      .populate('productionError', 'project section message priority')
      .sort({ startedAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get healing stats summary
// @route   GET /api/healing-logs/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const logs = await HealingLog.find({ user: req.user.id });
    const total = logs.length;
    const healed = logs.filter(l => l.outcome === 'healed_by_rollback' || l.outcome === 'healed_by_ai').length;
    const byRollback = logs.filter(l => l.outcome === 'healed_by_rollback').length;
    const byAI = logs.filter(l => l.outcome === 'healed_by_ai').length;
    const failed = logs.filter(l => l.outcome === 'healing_failed').length;
    const inProgress = logs.filter(l => l.outcome === 'in_progress').length;
    const avgTime = total > 0
      ? Math.round(logs.filter(l => l.timeTakenMs).reduce((a, b) => a + (b.timeTakenMs || 0), 0) / logs.filter(l => l.timeTakenMs).length / 1000)
      : 0;

    res.json({ total, healed, byRollback, byAI, failed, inProgress, avgTimeSeconds: avgTime });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Manually trigger self-healing for a specific production error
// @route   POST /api/healing-logs/trigger/:errorId
// @access  Private
router.post('/trigger/:errorId', protect, async (req, res) => {
  try {
    const error = await ProductionError.findOne({ _id: req.params.errorId, user: req.user.id });
    if (!error) return res.status(404).json({ message: 'Production error not found' });

    // Fire and forget
    triggerGitHubHealing(error).catch(e => console.error('[MANUAL-HEAL] Error:', e.message));

    res.json({ success: true, message: 'Self-healing manually triggered. Check healing logs for progress.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get a single healing log
// @route   GET /api/healing-logs/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const log = await HealingLog.findOne({ _id: req.params.id, user: req.user.id })
      .populate('monitor', 'name url githubRepo')
      .populate('productionError', 'project section message stack priority');
    if (!log) return res.status(404).json({ message: 'Healing log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Approve and apply an AI code fix
// @route   POST /api/healing-logs/:id/approve
// @access  Private
router.post('/:id/approve', protect, async (req, res) => {
  try {
    const log = await HealingLog.findOne({ _id: req.params.id, user: req.user.id })
      .populate('monitor');
    if (!log) return res.status(404).json({ message: 'Log not found' });
    if (log.outcome !== 'suggestion_generated') return res.status(400).json({ message: 'No pending fix found' });

    const user = await User.findById(req.user.id).select('+github.accessToken');
    const { owner, repo, branch } = log.monitor.githubRepo;
    const token = user.github.accessToken;

    const result = await applyAICodeFix(token, owner, repo, branch, log);
    if (!result.success) return res.status(500).json({ message: result.message });

    res.json({ success: true, message: 'Code fix successfully pushed to GitHub' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Reject and discard an AI code fix
// @route   POST /api/healing-logs/:id/reject
// @access  Private
router.post('/:id/reject', protect, async (req, res) => {
  try {
    const log = await HealingLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { outcome: 'fix_rejected', completedAt: new Date() },
      { new: true }
    );
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json({ success: true, message: 'AI fix rejected and discarded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from 'express';
import HealingAutomation from '../models/HealingAutomation.js';
import { protect } from '../middleware/auth.js';
import { executeHealingAction, executeHealingAction as executeRaw } from '../selfHealingService.js';
import { exec } from 'child_process';
import { runSingleMonitorCheck } from '../monitorService.js';

const router = express.Router();

// @desc    Get all healing automations
// @route   GET /api/healing
router.get('/', protect, async (req, res) => {
  try {
    const automations = await HealingAutomation.find({ user: req.user.id })
      .populate('targetMonitor', 'name url status');
    res.json(automations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a healing automation
// @route   POST /api/healing
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, targetMonitor, type, config, trigger, status } = req.body;
    
    const automation = await HealingAutomation.create({
      user: req.user.id,
      name,
      description,
      targetMonitor,
      type,
      config,
      trigger,
      status: status || 'draft'
    });
    
    res.status(201).json(automation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update healing automation
// @route   PUT /api/healing/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const automation = await HealingAutomation.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!automation) return res.status(404).json({ message: 'Automation not found' });
    res.json(automation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Delete healing automation
// @route   DELETE /api/healing/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const automation = await HealingAutomation.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!automation) return res.status(404).json({ message: 'Automation not found' });
    res.json({ message: 'Automation removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Run healing automation manually
// @route   POST /api/healing/:id/run
router.post('/:id/run', protect, async (req, res) => {
  try {
    const automation = await HealingAutomation.findOne({ _id: req.params.id, user: req.user.id });
    if (!automation) return res.status(404).json({ message: 'Automation not found' });
    
    const result = await executeHealingAction(automation);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Run manual one-off repair command
// @route   POST /api/healing/run-raw
router.post('/run-raw', protect, async (req, res) => {
  try {
    const { command, monitorId } = req.body;
    if (!command) return res.status(400).json({ message: 'No command provided' });

    console.log(`[REPAIR] Executing manual repair: ${command}`);

    const result = await new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (monitorId) {
            setTimeout(() => runSingleMonitorCheck(monitorId), 2000);
        }
        resolve({
          status: error ? 'fail' : 'success',
          output: stdout || stderr || 'Command executed with no output'
        });
      });
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

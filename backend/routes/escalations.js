import express from 'express';
import { protect } from '../middleware/auth.js';
import Escalation from '../models/Escalation.js';

const router = express.Router();

// @desc    Get all escalation policies for the current user
// @route   GET /api/escalations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const policies = await Escalation.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create an escalation policy
// @route   POST /api/escalations
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, target, status, steps } = req.body;
    
    const policy = await Escalation.create({
      user: req.user.id,
      name,
      target: target || 'Global',
      status: status || 'Active',
      steps: steps || []
    });

    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update an escalation policy
// @route   PUT /api/escalations/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const policy = await Escalation.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const { name, target, status, steps } = req.body;
    
    policy.name = name || policy.name;
    policy.target = target || policy.target;
    policy.status = status || policy.status;
    policy.steps = steps || policy.steps;

    await policy.save();
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete an escalation policy
// @route   DELETE /api/escalations/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const policy = await Escalation.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    await policy.deleteOne();
    res.json({ message: 'Policy removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

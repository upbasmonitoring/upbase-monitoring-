import express from 'express';
import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import Heartbeat from '../models/Heartbeat.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all alert rules for a user
router.get('/', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user.id }).populate('monitor', 'name');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create an alert rule
router.post('/', protect, async (req, res) => {
  try {
    const { monitor, type, threshold, channel } = req.body;
    const alert = await Alert.create({
      user: req.user.id,
      monitor,
      type,
      threshold,
      channel
    });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get alert history (recent failures that would trigger alerts)
router.get('/history', protect, async (req, res) => {
  try {
    const monitors = await mongoose.model('Monitor').find({ user: req.user.id });
    const monitorIds = monitors.map(m => m._id);
    
    const history = await Heartbeat.find({ 
      monitor: { $in: monitorIds },
      status: 'offline'
    })
    .sort({ timestamp: -1 })
    .limit(20)
    .populate('monitor', 'name');
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear alert history (offline failures)
router.delete('/history', protect, async (req, res) => {
  try {
    const monitors = await mongoose.model('Monitor').find({ user: req.user.id });
    const monitorIds = monitors.map(m => m._id);
    
    await Heartbeat.deleteMany({ 
      monitor: { $in: monitorIds },
      status: 'offline'
    });
    
    res.json({ message: 'Alert history cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an alert rule
router.delete('/:id', protect, async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user.id });
    if (!alert) {
      return res.status(404).json({ message: 'Alert rule not found' });
    }
    await alert.deleteOne();
    res.json({ message: 'Alert rule removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

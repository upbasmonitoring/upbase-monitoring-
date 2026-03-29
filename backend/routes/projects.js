import express from 'express';
import Project from '../models/Project.js';
import Monitor from '../models/Monitor.js';
import MonitorLog from '../models/MonitorLog.js';
import ApiKey from '../models/ApiKey.js';
import RequestLog from '../models/RequestLog.js';
import Incident from '../models/Incident.js';
import Deployment from '../models/Deployment.js';
import Insight from '../models/Insight.js';
import HealingLog from '../models/HealingLog.js';
import { protect } from '../middleware/auth.js';
import { getProjectAnalytics } from '../services/analyticsService.js';

const router = express.Router();

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = await Project.create({
      user: req.user.id,
      name,
      description,
    });
    
    res.status(201).json(project);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Project with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get project details
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update project settings
// @route   PATCH /api/projects/:id
// @access  Private
router.patch('/:id', protect, async (req, res) => {
  try {
    const { name, description, healingConfig } = req.body;
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (name) project.name = name;
    if (description) project.description = description;
    if (healingConfig) project.healingConfig = healingConfig;
    
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const projectId = project._id;
    
    // 1. Find all monitors for this project
    const monitors = await Monitor.find({ project: projectId });
    const monitorIds = monitors.map(m => m._id);
    
    // 2. Cleanup monitor-specific data
    await MonitorLog.deleteMany({ monitor: { $in: monitorIds } });
    await Incident.deleteMany({ monitor: { $in: monitorIds } });
    await Deployment.deleteMany({ monitor: { $in: monitorIds } });
    await Insight.deleteMany({ monitor: { $in: monitorIds } });
    await HealingLog.deleteMany({ monitor: { $in: monitorIds } });
    
    // 3. Cleanup project-specific data
    await Monitor.deleteMany({ project: projectId });
    await ApiKey.deleteMany({ project: projectId });
    await RequestLog.deleteMany({ project: projectId });
    
    // 4. Finally delete the project
    await project.deleteOne();
    
    res.json({ message: 'Project and all associated nodes decommissioned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get project analytics
// @route   GET /api/projects/:id/analytics
// @access  Private
router.get('/:id/analytics', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const range = req.query.range || '24h';
    const monitorId = req.query.monitorId || null;
    const analytics = await getProjectAnalytics(project._id, range, monitorId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

import Monitor from '../models/Monitor.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Onboard a site from an external SDK/API call
 * @route   POST /api/external/site
 * @access  Private (API Key required)
 */
export const registerExternalSite = asyncHandler(async (req, res) => {
  const { url, repo, name } = req.body;

  if (!url) {
    res.status(400);
    throw new Error('Target URL is required for monitoring');
  }

  // 1. Check if monitor already exists for this project
  const existingMonitor = await Monitor.findOne({ 
    url, 
    user: req.user._id,
    project: req.project // Project captured from API Key middleware
  });

  if (existingMonitor) {
    return res.status(200).json({
       success: true,
       message: 'Site already under Sentinel surveillance',
       monitor: existingMonitor
    });
  }

  // 2. Create New Sentinel Node
  const monitor = await Monitor.create({
    user: req.user._id,
    project: req.project,
    name: name || url.replace(/^https?:\/\//, '').split('/')[0],
    url,
    githubRepo: {
        repo: repo || null,
        branch: 'main'
    },
    status: 'PENDING',
    interval: 30 // Default 30s as per Phase 5
  });

  res.status(201).json({
    success: true,
    message: 'Site onboarded to Autonomous Monitoring',
    monitorId: monitor._id
  });
});

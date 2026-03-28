import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Monitor from '../models/Monitor.js';

const router = express.Router();

// ─── Step 0: Get GitHub OAuth URL — Needed for frontend redirects ───
// @route GET /api/github/url
// @access Private
router.get('/url', protect, (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GITHUB_REDIRECT_URI);
  const state = encodeURIComponent(req.user.id);
  const scope = 'repo,read:user';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  res.json({ url: githubAuthUrl });
});

// ─── Step 1: Redirect user to GitHub OAuth ──────────────────────────
// @route GET /api/github/connect
// @access Private
router.get('/connect', protect, (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GITHUB_REDIRECT_URI);
  // Store userId in state so we can link account after callback
  const state = encodeURIComponent(req.user.id);
  const scope = 'repo,read:user';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  res.redirect(githubAuthUrl);
});

// ─── Step 2: GitHub OAuth Callback ──────────────────────────────────
// @route GET /api/github/callback
// @access Public (GitHub redirects here)
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const userId = decodeURIComponent(state);

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?github=error`);
    }

    // Get GitHub username
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const githubUsername = userResponse.data.login;

    // Save token & username to user account
    await User.findByIdAndUpdate(userId, {
      'github.accessToken': access_token,
      'github.username': githubUsername,
      'github.connectedAt': new Date()
    });

    console.log(`[GITHUB] Connected: ${githubUsername} for user ${userId}`);
    res.redirect(`${process.env.FRONTEND_URL}/settings?github=connected&user=${githubUsername}`);

  } catch (err) {
    console.error('[GITHUB] OAuth callback error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/settings?github=error`);
  }
});

// ─── Step 3: Get GitHub connection status ───────────────────────────
// @route GET /api/github/status
// @access Private
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+github.accessToken');
    res.json({
      connected: !!user.github?.accessToken,
      username: user.github?.username || null,
      connectedAt: user.github?.connectedAt || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Step 4: List user's GitHub repos ───────────────────────────────
// @route GET /api/github/repos
// @access Private
router.get('/repos', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+github.accessToken');
    if (!user.github?.accessToken) {
      return res.status(400).json({ message: 'GitHub not connected. Please connect first.' });
    }

    const response = await axios.get('https://api.github.com/user/repos?per_page=50&sort=updated', {
      headers: { Authorization: `Bearer ${user.github.accessToken}` }
    });

    const repos = response.data.map(r => ({
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      private: r.private,
      defaultBranch: r.default_branch,
      updatedAt: r.updated_at,
      url: r.html_url
    }));

    res.json(repos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Step 5: Link a repo to a monitor and setup webhooks ────────────
// @route POST /api/github/link/:monitorId
// @access Private
router.post('/link/:monitorId', protect, async (req, res) => {
  try {
    const { owner, repo, branch, deployUrl, projectPath } = req.body;

    if (!owner || !repo || !deployUrl) {
      return res.status(400).json({ message: 'owner, repo, and deployUrl are required' });
    }

    const user = await User.findById(req.user.id).select('+github.accessToken');
    if (!user.github?.accessToken) {
        return res.status(401).json({ message: 'GitHub not connected' });
    }

    const monitor = await Monitor.findOne({ _id: req.params.monitorId, user: req.user.id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

    // Generate a unique secret for this webhook
    const webhookSecret = crypto.randomBytes(20).toString('hex');
    const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/github`;

    let webhookId = null;

    try {
        // Call GitHub API to create a webhook
        const ghResponse = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/hooks`,
            {
                name: 'web',
                active: true,
                events: ['push', 'deployment', 'deployment_status', 'check_run'],
                config: {
                    url: webhookUrl,
                    content_type: 'json',
                    secret: webhookSecret,
                    insecure_ssl: '0'
                }
            },
            {
                headers: { 
                    Authorization: `Bearer ${user.github.accessToken}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        webhookId = ghResponse.data.id;
        console.log(`[GITHUB] Webhook ${webhookId} created for ${owner}/${repo}`);
    } catch (ghErr) {
        console.error('[GITHUB] Webhook creation failed:', ghErr.response?.data?.message || ghErr.message);
        // We continue even if webhook fails (maybe it already exists or perm issue)
    }

    monitor.githubRepo = {
      owner,
      repo,
      branch: branch || 'main',
      deployUrl,
      projectPath: projectPath || null,
      webhookId,
      webhookSecret,
      linked: true
    };

    await monitor.save();

    res.json({
      success: true,
      message: `Repo ${owner}/${repo} linked and webhooks ${webhookId ? 'established' : 'pending'}`,
      githubRepo: monitor.githubRepo
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Step 6: Unlink GitHub from account ─────────────────────────────
// @route DELETE /api/github/disconnect
// @access Private
router.delete('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      'github.accessToken': null,
      'github.username': null,
      'github.connectedAt': null
    });
    res.json({ success: true, message: 'GitHub disconnected successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Step 7: Get linked repo info for a monitor ─────────────────────
// @route GET /api/github/link/:monitorId
// @access Private
router.get('/link/:monitorId', protect, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.monitorId, user: req.user.id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    res.json({ githubRepo: monitor.githubRepo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Integration from '../models/Integration.js';
import axios from 'axios';
import { sendAlertEmail } from '../utils/mailer.js';
import { getWhatsAppStatus, disconnectWhatsApp } from '../services/whatsappService.js';

import Project from '../models/Project.js';

// Helper to find authorized project
const getProject = async (req, res) => {
    const projectId = req.headers['x-project-id'] || req.query.projectId || req.body.projectId;
    if (!projectId) {
        res.status(400).json({ message: 'Project ID is required' });
        return null;
    }
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) {
        res.status(404).json({ message: 'Project not found or unauthorized' });
        return null;
    }
    return project;
};

const router = express.Router();

// ==========================================
// 🐙 GitHub OAuth Integration (Module 7)
// ==========================================

// @desc    Initiate GitHub OAuth
// @route   GET /api/integrations/github/auth
router.get('/github/auth', protect, async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required for GitHub auth' });
  }

  const rootUrl = 'https://github.com/login/oauth/authorize';
  const options = {
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/api/integrations/github/callback`,
    scope: 'repo,admin:repo_hook',
    state: `${req.user.id}:${projectId}`, // Pass both to callback
  };

  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
});

// @desc    GitHub OAuth Callback
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const [userId, projectId] = (state || '').split(':');

  if (!code || !userId || !projectId) {
    return res.status(400).json({ message: 'Authorization code or project context missing' });
  }

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = response.data;
    if (!access_token) return res.status(400).json({ message: 'Failed to obtain access token' });

    // Save token to PROJECT integrations
    const project = await Project.findOne({ _id: projectId, user: userId });
    if (project) {
      if (!project.integrations) project.integrations = {};
      project.integrations.githubToken = access_token;
      project.markModified('integrations');
      await project.save();
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/integrations?success=github&projectId=${projectId}`);
  } catch (error) {
    console.error('GitHub Auth Error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/integrations?error=github_auth_failed`);
  }
});

// ==========================================
// 🛠️ Legacy & Miscellaneous Integrations
// ==========================================

// @desc    Get WhatsApp engine status & QR
router.get('/status/whatsapp', protect, async (req, res) => {
  const project = await getProject(req, res);
  if (!project) return;

  const status = getWhatsAppStatus(project._id.toString());
  
  res.json({
      ...status
  });
});

// @desc    Get all active integrations for a specific project
router.get('/', protect, async (req, res) => {
  try {
    const project = await getProject(req, res);
    if (!project) return;
    
    res.json({ integrations: project.integrations || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update or create an integration for a project
router.post('/:provider', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    const { webhookUrl, enabled, config, phone, whatsapp } = req.body;
    
    const project = await getProject(req, res);
    if (!project) return;

    if (!project.integrations) project.integrations = {};
    const p = provider.toLowerCase();

    if (p === 'github') {
        const { accessToken, username, repo } = req.body;
        const rawRepo = repo || username;
        // 🧱 ANTI-SPACE SANITIZATION: Remove ALL whitespace from the path
        const targetRepo = rawRepo?.replace(/\s+/g, "")?.replace(/\/$/, ""); 
        const token = accessToken?.trim();
        
        if (!token || !targetRepo) {
            return res.status(400).json({ message: 'GitHub Token and Repository (owner/repo) are required' });
        }

        try {
            console.log(`[GITHUB-VCS] 🛡️ VERIFYING TOKEN VALIDITY...`);
            // 🛡️ PHASE 1: Verify TOKEN is real
            const tokenCheck = await axios.get(`https://api.github.com/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'Upbase-Monitoring-Engine'
                }
            });

            if (!tokenCheck.data.login) {
                return res.status(401).json({ message: "GitHub Error: Token is invalid or expired." });
            }

            console.log(`[GITHUB-VCS] 👤 Token belongs to: ${tokenCheck.data.login}. Proceeding to Repo lookup...`);

            // 🛡️ PHASE 2: Verify REPO & PERMISSIONS
            console.log(`[GITHUB-VCS] 🛡️ Looking for: ${targetRepo}`);
            const repoCheck = await axios.get(`https://api.github.com/repos/${targetRepo}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Upbase-Monitoring-Engine'
                }
            });

            if (repoCheck.status === 200) {
                if (!project.integrations) project.integrations = {};
                project.integrations.githubToken = token;
                project.integrations.githubRepo = targetRepo;
                project.integrations.githubEnabled = true;

                project.markModified('integrations');
                await project.save();
                
                console.log(`[GITHUB-VCS] ✅ Verified & Linked: ${targetRepo} to Project: ${project._id}`);
                return res.json({ 
                    success: true, 
                    message: `Verified: Connected to @${tokenCheck.data.login} | ${targetRepo}`, 
                    integrations: project.integrations 
                });
            }
        } catch (err) {
            console.error(`[GITHUB-VCS] ❌ Handshake Failed:`, err.response?.data || err.message);
            const status = err.response?.status;
            
            // If we got here during PHASE 1 (User endpoint)
            if (err.config?.url?.includes('/user')) {
                return res.status(401).json({ message: "GitHub Error: Provided Personal Access Token (PAT) is invalid." });
            }

            // If we got here during PHASE 2 (Repo endpoint)
            if (status === 404) {
                return res.status(400).json({ 
                    message: `GitHub Error: Repo '${targetRepo}' not found. Ensure it is correct and your Token has the 'repo' scope checked in GitHub Settings.` 
                });
            }
            if (status === 401) return res.status(401).json({ message: "GitHub Error: Token authentication failed." });
            
            return res.status(status || 500).json({ 
                message: `GitHub Handshake Error: ${err.response?.data?.message || err.message}` 
            });
        }
    }

    if (p === 'discord') project.integrations.discordWebhook = webhookUrl;
    else if (p === 'slack') project.integrations.slackWebhook = webhookUrl;
    else if (p === 'webhook') project.integrations.customWebhook = webhookUrl;
    else if (p === 'pagerduty') project.integrations.pagerdutyWebhook = webhookUrl;
    else if (p === 'email') {
        if (enabled !== undefined) project.integrations.emailAlerts = enabled;
        else project.integrations.emailAlerts = true;
        // Persist the custom destination email if provided
        if (req.body.alertEmail !== undefined) {
            project.integrations.alertEmail = req.body.alertEmail?.trim() || null;
        }
    }
    else if (p === 'sms') {
         project.integrations.smsAlerts = enabled !== undefined ? enabled : true;
         if (phone) project.integrations.phone = phone;
    } else if (p === 'call') {
         project.integrations.callAlerts = enabled !== undefined ? enabled : true;
         if (phone) project.integrations.phone = phone;
    } else if (p === 'whatsapp') {
         project.integrations.whatsappAlerts = enabled !== undefined ? enabled : true;
         if (whatsapp) project.integrations.whatsapp = whatsapp;
    } else if (p === 'kerberos') {
         project.integrations.kerberosConfig = {
             enabled: enabled !== undefined ? enabled : true,
             realm: config?.realm || 'KRB5.ENTERPRISE.INTERNAL',
             kdc: config?.kdc || 'kdc.enterprise.internal'
         };
    }

    project.markModified('integrations');
    await project.save();

    res.json({ 
        success: true,
        message: `${provider} integration saved to project`, 
        integrations: project.integrations 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Test an active integration for a project
router.post('/:provider/test', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    const project = await getProject(req, res);
    if (!project) return;

    if (!project.integrations) {
        return res.status(400).json({ message: 'No integrations configured for this project' });
    }

    const p = provider.toLowerCase();
    let url;
    let payload;

    if (p === 'discord') {
        url = project.integrations.discordWebhook;
        payload = {
            content: "🔔 **Upbase Monitoring Test**\nThis is a test alert from your dashboard. Your Discord integration is properly configured for this project!",
        };
    } else if (p === 'slack') {
        url = project.integrations.slackWebhook;
        payload = {
            text: "🔔 *Upbase Monitoring Test*\nThis is a test alert from your dashboard. Your Slack integration is ready!",
        };
    } else if (p === 'webhook' || p === 'pagerduty') {
        url = p === 'webhook' ? project.integrations.customWebhook : project.integrations.pagerdutyWebhook;
        payload = {
            event: "test_heartbeat",
            source: "Upbase Dashboard",
            message: `External ${p} test successful.`,
            timestamp: new Date().toISOString()
        };
    } else if (p === 'email') {
        // Fallback to user email for destination
        const user = await User.findById(req.user.id);
        await sendAlertEmail(
            user.email, 
            "Upbase: Integration Test Successful", 
            "This is a test email from your Upbase dashboard. Your project alert system is active."
        );
        return res.json({ message: `Test email sent to ${user.email} successfully!` });
    }

    if (!url && p !== 'email' && p !== 'kerberos') {
        return res.status(400).json({ message: `No URL configured for ${provider}` });
    }

    if (url) {
        try {
            await axios.post(url, payload);
        } catch(err) {
            return res.status(400).json({ 
                success: false,
                message: `${provider} test failed. API returned: ${err.response?.status || 'Connection Error'}.` 
            });
        }
    }

    res.json({ message: `Test notification sent to ${provider} successfully!` });
  } catch (error) {
    res.status(500).json({ message: `Integration error: ${error.message}` });
  }
});

// @desc    Delete/Disconnect an integration from a project
router.delete('/:provider', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    const project = await getProject(req, res);
    if (!project) return;
    
    if (project.integrations) {
        const p = provider.toLowerCase();
        if (p === 'discord') project.integrations.discordWebhook = null;
        else if (p === 'slack') project.integrations.slackWebhook = null;
        else if (p === 'webhook') project.integrations.customWebhook = null;
        else if (p === 'pagerduty') project.integrations.pagerdutyWebhook = null;
        else if (p === 'email') project.integrations.emailAlerts = false;
        else if (p === 'whatsapp') {
            project.integrations.whatsappAlerts = false;
            // Actually destroy the session & reset QR globally
            await disconnectWhatsApp(project._id.toString());
            console.log(`[WHATSAPP-DISCONNECT] Hub link severed by project: ${project._id}`);
        }
        
        project.markModified('integrations');
        await project.save();
    }

    res.json({ message: `${provider} integration disconnected from project`, integrations: project.integrations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

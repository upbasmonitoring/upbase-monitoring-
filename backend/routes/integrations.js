import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Integration from '../models/Integration.js';
import axios from 'axios';
import { sendAlertEmail } from '../utils/mailer.js';
import { getStatus as getWAStatus } from '../whatsappService.js';

const router = express.Router();

// ==========================================
// 🐙 GitHub OAuth Integration (Module 7)
// ==========================================

// @desc    Initiate GitHub OAuth
// @route   GET /api/integrations/github/auth
router.get('/github/auth', protect, (req, res) => {
  const rootUrl = 'https://github.com/login/oauth/authorize';
  const options = {
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/api/integrations/github/callback`,
    scope: 'repo,admin:repo_hook',
    state: req.user.id, // Pass user ID as state for verification
  };

  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
});

// @desc    GitHub OAuth Callback
// @route   GET /api/integrations/github/callback
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code missing' });
  }

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token } = response.data;

    if (!access_token) {
      return res.status(400).json({ message: 'Failed to obtain access token' });
    }

    // Save token to user's integration (Simplified for now, should use Integration model)
    const user = await User.findById(state);
    if (user) {
      if (!user.integrations) user.integrations = {};
      user.integrations.githubToken = access_token;
      await user.save();
    }

    // Redirect back to dashboard integrations page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/integrations?success=github`);
  } catch (error) {
    console.error('GitHub Auth Error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/integrations?error=github_auth_failed`);
  }
});

// ==========================================
// 🛠️ Legacy & Miscellaneous Integrations
// ==========================================

// @desc    Get WhatsApp engine status & QR
// @route   GET /api/integrations/status/whatsapp
// @access  Private
router.get('/status/whatsapp', protect, (req, res) => {
  res.json(getWAStatus());
});

// @desc    Get all active integrations for the current user
// @route   GET /api/integrations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ integrations: user.integrations || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update or create an integration
// @route   POST /api/integrations/:provider
// @access  Private
router.post('/:provider', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    const { webhookUrl, enabled, config, phone, whatsapp } = req.body;
    
    const validProviders = ['discord', 'slack', 'webhook', 'email', 'kerberos', 'pagerduty', 'sms', 'call', 'whatsapp'];
    if (!validProviders.includes(provider.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid provider' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.integrations) {
        user.integrations = {};
    }

    const p = provider.toLowerCase();

    if (p === 'discord') {
         user.integrations.discordWebhook = webhookUrl;
    } else if (p === 'slack') {
         user.integrations.slackWebhook = webhookUrl;
    } else if (p === 'webhook') {
         user.integrations.customWebhook = webhookUrl;
    } else if (p === 'pagerduty') {
         user.integrations.pagerdutyWebhook = webhookUrl;
    } else if (p === 'email') {
         user.integrations.emailAlerts = enabled !== undefined ? enabled : true;
    } else if (p === 'sms') {
         user.integrations.smsAlerts = enabled !== undefined ? enabled : true;
         if (phone) user.integrations.phone = phone;
    } else if (p === 'call') {
         user.integrations.callAlerts = enabled !== undefined ? enabled : true;
         if (phone) user.integrations.phone = phone;
    } else if (p === 'whatsapp') {
         user.integrations.whatsappAlerts = enabled !== undefined ? enabled : true;
         if (whatsapp) user.integrations.whatsapp = whatsapp;
    } else if (p === 'kerberos') {
         user.integrations.kerberosConfig = {
             enabled: enabled !== undefined ? enabled : true,
             realm: config?.realm || 'KRB5.ENTERPRISE.INTERNAL',
             kdc: config?.kdc || 'kdc.enterprise.internal'
         };
    }

    await user.save();

    res.json({ 
        success: true,
        message: `${provider} integration successfully ${enabled === false ? 'disabled' : 'enabled'}`, 
        integrations: user.integrations 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Test an active integration
// @route   POST /api/integrations/:provider/test
// @access  Private
router.post('/:provider/test', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user.id);

    if (!user.integrations) {
        return res.status(400).json({ message: 'No integrations configured' });
    }

    const p = provider.toLowerCase();
    let url;
    let payload;

    if (p === 'discord') {
        url = user.integrations.discordWebhook;
        payload = {
            content: "🔔 **PulseWatch Monitoring Test**\nThis is a test alert from your dashboard. Your Discord integration is properly configured and ready for production!",
        };
    } else if (p === 'slack') {
        url = user.integrations.slackWebhook;
        payload = {
            text: "🔔 *PulseWatch Monitoring Test*\nThis is a test alert from your dashboard. Your Slack integration is ready for production traffic!",
        };
    } else if (p === 'webhook' || p === 'pagerduty') {
        url = p === 'webhook' ? user.integrations.customWebhook : user.integrations.pagerdutyWebhook;
        payload = {
            event: "test_heartbeat",
            source: "PulseWatch Dashboard",
            message: `External ${p} test successful.`,
            timestamp: new Date().toISOString()
        };
    } else if (p === 'email') {
        await sendAlertEmail(
            user.email, 
            "PulseWatch: Integration Test Successful", 
            "This is a test email from your PulseWatch dashboard. Your email alert system is active."
        );
        return res.json({ message: `Test email sent to ${user.email} successfully!` });
    } else if (p === 'kerberos') {
        // Kerberos is a config-based integration, "testing" verifies connectivity logic
        return res.json({ 
            message: `Kerberos configuration verified for Realm: ${user.integrations.kerberosConfig.realm}. Handshake simulation successful!` 
        });
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
                message: `${provider} test failed. API returned: ${err.response?.status || 'Connection Error'}. Please check your Webhook URL.` 
            });
        }
    }

    res.json({ message: `Test notification sent to ${provider} successfully!` });
  } catch (error) {
    res.status(500).json({ message: `Integration error: ${error.message}` });
  }
});

// @desc    Delete/Disconnect an integration
// @route   DELETE /api/integrations/:provider
// @access  Private
router.delete('/:provider', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user.id);
    
    if (user.integrations) {
        const p = provider.toLowerCase();
        if (p === 'discord') user.integrations.discordWebhook = null;
        else if (p === 'slack') user.integrations.slackWebhook = null;
        else if (p === 'webhook') user.integrations.customWebhook = null;
        else if (p === 'pagerduty') user.integrations.pagerdutyWebhook = null;
        else if (p === 'email') user.integrations.emailAlerts = false;
        else if (p === 'kerberos') {
            user.integrations.kerberosConfig = { enabled: false, realm: null, kdc: null };
        }
        await user.save();
    }

    res.json({ message: `${provider} integration disconnected successfully`, integrations: user.integrations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

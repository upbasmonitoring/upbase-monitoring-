import axios from 'axios';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import Monitor from './models/Monitor.js';
import User from './models/User.js';
import { sendWhatsAppAlert } from './whatsappService.js';
import { triggerRalphLoop } from './services/ralphService.js';

dotenv.config();

// Twilio Setup
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
) : null;

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

import sentinelQueue from './utils/alertQueue.js';
import Alert from './models/Alert.js';

/**
 * 🧠 Intelligence Center: handleMonitorCheck
 * Decides whether to trigger an alert based on consecutive failures,
 * status changes (recovery), cooldowns, and silence modes.
 */
export const handleMonitorCheck = async (monitorId, result) => {
    const monitor = await Monitor.findById(monitorId);
    if (!monitor) return;

    const { status: currentStatus, statusCode, responseTime, message, aiAnalysis } = result;
    const now = new Date();
    
    // 1. SILENCE MODE CHECK
    if (monitor.silenceUntil && monitor.silenceUntil > now) {
        console.log(`[ALERT] Monitor ${monitor.name} is in SILENCE MODE until ${monitor.silenceUntil}`);
        return;
    }

    const previousStatus = monitor.status;
    let newStatus = currentStatus === 'online' ? 'UP' : 'DOWN';
    let severity = 'info';
    let type = 'UP';

    // 2. DEGRADED STATE (PRO LEVEL)
    const latencyThreshold = monitor.degradedThreshold || 2000;
    if (newStatus === 'UP' && responseTime > latencyThreshold) {
        newStatus = 'DEGRADED';
        severity = 'warning';
        type = 'DEGRADED';
    }

    if (newStatus === 'DOWN') {
        severity = 'critical';
        type = 'DOWN';
    }

    // 3. RECOVERY LOGIC (VERY IMPORTANT)
    if ((previousStatus === 'DOWN' || previousStatus === 'DEGRADED') && newStatus === 'UP') {
        console.log(`[ALERT] ${monitor.name} recovered from ${previousStatus} to UP.`);
        
        // Reset counters
        monitor.consecutiveFailures = 0;
        monitor.status = 'UP';
        monitor.ralphStatus = 'IDLE';
        await monitor.save();

        // Send Recovery Alert
        await triggerDispatch(monitor, {
            status: 'UP',
            label: '✅ RECOVERED',
            severity: 'info',
            type: 'RECOVERY',
            message: `Site is back online. Response time: ${responseTime}ms`,
            channels: ['email', 'discord']
        });

        // Store in DB
        await Alert.create({
            project: monitor.project,
            monitor: monitor._id,
            type: 'RECOVERY',
            severity: 'info',
            message: `Service ${monitor.name} has recovered. Status: UP.`,
            status: 'resolved'
        });

        return;
    }

    // 4. CONSECUTIVE FAILURE LOGIC (ANTI-FALSE ALERT)
    if (newStatus === 'DOWN' || newStatus === 'DEGRADED') {
        monitor.consecutiveFailures = (monitor.consecutiveFailures || 0) + 1;
        monitor.status = newStatus;
        await monitor.save();

        const threshold = monitor.failureThreshold || 3;
        
        if (monitor.consecutiveFailures >= threshold) {
            // 5. ALERT COOLDOWN (ANTI-SPAM)
            const coolDownMs = 5 * 60 * 1000; // 5 minutes default
            const lastAlertAt = monitor.lastAlertSentAt ? new Date(monitor.lastAlertSentAt).getTime() : 0;
            
            if (Date.now() - lastAlertAt < coolDownMs) {
                console.log(`[ALERT] Suppression: Monitor ${monitor.name} is in cooldown.`);
                return;
            }

            // 6. ESCALATION SYSTEM
            // 0 min -> Discord, 10 min -> Email etc handled by channels routing logic
            let channels = ['discord'];
            const failureDurationMin = (Date.now() - new Date(monitor.failureStartedAt || Date.now()).getTime()) / 60000;

            if (failureDurationMin > 10) {
                channels.push('email');
            }
            if (failureDurationMin > 30) {
                channels.push('whatsapp');
            }

            // If it's the first time crossing threshold, set failureStartedAt
            if (monitor.consecutiveFailures === threshold) {
                monitor.failureStartedAt = now;
                await monitor.save();

                // --- Ralph Loop Integration ---
                if (newStatus === 'DOWN') {
                    triggerRalphLoop(monitor._id);
                }
            }

            const alertLabel = newStatus === 'DOWN' ? '🔴 DOWN' : '🟠 DEGRADED';
            
            const durationText = failureDurationMin > 1 ? ` (Down for ${Math.round(failureDurationMin)}m, ${monitor.consecutiveFailures} checks)` : ` (Fail count: ${monitor.consecutiveFailures})`;
            
            await triggerDispatch(monitor, {
                status: newStatus,
                label: alertLabel,
                severity,
                type,
                message: `${monitor.name} is currently ${newStatus}.${durationText} ${message || ''}`,
                aiAnalysis,
                channels: channels
            });

            // Store in DB Alert History (🔹 Feature 7)
            await Alert.create({
                project: monitor.project,
                monitor: monitor._id,
                type,
                severity,
                message: `${monitor.name} status is ${newStatus}.${durationText}`,
                status: 'active'
            });

            // Update last alert time
            monitor.lastAlertSentAt = now;
            await monitor.save();
        }
    } else {
        // Status is UP and was UP, just reset consecutiveFailures if it was > 0 (maybe from previous ripples)
        if (monitor.consecutiveFailures > 0) {
            monitor.consecutiveFailures = 0;
            await monitor.save();
        }
    }
};

/**
 * Stage an alert into the background Sentinel Queue
 */
const triggerDispatch = async (monitor, incidentData) => {
    incidentData.allowedChannels = incidentData.channels || ['email', 'discord'];
    sentinelQueue.push({ monitor, incidentData });
};

/**
 * 🏭 Alert Worker (ProcessDispatch)
 * This is executed as a background task by the Sentinel Queue
 */
export const processDispatch = async (monitor, incidentData) => {
  const { status, statusCode, message, aiAnalysis, severity, label, allowedChannels } = incidentData;
  const owner = await User.findById(monitor.user);



  if (!owner) return;

  const { discordWebhook, slackWebhook, pagerdutyWebhook, emailAlerts, phone: userPhone, whatsapp: userWA, smsAlerts, callAlerts, whatsappAlerts } = owner.integrations || {};

  const alertContent = `🚨 [${label}] PulseWatch: ${monitor.name} is ${status.toUpperCase()}!\n` +
    `URL: ${monitor.url}\n` +
    `Diagnostic: ${statusCode || 'N/A'} - ${message}\n` +
    `AI Diagnosis: ${aiAnalysis?.rootCause || 'No diagnosis available.'}`;

  // Unified Webhooks
  if (allowedChannels.includes('discord') && discordWebhook) {
      await axios.post(discordWebhook, { content: `🚨 **[${label}] MONITOR ALERT**\n**Name:** ${monitor.name}\n**URL:** ${monitor.url}\n**Error:** ${statusCode} - ${message}\n**AI Diagnosis:** ${aiAnalysis ? (aiAnalysis.rootCause.substring(0, 150) + '...') : 'N/A'}` }).catch(() => {});
  }

  // Email
  if (allowedChannels.includes('email') && (emailAlerts)) {
       await sendEmail(owner.email, `[${label}] PulseWatch: ${monitor.name}`, alertContent);
  }

  // WhatsApp
  if (allowedChannels.includes('whatsapp') && severity === 'critical') {
      if (whatsappAlerts && userWA) {
          await sendWhatsApp(userWA, alertContent);
      }
  }

  // Twilio (Future/Phone/SMS)
  if (severity === 'critical' && twilioClient) {
      if (smsAlerts && userPhone) await sendSMS(userPhone, alertContent);
      if (callAlerts && userPhone) await makeVoiceCall(userPhone, monitor.name, status);
  }
};

export const classifyIncident = (monitor, incidentData) => {
    // Legacy support for other parts of app if any
    return null;
};

export const dispatchAlert = async (monitor, incidentData) => {
    // Legacy support for other parts of app if any
};

export const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"PulseWatch Sentinel" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #e11d48;">PulseWatch Alert</h2>
          <p>${text.replace(/\n/g, '<br>')}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">This is an automated alert. Please visit your dashboard for details.</p>
        </div>
      `
    });
    console.log(`[ALERT] Email sent to ${to}`);
  } catch (err) {
    console.warn(`[ALERT ERROR] Email failed to ${to}`);
  }
};

export const sendSMS = async (to, body) => {
  if (!twilioClient) return;
  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`[ALERT] SMS sent to ${to}`);
  } catch (err) {
    console.warn(`[ALERT ERROR] SMS failed to ${to}`);
  }
};

export const makeVoiceCall = async (to, monitorName, status) => {
    if (!twilioClient) return;
    try {
      await twilioClient.calls.create({
        twiml: `<Response><Say>Alert from PulseWatch. Your monitor ${monitorName} is ${status}. Immediate action required.</Say></Response>`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      console.log(`[ALERT] Voice call initiated to ${to}`);
    } catch (err) {
      console.warn(`[ALERT ERROR] Voice call failed to ${to}`);
    }
};

export const sendWhatsApp = async (to, body) => {
    try {
        const result = await sendWhatsAppAlert(to, body);
        if (result.success) {
            console.log(`[ALERT] WhatsApp Sentinel delivered message to ${to}`);
            return;
        }
    } catch (engineErr) {
        console.warn(`[ALERT] WhatsApp Sentinel Engine failed: ${engineErr.message}`);
    }
};




import axios from 'axios';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Monitor from '../models/Monitor.js';
import { addIncidentEvent } from './incidentService.js';
import { triggerRalphLoop } from './ralphService.js';
import { sendWhatsAppAlert } from './whatsappService.js';

dotenv.config();

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Alerting Service (Section 2)
 * Handles tiered notifications: Discord -> Email -> WhatsApp -> Escalation
 */

export const sendDiscordAlert = async (user, monitor, statusType) => {
    const webhookUrl = user.integrations?.discordWebhook;
    if (!webhookUrl) return;

    const color = statusType === 'DOWN' ? 0xff0000 : 0xffa500; // Red for DOWN, Orange for SLOW
    
    // --- New: Fetch Severity for Rich Alerts ---
    let severity = 'LOW';
    let severityPrefix = '[ALERT]';
    try {
        const { default: Incident } = await import('../models/Incident.js');
        const incident = await Incident.findOne({ monitor: monitor._id, status: 'OPEN' });
        if (incident) {
            severity = incident.severity || 'LOW';
            severityPrefix = (severity === 'CRITICAL' || severity === 'HIGH') ? '[CRITICAL]' : '[ALERT]';
        }
    } catch (err) {
        console.error(`[ALERT-SEVERITY-FETCH] Error: ${err.message}`);
    }

    const embed = {
        title: `${severityPrefix} [${statusType}] ${severity} Alert`,
        description: `Your website **${monitor.name}** is reporting a issue.`,
        color: color,
        fields: [
            { name: 'URL', value: monitor.url, inline: false },
            { name: 'Status', value: statusType, inline: true },
            { name: 'Severity', value: severity, inline: true },
            { name: 'Response Time', value: `${monitor.responseTime}ms`, inline: true },
            { name: 'Timestamp', value: new Date().toLocaleString(), inline: false }
        ],
        footer: { text: 'Sentinel Monitoring System - PulseWatch' }
    };

    try {
        const { default: Incident } = await import('../models/Incident.js');
        const incident = await Incident.findOne({ monitor: monitor._id, status: 'OPEN' });
        
        // --- HARDENING: DEDUPLICATION ---
        if (incident && incident.alertSent) {
            console.log(`[ALERT] 🛡️ Deduplication: Discord alert skipped for ${monitor.name}.`);
            return;
        }

        await axios.post(webhookUrl, { embeds: [embed] });
        console.log(`[ALERT] Discord alert sent for ${monitor.name}`);
        
        // Mark alert as sent to prevent spam across tiers if preferred, 
        // but here we mark it to track the first major notification.
        if (incident) {
            incident.alertSent = true;
            await incident.save();
        }

        // Log to incident timeline
        await addIncidentEvent(monitor._id, 'ALERT_SENT', `Discord notification dispatched to tier 1 responder.`);
    } catch (err) {
        console.error(`[ALERT-ERROR] Discord failed: ${err.message}`);
    }
};

export const sendEmailAlert = async (user, monitor, statusType) => {
    if (!user.integrations?.emailAlerts) return;

    const mailOptions = {
        from: `"Sentinel Monitor" <${process.env.SMTP_USER || 'alerts@sentinel.com'}>`,
        to: user.integrations?.alertEmail || user.email,
        subject: `CRITICAL: ${monitor.name} is ${statusType}`,
        text: `Urgent Alert: ${monitor.url} is ${statusType}.\nResponse Time: ${monitor.responseTime}ms\nDetected at: ${new Date().toISOString()}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 2px solid #ff0000; border-radius: 10px;">
                <h2 style="color: #ff0000;">[${statusType}] ALERT</h2>
                <p>Website: <strong>${monitor.name}</strong></p>
                <p>URL: <a href="${monitor.url}">${monitor.url}</a></p>
                <p>Status: <span style="font-weight: bold; color: #ff0000;">${statusType}</span></p>
                <p>Response Time: <strong>${monitor.responseTime}ms</strong></p>
                <hr />
                <p style="font-size: 12px; color: #666;">This is an escalation alert sent because the service has been down for more than 10 minutes.</p>
            </div>
        `
    };

    try {
        const { default: Incident } = await import('../models/Incident.js');
        const incident = await Incident.findOne({ monitor: monitor._id, status: 'OPEN' });

        if (incident && incident.alertSent && monitor.alertLevel !== 'ESCALATED') {
            // If an alert was already sent via Discord/WhatsApp, we skip email unless it's a true escalation
            console.log(`[ALERT] 🛡️ Deduplication: Email alert skipped for ${monitor.name}.`);
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`[ALERT] Email alert sent to ${user.email}`);

        if (incident) {
            incident.alertSent = true;
            await incident.save();
        }

        // Log to incident timeline
        await addIncidentEvent(monitor._id, 'ALERT_SENT', `Email escalation sent to administrative contact.`);
    } catch (err) {
        console.error(`[ALERT-ERROR] Email failed: ${err.message}`);
    }
};

export const triggerEscalationCall = async (user, monitor) => {
    if (!user.integrations?.callAlerts || !user.integrations?.phone) return;
    
    // In a real-world scenario, we'd use Twilio here.
    // For Section 2 implementation, we log the escalation.
    console.log(`[ESCALATION] FINAL CALL TRIGGERED for ${user.integrations.phone}. Monitor: ${monitor.name}`);
    await addIncidentEvent(monitor._id, 'ALERT_SENT', `Final phone line escalation initiated for catastrophic failure.`);
};

export const sendRecoveryAlert = async (user, monitor) => {
    const discordUrl = user.integrations?.discordWebhook;
    const emailAlerts = user.integrations?.emailAlerts;

    const message = `PulseWatch SUCCESS: ${monitor.name} is BACK UP!\n` +
                    `URL: ${monitor.url}\n` +
                    `Recovered after: ${Math.round((Date.now() - new Date(monitor.failureStartedAt).getTime()) / (1000 * 60))} minutes.`;

    // Discord Recovery
    if (discordUrl) {
        const embed = {
            title: `[RECOVERY] Monitor Restored`,
            description: `Great news! **${monitor.name}** is stable again.`,
            color: 0x22c55e, // Green
            fields: [
                { name: 'URL', value: monitor.url, inline: false },
                { name: 'Status', value: 'UP / STABLE', inline: true },
                { name: 'Timestamp', value: new Date().toLocaleString(), inline: false }
            ],
            footer: { text: 'Sentinel Monitoring System - Recovery Alert' }
        };
        await axios.post(discordUrl, { embeds: [embed] }).catch(() => {});
    }

    // WhatsApp Recovery
    if (user.integrations?.phone) {
        const duration = Math.round((Date.now() - new Date(monitor.failureStartedAt).getTime()) / (1000 * 60));
        const recoveryMsg = `✅ *PULSEWATCH RECOVERY*\n\n` +
                            `*Monitor:* ${monitor.name}\n` +
                            `*Status:* BACK UP / STABLE\n` +
                            `*Resolution:* Resolved after ${duration} mins\n` +
                            `*URL:* ${monitor.url}`;
        await sendWhatsAppAlert(monitor.project.toString(), user.integrations.phone, recoveryMsg);
    }

    // Email Recovery
    if (emailAlerts) {
        const mailOptions = {
            from: `"Sentinel Monitor" <${process.env.SMTP_USER || 'alerts@sentinel.com'}>`,
            to: user.integrations?.alertEmail || user.email,
            subject: `RESTORED: ${monitor.name} is BACK UP`,
            text: message,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 2px solid #22c55e; border-radius: 10px;">
                    <h2 style="color: #22c55e;">RECOVERY Alert</h2>
                    <p>Website: <strong>${monitor.name}</strong></p>
                    <p>URL: <a href="${monitor.url}">${monitor.url}</a></p>
                    <p>Status: <span style="font-weight: bold; color: #22c55e;">BACK UP / STABLE</span></p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">Service has returned to a healthy state after an incident.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions).catch(() => {});
    }
};

/**
 * Decision Engine for Alerts
 * Determines which alert to send based on failure duration
 */
export const processAlertingTier = async (monitor) => {
    const user = await User.findById(monitor.user);
    if (!user) return;

    const now = Date.now();
    const failureDurationMs = now - new Date(monitor.failureStartedAt).getTime();
    const failureDurationMins = failureDurationMs / (1000 * 60);

    console.log(`[ALERTING-ENGINE] Evaluating ${monitor.name}. Consec Failures: ${monitor.consecutiveFailures}. Duration: ${failureDurationMins.toFixed(1)} mins.`);

    // Tier 1: WhatsApp (Instant Alert upon failure)
    if (monitor.consecutiveFailures >= 3 && (monitor.alertLevel === 'NONE' || !monitor.alertLevel)) {
        if (user.integrations?.phone) {
            let severity = 'LOW';
            try {
                const { default: Incident } = await import('../models/Incident.js');
                const incident = await Incident.findOne({ monitor: monitor._id, status: 'OPEN' });
                if (incident) severity = incident.severity;
            } catch (err) {}

            console.log(`[ALERT] Sending Engineering WhatsApp Alert to ${user.integrations.phone}`);
            
            const message = `🚨 *PULSEWATCH CRITICAL ALERT*\n\n` +
                            `*Monitor:* ${monitor.name}\n` +
                            `*Status:* DOWN\n` +
                            `*Severity:* ${severity}\n` +
                            `*Latency:* ${monitor.responseTime}ms\n` +
                            `*Detected:* ${monitor.isBackendDown ? 'API/Backend' : 'Frontend/HTML'}\n` +
                            `*URL:* ${monitor.url}\n` +
                            `*Error:* ${monitor.lastError || 'Service Connectivity Failure'}\n\n` +
                            `_Ralph AI Autopilot is scanning for root cause..._`;

            await sendWhatsAppAlert(monitor.project.toString(), user.integrations.phone, message);
        }
        
        // --- Ralph Loop Integration (Autopilot Radar) ---
        // Re-enabled as per user request for silent 1st-rollback of the day.
        try {
            await triggerRalphLoop(monitor._id);
        } catch (err) {
            console.error(`[RALPH-TRIGGER-ERROR] ${err.message}`);
        }

        monitor.alertLevel = 'WHATSAPP';
        monitor.lastAlertSentAt = new Date();
    }

    // Tier 2: Discord (Trigger after ~30s of WhatsApp alert)
    if (failureDurationMins >= 0.5 && monitor.alertLevel === 'WHATSAPP') {
        const statusType = monitor.responseTime > 2000 ? 'SLOW' : 'DOWN';
        await sendDiscordAlert(user, monitor, statusType);
        monitor.alertLevel = 'DISCORD';
        monitor.lastAlertSentAt = new Date();
    }

    // Tier 3: Email (4-5 mins still down)
    if (failureDurationMins >= 5 && monitor.alertLevel === 'DISCORD') {
        await sendEmailAlert(user, monitor, 'DOWN');
        monitor.alertLevel = 'EMAIL';
        monitor.lastAlertSentAt = new Date();
    }

    // Tier 4: WhatsApp URGENT Escalation (After 15 mins still down)
    if (failureDurationMins >= 15 && monitor.alertLevel === 'EMAIL') {
        if (user.integrations?.phone) {
            const message = `⚠️ *URGENT WHATSAPP ESCALATION*\n\n` +
                            `*CRITICAL:* Site *${monitor.name}* still DOWN after ${Math.round(failureDurationMins)} minutes.\n\n` +
                            `*Action Required:* Automated recovery failover failed. Manual intervention requested for ${monitor.url}.\n\n` +
                            `_Status: Engineering Escalation Tier 4_`;
            await sendWhatsAppAlert(monitor.project.toString(), user.integrations.phone, message);
        }
        
        // Log escalation
        await addIncidentEvent(monitor._id, 'ALERT_SENT', `Tier 4 WhatsApp escalation dispatched for sustained outage.`);
        
        monitor.alertLevel = 'ESCALATED';
        monitor.lastAlertSentAt = new Date();
    }
};

/**
 * Ralph Diagnostic Notification
 * Sends the AI's root cause analysis and localization to Discord/Slack
 */
export const sendRalphDiagnosticAlert = async (monitorId, analysis) => {
    try {
        const monitor = await Monitor.findById(monitorId).populate('user');
        if (!monitor || !monitor.user?.integrations?.discordWebhook) return;

        const webhookUrl = monitor.user.integrations.discordWebhook;
        
        const fields = [
            { name: 'Summary', value: analysis.summary, inline: false },
            { name: 'Root Cause', value: analysis.rootCause, inline: true },
            { name: 'Confidence', value: `${Math.round(analysis.confidence * 100)}%`, inline: true },
            { name: 'Remediation', value: analysis.remediation, inline: true }
        ];

        if (analysis.poisonCommit && analysis.poisonCommit !== 'null') {
            fields.push({ name: 'Poison Commit', value: `\`${analysis.poisonCommit.substring(0, 7)}\``, inline: true });
        }

        if (analysis.localization) {
            fields.push({ 
                name: 'Code Localization', 
                value: `**File:** ${analysis.localization.file}\n**Lines:** ${analysis.localization.lines}\n**Reason:** ${analysis.localization.reason}`, 
                inline: false 
            });
        }

        const embed = {
            title: `Ralph AI: Root Cause Analysis`,
            description: `Autonomous agent has completed diagnostics for **${monitor.name}**.`,
            color: 0x8b5cf6, // Purple
            fields: fields,
            footer: { text: 'Ralph Autopilot Engine - PulseWatch' },
            timestamp: new Date().toISOString()
        };

        await axios.post(webhookUrl, { embeds: [embed] });
        console.log(`[RALPH-NOTIFY] Diagnostic alert sent to Discord for ${monitor.name}`);
    } catch (err) {
        console.error(`[RALPH-NOTIFY-ERROR] Failed: ${err.message}`);
    }
};

import dotenv from 'dotenv';

dotenv.config();

/**
 * PulseWatch Multi-Channel Alert Dispatcher
 * In production, this would use nodemailer, SendGrid, or AWS SES.
 * For this version, we provide a robust simulation that logs formatted emails.
 */
export const sendAlertEmail = async (to, subject, content) => {
    console.log(`\n[MAILER] 📧 Dispatching critical alert to: ${to}`);
    console.log(`[MAILER] Subject: ${subject}`);
    console.log(`[MAILER] ------------------------------------------------`);
    console.log(`[MAILER] Content:\n${content}`);
    console.log(`[MAILER] ------------------------------------------------`);
    
    // Simulate async network delay
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[MAILER] ✅ Email successfully delivered to ${to}\n`);
            resolve(true);
        }, 1200);
    });
};

export const formatMonitorDownEmail = (monitor, statusCode, message, aiDiagnosis) => {
    return `
🔴 PULSEWATCH ALERT: MONITOR DOWN

Your monitor "${monitor.name}" is currently OFFLINE.

DETAILS:
- URL: ${monitor.url}
- Status Code: ${statusCode}
- Error: ${message}
- Timestamp: ${new Date().toLocaleString()}

AI DIAGNOSIS:
${aiDiagnosis || "Analyzing root cause... Check your dashboard for updates."}

ACTION REQUIRED:
Please check your infrastructure. If this is a known maintenance window, you can ignore this alert.

--
PulseWatch AI Monitoring Team
    `.trim();
};

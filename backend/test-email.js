import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * High-Fidelity Email Integration Test
 */
const testEmail = async () => {
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = process.env.SMTP_PORT || 587;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_USER || !SMTP_PASS) {
        console.error('\n--- TEST FAILED ---');
        console.error('CRITICAL: SMTP_USER or SMTP_PASS is missing in .env');
        process.exit(1);
    }

    console.log(`[EMAIL-TEST] Connecting to ${SMTP_HOST}:${SMTP_PORT}...`);
    console.log(`[EMAIL-TEST] User: ${SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false, // true for 465, false for 587
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    try {
        console.log('[EMAIL-TEST] Verifying server connection...');
        await transporter.verify();
        console.log('[EMAIL-TEST] Success! Server is ready.');

        const mailOptions = {
            from: `"Up-base Monitor" <${SMTP_USER}>`,
            to: SMTP_USER, // Test with your own email
            subject: "[UP-BASE] Test Alert Successful",
            text: `This is a verification alert sent at ${new Date().toISOString()}.\nYour infrastructure is now fully integrated with our Up-base alerting engine.`,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 2px solid #22c55e; border-radius: 10px;">
                    <h2 style="color: #22c55e;">[SUCCESS] Up-base Integration Live</h2>
                    <p>Congratulations. Your Up-base Monitoring system is now authorized to send critical alerts via Gmail.</p>
                    <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    <hr />
                    <p style="font-size: 11px; color: #666;">Observability Signal Verified via Up-base Engine v4.0</p>
                </div>
            `
        };

        console.log('[EMAIL-TEST] Dispatching payload...');
        const info = await transporter.sendMail(mailOptions);
        console.log('\n--- TARGET REACHED ---');
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Accepted: ${info.accepted}`);
        console.log('--- TEST SUCCESSFUL ---');
        process.exit(0);
    } catch (err) {
        console.error('\n--- TEST FAILED ---');
        console.error(`Error Logic Crash: ${err.message}`);
        if (err.message.includes('Invalid login')) {
            console.error('REASON: Your Google password or App Password is incorrect.');
        }
        process.exit(1);
    }
};

testEmail();

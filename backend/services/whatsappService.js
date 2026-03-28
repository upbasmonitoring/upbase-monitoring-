import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import Monitor from '../models/Monitor.js';
import User from '../models/User.js';

// --- ANTI-BAN HUMAN SIMULATION ENGINE ---
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

let client;
let qrCodeData = null;
let isConnected = false;

const sendHumanLikeMessage = async (chatId, content) => {
    if (!isConnected || !client) {
        console.warn(`[WHATSAPP] Skipping send. Client disconnected.`);
        return;
    }
    try {
        console.log(`[WHATSAPP] Sending Alert to ${chatId}...`);
        
        // --- INSTANT DISPATCH (Ultra-Reliable Mode) ---
        // Bypassing human-like latency for critical monitoring signals.
        const jitterMarkers = ['*', '#', '-', '+', '.', '~'];
        const randomMarker = jitterMarkers[Math.floor(Math.random() * jitterMarkers.length)];
        const uniqueId = Math.random().toString(36).substring(7);
        const finalContent = `${content}\n\n_Ref: [${uniqueId}] ${randomMarker}_`;

        await client.sendMessage(chatId, finalContent);
        console.log(`[WHATSAPP] Message sent to ${chatId}`);
    } catch (err) {
        console.error('[WHATSAPP-DISPATCH-ERR] Final failure:', err.message);
    }
};

export const initWhatsApp = () => {
    try {
        console.log('[UPBASE] Initializing Upbase Monitoring (Anti-Ban Pro Active)...');
        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'sentinel-node',
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                headless: true
            }
        });

        client.on('qr', (qr) => {
            try {
                console.log('[WHATSAPP] New QR Received. Generating Uplink Image...');
                qrcode.toDataURL(qr, (err, url) => {
                    if (err) {
                        console.error('[WHATSAPP-QR-GEN-ERR]', err);
                    } else {
                        qrCodeData = url;
                        console.log('[WHATSAPP] Uplink Image Ready in Memory.');
                    }
                });
            } catch (err) {
                console.error('[WHATSAPP-QR-ERROR]', err.message);
            }
        });

        client.on('ready', () => {
            console.log('[WHATSAPP] Anti-Ban Uplink Ready!');
            isConnected = true;
            qrCodeData = null;
        });

        client.on('authenticated', () => {
            console.log('[WHATSAPP] Authenticated');
        });

        client.on('auth_failure', (msg) => {
            console.error('[WHATSAPP] Auth failure:', msg);
            isConnected = false;
        });

        client.on('disconnected', (reason) => {
            console.log('[WHATSAPP] Disconnected:', reason);
            isConnected = false;
        });

        // Message listener removed as per user request (Only alerts now)

        client.initialize().catch(err => {
            console.error('[WHATSAPP-INIT-FAILED] Initial hook failed, but engine will remain active:', err.message);
        });

    } catch (err) {
        console.error('[WHATSAPP-FATAL] Initialization Sequence Crashed:', err.stack || err.message);
        // Ensure we don't bring down the whole node process
        isConnected = false;
    }
};

export const sendWhatsAppAlert = async (to, message) => {
    if (!isConnected || !client) {
        console.warn(`[WHATSAPP-ALERT] Skipping send. Connected: ${isConnected}`);
        return;
    }
    
    // Normalize number: 9359570497 -> 919359570497@c.us
    let cleanNumber = to.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
    }
    
    const sanitizedTo = cleanNumber + '@c.us';
    console.log(`[WHATSAPP-ALERT] Dispatching to sanitized ID: ${sanitizedTo}`);
    await sendHumanLikeMessage(sanitizedTo, message);
};

export const disconnectWhatsApp = async () => {
    try {
        if (client) {
            console.log('[WHATSAPP] Initiating Logout/Disconnect Sequence...');
            await client.logout();
            await client.destroy();
            isConnected = false;
            qrCodeData = null;
            
            // Re-initialize to generate a fresh QR
            console.log('[WHATSAPP] Re-initializing clean session...');
            initWhatsApp();
            return { success: true, message: 'Disconnected' };
        }
        return { success: false, message: 'No active client' };
    } catch (err) {
        console.error('[WHATSAPP-LOGOUT-ERR]', err.message);
        return { success: false, error: err.message };
    }
};

export const getWhatsAppStatus = () => {
    return {
        isConnected,
        qrCode: qrCodeData
    };
};

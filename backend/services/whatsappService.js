import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

// --- ANTI-BAN HUMAN SIMULATION ENGINE ---
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const clients = new Map();

export const initWhatsApp = (projectId = 'global') => {
    if (clients.has(projectId)) return;

    try {
        console.log(`[UPBASE] Initializing WhatsApp Sentinel for Project ${projectId}...`);
        
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: `sentinel-node-${projectId}`,
                dataPath: `./.wwebjs_auth/${projectId}` // Isolate data per project to avoid locks
            }),
            webVersion: '2.3000.1018905106-alpha', // 🛡️ HIGH STABILITY: Fixed web version to prevent scraper breaks
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js'
            },
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', // Mandatory for Render/Docker/Linux containers
                    '--disable-extensions',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process'
                ],
                headless: true
            }
        });

        const session = {
            client,
            qrCodeData: null,
            isConnected: false
        };
        clients.set(projectId, session);

        client.on('qr', (qr) => {
            try {
                console.log(`[WHATSAPP-${projectId}] New QR Received. Generating Uplink Image...`);
                qrcode.toDataURL(qr, (err, url) => {
                    if (!err) {
                        const s = clients.get(projectId);
                        if (s) s.qrCodeData = url;
                        console.log(`[WHATSAPP-${projectId}] Uplink Image Ready in Memory.`);
                    }
                });
            } catch (err) {}
        });

        client.on('ready', () => {
            console.log(`[WHATSAPP-${projectId}] Anti-Ban Uplink Ready!`);
            const s = clients.get(projectId);
            if (s) {
                s.isConnected = true;
                s.qrCodeData = null;
            }
        });

        client.on('auth_failure', (msg) => {
            console.error(`[WHATSAPP-${projectId}] Auth failure:`, msg);
            const s = clients.get(projectId);
            if (s) s.isConnected = false;
        });

        client.on('disconnected', (reason) => {
            console.log(`[WHATSAPP-${projectId}] Disconnected:`, reason);
            const s = clients.get(projectId);
            if (s) s.isConnected = false;
        });

        client.initialize().catch(err => {
            console.error(`[WHATSAPP-INIT-FAILED-${projectId}]`, err.message);
        });

    } catch (err) {
        console.error(`[WHATSAPP-FATAL-${projectId}]`, err.stack || err.message);
    }
};

export const sendWhatsAppAlert = async (projectId = 'global', to, message) => {
    const session = clients.get(projectId);
    if (!session || !session.isConnected || !session.client) {
        console.warn(`[WHATSAPP-ALERT] Skipping send for ${projectId}. Connected: ${session?.isConnected}`);
        return;
    }
    
    // Normalize number: 9359570497 -> 919359570497@c.us
    let cleanNumber = to.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
    }
    
    const sanitizedTo = cleanNumber + '@c.us';
    console.log(`[WHATSAPP-ALERT-${projectId}] Dispatching to ID: ${sanitizedTo}`);
    
    try {
        const jitterMarkers = ['*', '#', '-', '+', '.', '~'];
        const randomMarker = jitterMarkers[Math.floor(Math.random() * jitterMarkers.length)];
        const uniqueId = Math.random().toString(36).substring(7);
        const finalContent = `${message}\n\n_Ref: [${uniqueId}] ${randomMarker}_`;

        await session.client.sendMessage(sanitizedTo, finalContent);
        console.log(`[WHATSAPP-${projectId}] Message sent to ${sanitizedTo}`);
    } catch (err) {
        console.error(`[WHATSAPP-DISPATCH-ERR-${projectId}] Final failure:`, err.message);
    }
};

export const disconnectWhatsApp = async (projectId = 'global') => {
    try {
        const session = clients.get(projectId);
        if (session && session.client) {
            console.log(`[WHATSAPP-${projectId}] Initiating Logout/Disconnect Sequence...`);
            await session.client.logout();
            await session.client.destroy();
            clients.delete(projectId);
            
            // Re-initialize to generate a fresh QR
            console.log(`[WHATSAPP-${projectId}] Re-initializing clean session...`);
            initWhatsApp(projectId);
            return { success: true, message: 'Disconnected' };
        }
        return { success: false, message: 'No active client' };
    } catch (err) {
        console.error(`[WHATSAPP-LOGOUT-ERR-${projectId}]`, err.message);
        return { success: false, error: err.message };
    }
};

export const getWhatsAppStatus = (projectId = 'global') => {
    if (!clients.has(projectId)) {
        initWhatsApp(projectId);
    }
    const session = clients.get(projectId);
    return {
        isConnected: session ? session.isConnected : false,
        qrCode: session ? session.qrCodeData : null
    };
};

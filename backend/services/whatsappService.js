import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

// --- ANTI-BAN HUMAN SIMULATION ENGINE ---
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const clients = new Map();

/**
 * Hard Purge: Nukes the filesystem session data to ensure 100% clean start
 */
const purgeSessionData = (projectId) => {
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth', projectId);
    try {
        if (fs.existsSync(sessionPath)) {
            console.log(`[WHATSAPP-PURGE-${projectId}] Nuking existing session data at: ${sessionPath}`);
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    } catch (err) {
        console.error(`[WHATSAPP-PURGE-FAILED-${projectId}]`, err.message);
    }
};

export const initWhatsApp = (projectId = 'global') => {
    if (clients.has(projectId)) return;

    try {
        console.log(`[UPBASE] Initializing Up-base Connect for Project ${projectId}...`);
        
        // --- 🛡️ 1. ARCHITECTURE: Puppeteer Hardening for Cloud/Windows ---
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: projectId,
                dataPath: './.wwebjs_auth' // wwebjs creates a subfolder using clientId automatically
            }),
            webVersion: '2.3000.1018905106-alpha', // Higher stability vs scrapers
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js'
            },
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', // Mandatory for Render/Docker
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
            isConnected: false,
            initTimeout: null
        };
        clients.set(projectId, session);

        // --- 🛡️ 2. SELF-HEALING: Auto-Purge if QR Generation Hangs (45s) ---
        session.initTimeout = setTimeout(async () => {
            const current = clients.get(projectId);
            if (current && !current.qrCodeData && !current.isConnected) {
                console.warn(`[WHATSAPP-TIMEOUT-${projectId}] QR generation stalled. Executing Emergency Purge...`);
                await disconnectWhatsApp(projectId, true); // True = Hard delete folder
            }
        }, 45000);

        client.on('qr', (qr) => {
            if (session.initTimeout) clearTimeout(session.initTimeout);
            console.log(`[WHATSAPP-QR-${projectId}] New uplink code generated.`);
            
            qrcode.toDataURL(qr, (err, url) => {
                const s = clients.get(projectId);
                if (!err && s) {
                    s.qrCodeData = url;
                    console.log(`[WHATSAPP-${projectId}] Uplink Image Ready in Memory.`);
                }
            });
        });

        client.on('ready', () => {
            if (session.initTimeout) clearTimeout(session.initTimeout);
            console.log(`[WHATSAPP-${projectId}] Anti-Ban Uplink Ready!`);
            const s = clients.get(projectId);
            if (s) {
                s.isConnected = true;
                s.qrCodeData = null;
            }
        });

        client.on('auth_failure', (msg) => {
            console.error(`[WHATSAPP-${projectId}] Auth failure:`, msg);
            disconnectWhatsApp(projectId, true); // Purge on failure
        });

        client.on('disconnected', async (reason) => {
            console.log(`[WHATSAPP-${projectId}] User logged out/Disconnected. Reason:`, reason);
            await disconnectWhatsApp(projectId, true); // Always purge on disconnect for clean re-auth
        });

        // Initialize with a catch-all for startup errors
        client.initialize().catch(err => {
            console.error(`[WHATSAPP-INIT-FAILED-${projectId}]`, err.message);
            clients.delete(projectId);
        });

    } catch (err) {
        console.error(`[WHATSAPP-FATAL-${projectId}]`, err.message);
        clients.delete(projectId);
    }
};

/**
 * Enhanced Disconnect: Purges memory AND optionally nukes the filesystem
 */
export const disconnectWhatsApp = async (projectId = 'global', hardDelete = false) => {
    try {
        const session = clients.get(projectId);
        
        if (session && session.client) {
            console.log(`[WHATSAPP-${projectId}] Purging session from memory...`);
            
            try {
                await session.client.destroy();
            } catch (e) {
                // Ignore destruction errors if process is already dead
            }
        }

        clients.delete(projectId);

        if (hardDelete) {
            purgeSessionData(projectId);
        }

        // Always restart the node to generate a fresh QR after disconnect
        console.log(`[WHATSAPP-${projectId}] Restarting node for fresh QR Uplink...`);
        initWhatsApp(projectId);
        
        return { success: true };
    } catch (err) {
        console.error(`[WHATSAPP-DISCONNECT-ERR-${projectId}]`, err.message);
        clients.delete(projectId); // Fallback: clear memory anyway
        return { success: false, error: err.message };
    }
};

export const sendWhatsAppAlert = async (projectId = 'global', to, message) => {
    const session = clients.get(projectId);
    if (!session || !session.isConnected || !session.client) {
        console.warn(`[WHATSAPP-ALERT] Skipping send for ${projectId}. Node not ready.`);
        return;
    }
    
    // Normalize number
    let cleanNumber = to.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;
    
    const sanitizedTo = cleanNumber + '@c.us';
    
    try {
        // Human-like jitter
        const jitterMarkers = ['*', '#', '-', '+', '.', '~'];
        const randomMarker = jitterMarkers[Math.floor(Math.random() * jitterMarkers.length)];
        const uniqueId = Math.random().toString(36).substring(7);
        const finalContent = `${message}\n\n_Ref: [${uniqueId}] ${randomMarker}_`;

        await session.client.sendMessage(sanitizedTo, finalContent);
        console.log(`[WHATSAPP-${projectId}] Dispatch to ${sanitizedTo} OK.`);
    } catch (err) {
        console.error(`[WHATSAPP-DISPATCH-ERR-${projectId}]`, err.message);
    }
};

export const getWhatsAppStatus = (projectId = 'global') => {
    const session = clients.get(projectId);
    if (!session) return { isConnected: false, qrCode: null };
    return {
        isConnected: session.isConnected,
        qrCode: session.qrCodeData
    };
};

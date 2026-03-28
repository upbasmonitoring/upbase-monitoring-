import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * WhatsApp Web Sentinel Engine (Custom Raw Puppeteer)
 * Sends alerts for free without paying for API keys.
 */

let browser;
let page;
let isReady = false;

let qrCode = null;

export const initWhatsApp = async () => {
    console.log('[WHATSAPP-SENTINEL] Powering up engine...');
    
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
        
        console.log('[WHATSAPP-SENTINEL] Navigating to WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 60000 });

        // Update loop to check for the QR or login state
        setInterval(async () => {
            if (isReady) return;

            try {
                const qrElement = await page.$('canvas');
                if (qrElement) {
                    qrCode = await page.evaluate(() => {
                        const canvas = document.querySelector('canvas');
                        return canvas ? canvas.toDataURL() : null;
                    });
                }

                const searchBar = await page.$('div[data-testid="search"]');
                if (searchBar) {
                    isReady = true;
                    qrCode = null;
                    console.log('[WHATSAPP-SENTINEL] Login detected! Engine is ONLINE.');
                }
            } catch (err) {}
        }, 5000);

    } catch (err) {
        console.error('[WHATSAPP-SENTINEL] CRITICAL BOOT FAILURE:', err.message);
    }
};

export const sendWhatsAppAlert = async (to, message) => {
    if (!isReady && !page) {
        console.warn(`[WHATSAPP-SENTINEL] Engine is OFFLINE. Message to ${to} deferred.`);
        return { success: false, message: 'WhatsApp Engine is initializing or offline.' };
    }

    try {
        const sanitized = to.replace(/[-+()\s]/g, '');
        const directUrl = `https://web.whatsapp.com/send?phone=${sanitized}&text=${encodeURIComponent(message)}`;
        
        console.log(`[WHATSAPP-SENTINEL] Routing alert to ${to}...`);
        await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for the Send button
        await page.waitForSelector('span[data-testid="send"]', { timeout: 15000 });
        await page.click('span[data-testid="send"]');
        
        console.log(`[WHATSAPP-SENTINEL] Alert delivered to terminal ${to}!`);
        return { success: true };
    } catch (err) {
        console.error(`[WHATSAPP-SENTINEL] Delivery failed to ${to}:`, err.message);
        return { success: false, error: err.message };
    }
};

export const getStatus = () => ({
    status: isReady ? 'ONLINE' : 'AUTH_PENDING',
    engine: 'Headless Puppeteer Sentinel',
    qr: qrCode
});

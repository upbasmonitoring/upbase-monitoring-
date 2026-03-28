import puppeteer from 'puppeteer';

/**
 * Browser-Grade Stealth Health Check
 * Uses Puppeteer to bypass aggressive Cloudflare/WAF connection resets (ECONNRESET).
 */
export const checkWithStealthBrowser = async (url) => {
    let browser = null;
    const start = Date.now();
    
    try {
        console.log(`[STEALTH-CHECK] Initiating browser-grade session for ${url}...`);
        
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        
        // Identity Simulation
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        
        // Advanced Bot-Bypass
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        const response = await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 25000 
        });

        const status = response.status();
        const body = await page.content();
        const responseTime = Date.now() - start;

        console.log(`[STEALTH-CHECK] Success. Status: ${status}. Latency: ${responseTime}ms`);

        return {
            success: status >= 200 && status < 400,
            status,
            data: body,
            responseTime
        };

    } catch (err) {
        console.error(`[STEALTH-CHECK-ERR] Fatal Browser Failure:`, err.message);
        return {
            success: false,
            error: err.message,
            status: 0,
            responseTime: Date.now() - start
        };
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
};

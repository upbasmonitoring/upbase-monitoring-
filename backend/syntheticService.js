import puppeteer from 'puppeteer';

/**
 * Ghost Synthetics Engine V2 (Puppeteer Powered)
 * Simulates real human interaction in a headless browser.
 */
export const runSyntheticFlow = async (monitor) => {
  const { steps } = monitor.syntheticConfig;
  const results = [];
  const startFlow = Date.now();
  let status = 'online';
  let message = 'Ghost journey completed successfully';
  
  console.log(`[GHOST ENGINE] Launching browser for: ${monitor.name}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Default viewport for consistency
    await page.setViewport({ width: 1280, height: 800 });
    
    // Initial navigation
    await page.goto(monitor.url, { waitUntil: 'networkidle2', timeout: 30000 });

    for (const step of steps) {
      const stepStart = Date.now();
      let stepStatus = 'success';
      let stepError = null;

      try {
        console.log(`  -> Executing: ${step.action} | Selector: ${step.selector || 'N/A'}`);
        
        switch (step.action) {
          case 'navigate':
            await page.goto(step.value || monitor.url, { waitUntil: 'networkidle2', timeout: 20000 });
            break;

          case 'click':
            await page.waitForSelector(step.selector, { timeout: 10000 });
            await page.click(step.selector);
            // Wait for potential navigation or state change
            await new Promise(r => setTimeout(r, 1000));
            break;

          case 'type':
            await page.waitForSelector(step.selector, { timeout: 10000 });
            await page.type(step.selector, step.value);
            break;

          case 'wait':
            await new Promise(resolve => setTimeout(resolve, parseInt(step.value) || 2000));
            break;

          case 'checkText':
            // Use evaluate to check text content directly in page context
            const textExists = await page.evaluate((val) => {
              return document.body.innerText.includes(val);
            }, step.value);
            
            if (!textExists) {
              throw new Error(`Text "${step.value}" not found on page`);
            }
            break;
            
          default:
            console.warn(`[GHOST] Unknown action: ${step.action}`);
        }
      } catch (err) {
        stepStatus = 'fail';
        stepError = err.message;
        status = 'offline';
        message = `Ghost Error at Step ${results.length + 1} (${step.action}): ${err.message}`;
        
        results.push({
          action: step.action,
          status: stepStatus,
          error: stepError,
          duration: Date.now() - stepStart
        });
        
        // Break loop on failure
        break; 
      }

      results.push({
        action: step.action,
        status: stepStatus,
        error: stepError,
        duration: Date.now() - stepStart
      });
    }

  } catch (globalErr) {
    status = 'offline';
    message = `Browser Engine Failure: ${globalErr.message}`;
    console.error(`[GHOST ENGINE CRASH]`, globalErr);
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[GHOST ENGINE] Browser closed for: ${monitor.name}`);
    }
  }

  return {
    status,
    responseTime: Date.now() - startFlow,
    message,
    stepResults: results
  };
};

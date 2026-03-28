const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to root to establish origin
  await page.goto('http://localhost:5173/');
  
  // Inject mock user state to bypass auth
  await page.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({
      _id: '123',
      name: 'Test',
      email: 'test@example.com'
    }));
  });
  
  // Go to settings page
  console.log('Navigating to settings...');
  await page.goto('http://localhost:5173/dashboard/settings');
  await page.waitForLoadState('networkidle');
  
  // Now evaluate the same logic Chrome DevTools uses to find elements missing id/name
  console.log('Analyzing DOM...');
  const violatingNodes = await page.evaluate(() => {
    // A form field element should have an id or name attribute
    // Chrome targets inputs, textareas, selects, and buttons inside forms (and sometimes outside) that lack both id and name.
    const elements = document.querySelectorAll('input:not([id]):not([name]), select:not([id]):not([name]), textarea:not([id]):not([name]), button:not([id]):not([name])');
    
    return Array.from(elements).map(el => {
      return {
        tag: el.tagName,
        type: el.type,
        className: el.className,
        html: el.outerHTML.substring(0, 150) + (el.outerHTML.length > 150 ? '...' : '')
      };
    });
  });
  
  console.log('Violating Nodes Found:', violatingNodes.length);
  violatingNodes.forEach((node, idx) => {
    console.log(`\nNode ${idx + 1}:`);
    console.log(`Tag: ${node.tag}`);
    console.log(`Type: ${node.type}`);
    console.log(`Class: ${node.className}`);
    console.log(`HTML snippet: ${node.html}`);
  });
  
  await browser.close();
  console.log('Done.');
})();

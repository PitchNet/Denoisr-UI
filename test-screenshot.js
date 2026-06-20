import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the company detail page
    await page.goto('http://localhost:5176/company/7982a6e7-9105-4043-9b5e-150f3c04d9c3', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
    
    // Wait a moment for rendering
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/company-page-fixed.png' });
    console.log('Screenshot saved successfully');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();

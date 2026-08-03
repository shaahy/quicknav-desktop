const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

(async () => {
  const htmlPath = path.resolve(__dirname, 'OpenSpec-OPSX-技能速查.html');
  const screenshotPath = path.resolve(__dirname, '验收预览-375px.png');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => consoleErrors.push(error.message));

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.screenshot({ path: screenshotPath });

  const base = await page.evaluate(() => ({
    cards: document.querySelectorAll('.card').length,
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    title: document.title,
    statRects: [...document.querySelectorAll('.stat')].map(stat => {
      const card = stat.getBoundingClientRect();
      const value = stat.querySelector('strong').getBoundingClientRect();
      return { cardLeft: card.left, cardRight: card.right, valueLeft: value.left, valueRight: value.right };
    })
  }));

  await page.selectOption('#profile', 'Core');
  const coreCount = await page.locator('.card').count();
  await page.selectOption('#profile', '');
  await page.fill('#search', 'verify');
  const verifyCount = await page.locator('.card').count();
  const verifyCardVisible = await page.locator('#skill-verify').isVisible();
  await page.fill('#search', '');
  await page.locator('.copy').first().click();
  await page.waitForFunction(() => document.querySelector('.copy').textContent === '已复制');
  const copyFeedback = await page.locator('.copy').first().textContent();
  await page.locator('#skill-explore summary').click();
  const detailsOpen = await page.locator('#skill-explore details').getAttribute('open') !== null;
  await page.locator('#tableView').click();
  const tableVisible = await page.locator('#tableWrap').evaluate(element => getComputedStyle(element).display !== 'none');
  await page.locator('#cardView').click();

  const result = {
    ...base,
    noHorizontalOverflow: base.scrollWidth <= base.viewport,
    coreCount,
    verifyCount,
    verifyCardVisible,
    copyFeedback,
    detailsOpen,
    tableVisible,
    consoleErrors
  };
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
  const passed = base.cards === 12 && base.scrollWidth <= base.viewport && coreCount === 6 && verifyCount >= 1 && verifyCardVisible && copyFeedback === '已复制' && detailsOpen && tableVisible && consoleErrors.length === 0;
  process.exit(passed ? 0 : 1);
})();

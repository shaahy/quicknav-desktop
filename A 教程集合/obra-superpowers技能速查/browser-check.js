const path = require('path');
const { chromium } = require('C:\\Users\\MSI\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.61.1\\node_modules\\playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  const viewports = [
    { name: 'mobile-375', width: 375, height: 900 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 1000 },
  ];
  const failures = [];
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', error => consoleErrors.push(error.message));
    await page.goto('http://127.0.0.1:4177/obra-superpowers-v6.1.1-14%E6%8A%80%E8%83%BD%E9%80%9F%E6%9F%A5.html', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(__dirname, `verify-${viewport.name}.png`), fullPage: true });
    const result = await page.evaluate(() => ({
      title: document.title,
      renderedSkills: document.querySelectorAll('.skill').length,
      bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      mainOverflow: [...document.querySelectorAll('.main *')].filter(el => el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'visible').slice(0, 5).map(el => el.className || el.tagName),
      pretextReady: Boolean(window.Pretext && window.Pretext.prepare && window.Pretext.layout),
    }));
    if (result.renderedSkills !== 14) failures.push(`${viewport.name}: renderedSkills=${result.renderedSkills}`);
    if (result.bodyOverflow) failures.push(`${viewport.name}: horizontal overflow ${result.mainOverflow.join(', ')}`);
    if (!result.pretextReady) failures.push(`${viewport.name}: Pretext unavailable`);
    if (consoleErrors.length) failures.push(`${viewport.name}: console ${consoleErrors.join(' | ')}`);
    console.log(`${viewport.name}: skills=${result.renderedSkills}, overflow=${result.bodyOverflow}, pretext=${result.pretextReady}, consoleErrors=${consoleErrors.length}`);
    await page.close();
  }
  await browser.close();
  if (failures.length) {
    console.error('BROWSER_CHECK_FAIL');
    failures.forEach(f => console.error(`- ${f}`));
    process.exit(1);
  }
  console.log('BROWSER_CHECK_PASS');
})().catch(error => { console.error(error); process.exit(1); });

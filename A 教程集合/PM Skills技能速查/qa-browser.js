const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  const page = await browser.newPage({viewport:{width:1440,height:1000}, deviceScaleFactor:1});
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.goto('http://127.0.0.1:4175/phuryn-pm-skills-v2.1.0-%E4%B8%AD%E6%96%87%E9%80%9F%E6%9F%A5.html', {waitUntil:'networkidle'});
  if (await page.locator('.card').count() !== 68) throw new Error('Skills 初始卡片数不是 68');
  if (await page.locator('#count').textContent() !== '68') throw new Error('Skills 计数器错误');
  await page.screenshot({path:path.join(__dirname,'preview-desktop.png'),fullPage:true});

  await page.locator('#q').fill('PRD');
  const searched = Number(await page.locator('#count').textContent());
  if (searched < 1 || searched >= 68) throw new Error('Skills 搜索未生效');
  await page.locator('#q').fill('');
  await page.locator('#plugin').selectOption('pm-product-discovery');
  if (Number(await page.locator('#count').textContent()) !== 13) throw new Error('产品发现插件筛选应为 13');
  await page.locator('#plugin').selectOption('');

  await page.locator('#commandTab').click();
  if (await page.locator('.card').count() !== 42) throw new Error('Commands 卡片数不是 42');
  if (!(await page.locator('#phase').isDisabled()) || !(await page.locator('#role').isDisabled())) throw new Error('Commands 模式未禁用不适用筛选');
  await page.locator('#tableBtn').click();
  if (!(await page.locator('#tablewrap').evaluate(el => el.classList.contains('show')))) throw new Error('表格视图切换失败');
  await page.locator('#cardBtn').click();
  await page.locator('#skillTab').click();

  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:path.join(__dirname,'preview-mobile.png'),fullPage:true});
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error('移动端卡片视图存在页面级横向溢出');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS');
  console.log(`search_prd_results=${searched}`);
  console.log('plugin_filter_pm_product_discovery=13');
  console.log('desktop=1440x1000');
  console.log('mobile=375x812');
  await browser.close();
})().catch(async e => { console.error(e.stack || e); process.exit(1); });

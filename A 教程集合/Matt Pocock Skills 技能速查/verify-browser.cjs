const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputDir = 'C:\\Users\\MSI\\.codex\\visualizations\\2026\\07\\21\\019f82a4-af43-72c3-b75a-6ef663dbe251';
const profileDir = path.join(outputDir, `edge-cdp-profile-${process.pid}`);
const htmlUrl = pathToFileURL(path.resolve(__dirname, 'mattpocock-skills-cheatsheet.html')).href;
fs.mkdirSync(profileDir, { recursive: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForPort() {
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < 80; i += 1) {
    if (fs.existsSync(portFile)) {
      const [port] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
      if (port) return Number(port);
    }
    await delay(100);
  }
  throw new Error('DevToolsActivePort was not created');
}

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const events = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const pair = pending.get(message.id);
      if (!pair) return;
      pending.delete(message.id);
      message.error ? pair.reject(new Error(message.error.message)) : pair.resolve(message.result);
    } else {
      events.push(message);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { socket, send, events };
}

(async () => {
  const browser = spawn(edge, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
    '--remote-debugging-port=0', `--user-data-dir=${profileDir}`, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });

  try {
    const port = await waitForPort();
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const pageTarget = targets.find(target => target.type === 'page');
    if (!pageTarget) throw new Error('No page target found');
    const cdp = await connect(pageTarget.webSocketDebuggerUrl);
    const { send, events, socket } = cdp;
    await send('Page.enable');
    await send('Runtime.enable');

    const results = { assertions: [], viewports: [], exceptions: [] };
    const check = (name, actual, expected) => {
      const ok = actual === expected;
      results.assertions.push({ name, actual, expected, ok });
      if (!ok) process.exitCode = 1;
    };
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
      return response.result.value;
    };
    const setViewport = async (width, height, mobile) => send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height
    });

    await setViewport(1440, 900, false);
    await send('Page.navigate', { url: htmlUrl });
    await delay(500);
    check('all cards rendered', await evaluate(`document.querySelectorAll('.skill-card').length`), 29);
    check('initial visible', await evaluate(`document.querySelectorAll('.skill-card:not([hidden])').length`), 29);
    check('engineering filter', await evaluate(`category.value='Engineering'; category.dispatchEvent(new Event('change')); document.querySelectorAll('.skill-card:not([hidden])').length`), 17);
    check('productivity filter', await evaluate(`category.value='Productivity'; category.dispatchEvent(new Event('change')); document.querySelectorAll('.skill-card:not([hidden])').length`), 5);
    check('experimental filter', await evaluate(`category.value='Experimental'; category.dispatchEvent(new Event('change')); document.querySelectorAll('.skill-card:not([hidden])').length`), 7);
    await evaluate(`category.value='all'; category.dispatchEvent(new Event('change'))`);
    check('user invocation filter', await evaluate(`invocation.value='user'; invocation.dispatchEvent(new Event('change')); document.querySelectorAll('.skill-card:not([hidden])').length`), 20);
    check('model invocation filter', await evaluate(`invocation.value='model'; invocation.dispatchEvent(new Event('change')); document.querySelectorAll('.skill-card:not([hidden])').length`), 9);
    await evaluate(`invocation.value='all'; invocation.dispatchEvent(new Event('change'))`);
    check('worth trying filter', await evaluate(`judgment.value='值得试用'; judgment.dispatchEvent(new Event('change')); document.querySelectorAll('.skill-card:not([hidden])').length`), 2);
    check('conditional filter', await evaluate(`judgment.value='条件性有用'; judgment.dispatchEvent(new Event('change')); document.querySelectorAll('.skill-card:not([hidden])').length`), 3);
    await evaluate(`judgment.value='all'; judgment.dispatchEvent(new Event('change'))`);
    check('search scenario', await evaluate(`search.value='合并冲突'; search.dispatchEvent(new Event('input')); document.querySelectorAll('.skill-card:not([hidden])').length`), 1);
    await evaluate(`reset.click()`);
    check('reset restores all', await evaluate(`document.querySelectorAll('.skill-card:not([hidden])').length`), 29);
    check('details opens', await evaluate(`document.querySelector('.skill-card summary').click(); document.querySelector('.skill-card').open`), true);

    for (const viewport of [
      { name: 'mobile-cdp', width: 375, height: 812, mobile: true },
      { name: 'tablet-cdp', width: 768, height: 1024, mobile: true },
      { name: 'desktop-cdp', width: 1440, height: 900, mobile: false },
    ]) {
      await setViewport(viewport.width, viewport.height, viewport.mobile);
      await delay(120);
      const metrics = await evaluate(`({ viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.getBoundingClientRect().width, visibleCards: document.querySelectorAll('.skill-card:not([hidden])').length })`);
      const noHorizontalOverflow = metrics.scrollWidth <= metrics.viewport;
      results.viewports.push({ ...viewport, ...metrics, noHorizontalOverflow });
      if (!noHorizontalOverflow) process.exitCode = 1;
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
      fs.writeFileSync(path.join(outputDir, `mattpocock-skills-${viewport.name}.png`), Buffer.from(shot.data, 'base64'));
    }

    for (const viewport of [
      { name: 'mobile-cards', width: 375, height: 812, mobile: true },
      { name: 'desktop-cards', width: 1440, height: 900, mobile: false },
    ]) {
      await setViewport(viewport.width, viewport.height, viewport.mobile);
      await delay(120);
      await evaluate(`document.querySelector('${viewport.name === 'mobile-cards' ? '#skills' : '.controls-wrap'}').scrollIntoView({block:'start'})`);
      await delay(120);
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
      fs.writeFileSync(path.join(outputDir, `mattpocock-skills-${viewport.name}.png`), Buffer.from(shot.data, 'base64'));
    }

    await setViewport(1440, 900, false);
    await evaluate(`document.querySelectorAll('.skill-card').forEach(card => card.open=false); category.value='Experimental'; category.dispatchEvent(new Event('change')); document.querySelector('#skills').scrollIntoView({block:'start'})`);
    await delay(120);
    const experimentalShot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    fs.writeFileSync(path.join(outputDir, 'mattpocock-skills-experimental.png'), Buffer.from(experimentalShot.data, 'base64'));

    results.exceptions = events.filter(event => event.method === 'Runtime.exceptionThrown').map(event => event.params.exceptionDetails.text);
    if (results.exceptions.length) process.exitCode = 1;
    console.log(JSON.stringify(results, null, 2));
    socket.close();
  } finally {
    browser.kill();
  }
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

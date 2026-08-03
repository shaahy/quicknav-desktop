import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const htmlPath = "E:\\元梦工作空间\\临时\\Matt Pocock Skill双场景工程实战教程\\Matt-Pocock-Skills-Codex双场景工程实战教程.html";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function select(page, id, value) {
  await page.selectOption(`#${id}`, value);
}

async function recommendation(page) {
  return (await page.locator("#recommendation .skill-answer").textContent()).trim();
}

const browser = await chromium.launch({ headless: true, executablePath: edgePath });
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", message => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
    assert(await page.locator("#stages details.stage").count() === 11, `${viewport.name}: 0→1 应为 11 个阶段`);
    assert(await page.locator("#stages details.stage").first().getAttribute("open") !== null, `${viewport.name}: 首阶段应默认展开`);
    assert(await page.locator("#branch-grid .branch").count() === 5, `${viewport.name}: 应有 5 个异常分支`);

    const copyButton = page.locator("#stages [data-copy]").first();
    await copyButton.click();
    await page.waitForSelector("#toast.show");
    assert((await copyButton.textContent()).trim() === "已复制", `${viewport.name}: 复制状态未更新`);

    assert(await recommendation(page) === "grill-with-docs", `${viewport.name}: 默认入口应为 grill-with-docs`);
    await select(page, "task-scale", "huge");
    assert(await recommendation(page) === "wayfinder", `${viewport.name}: 大规模任务应推荐 wayfinder`);
    await select(page, "task-scale", "scoped");
    await select(page, "project-state", "existing");
    await select(page, "task-type", "bug");
    assert(await recommendation(page) === "diagnosing-bugs", `${viewport.name}: 故障应推荐 diagnosing-bugs`);
    await select(page, "task-type", "issue");
    assert(await recommendation(page) === "triage", `${viewport.name}: 外部 Issue 应推荐 triage`);
    await select(page, "task-type", "feature");
    await select(page, "runnable-question", "yes");
    assert(await recommendation(page) === "prototype", `${viewport.name}: 需运行验证应推荐 prototype`);
    await select(page, "runnable-question", "no");
    await select(page, "task-type", "architecture");
    assert(await recommendation(page) === "improve-codebase-architecture", `${viewport.name}: 架构问题推荐错误`);

    await page.locator('[data-route="route-increment"]').click();
    assert(await page.locator("#stages details.stage").count() === 10, `${viewport.name}: 增量路线应为 10 个阶段`);
    assert(await page.locator('[data-route="route-increment"]').getAttribute("aria-selected") === "true", `${viewport.name}: 路线状态未切换`);
    const windowScrollX = await page.evaluate(() => {
      window.scrollTo(99999, window.scrollY);
      const actual = window.scrollX;
      window.scrollTo(0, window.scrollY);
      return actual;
    });
    assert(windowScrollX === 0, `${viewport.name}: 页面发生水平溢出，窗口可横向滚动 ${windowScrollX}px`);
    assert(consoleErrors.length === 0, `${viewport.name}: console error: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `${viewport.name}: page error: ${pageErrors.join(" | ")}`);

    const screenshot = path.join(os.tmpdir(), `matt-pocock-dual-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({ viewport: `${viewport.width}x${viewport.height}`, stages: "11/10", branches: 5, overflow: false, screenshot });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ ok: true, results }, null, 2));

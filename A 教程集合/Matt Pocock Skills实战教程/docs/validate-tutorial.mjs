import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = "E:\\元梦工作空间\\临时\\Matt Pocock Skills实战教程";
const htmlPath = path.join(root, "Matt-Pocock-Skills实战教程.html");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const url = pathToFileURL(htmlPath).href;
const browser = await chromium.launch({ headless: true, executablePath: edgePath });
const results = [];

async function inspectViewport(width, height, screenshotPath, fullPage = false) {
  const page = await browser.newPage({ viewport: { width, height } });
  const consoleErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector("#skill-grid .skill");

  const initialCount = await page.locator("#skill-grid .skill").count();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

  await page.selectOption("#category", "engineering");
  const engineeringCount = Number(await page.locator("#result-count").textContent());
  await page.selectOption("#category", "all");
  await page.selectOption("#invocation", "model");
  const modelCount = Number(await page.locator("#result-count").textContent());
  await page.selectOption("#invocation", "all");
  await page.fill("#query", "ADR");
  const adrCount = Number(await page.locator("#result-count").textContent());
  await page.click("#reset");
  const resetCount = Number(await page.locator("#result-count").textContent());

  await page.locator("#skill-grid .skill").first().locator("summary").click();
  const expanded = await page.locator("#skill-grid .skill").first().getAttribute("open") !== null;
  const copyButton = page.locator("#skill-grid .skill").first().locator("[data-copy]");
  await copyButton.click();
  await page.waitForFunction(() => document.querySelector("#toast")?.classList.contains("show"));
  const copyFeedback = await copyButton.textContent();

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: screenshotPath, fullPage });
  const passed = initialCount === 22 && engineeringCount === 17 && modelCount === 9 && adrCount > 0 && resetCount === 22 && !overflow && expanded && copyFeedback === "已复制" && consoleErrors.length === 0;
  results.push({ width, height, initialCount, engineeringCount, modelCount, adrCount, resetCount, overflow, expanded, copyFeedback, consoleErrors, passed, screenshotPath });
  await page.close();
}

await inspectViewport(375, 812, path.join(os.tmpdir(), "matt-skills-mobile.png"));
await inspectViewport(768, 1024, path.join(os.tmpdir(), "matt-skills-tablet.png"));
await inspectViewport(1440, 1000, path.join(root, "教程预览.png"), true);

await browser.close();
console.log(JSON.stringify(results, null, 2));
if (results.some(result => !result.passed)) process.exit(1);

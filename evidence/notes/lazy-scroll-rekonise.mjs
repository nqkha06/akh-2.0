import { chromium } from '/tmp/rekonise-pw/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const baseUrl = 'https://rekonise.com';
const out = (...parts) => path.join(root, ...parts);

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function saveJson(filePath, data) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function saveText(filePath, data) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, data);
}

async function scrollToBottom(page) {
  let lastHeight = 0;
  for (let i = 0; i < 30; i += 1) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    if (height === lastHeight && i > 2) break;
    lastHeight = height;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(900);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function capture(page, item) {
  const network = [];
  const onResponse = (response) => {
    const url = response.url();
    if (!url.includes('rekonise.com')) return;
    const req = response.request();
    let pathname = url;
    try {
      const parsed = new URL(url);
      pathname = parsed.pathname + (parsed.search ? '?<query>' : '');
    } catch {}
    network.push({
      method: req.method(),
      path: pathname,
      status: response.status(),
      resourceType: req.resourceType(),
    });
  };
  page.on('response', onResponse);
  await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  await scrollToBottom(page);
  const screenshotPath = out('evidence', 'screenshots', item.group, `${item.name}-after-scroll.png`);
  await ensureDir(screenshotPath);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const snapshotPath = out('evidence', 'snapshots', item.snapshotGroup, `${item.name}-after-scroll.html`);
  await saveText(snapshotPath, await page.locator('body').evaluate((body) => body.outerHTML));
  const note = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    scrollHeight: document.documentElement.scrollHeight,
    textSample: document.body.innerText.replace(/\s+/g, ' ').slice(0, 6000),
    imageCount: document.images.length,
    lazyImageCount: Array.from(document.images).filter((img) => img.loading === 'lazy').length,
  }));
  await saveJson(out('evidence', 'notes', `${item.name}-after-scroll.json`), note);
  await saveJson(out('evidence', 'network', item.networkGroup, `${item.name}-after-scroll.json`), network);
  page.off('response', onResponse);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pages = [
    { url: `${baseUrl}/`, group: 'public', snapshotGroup: 'public', networkGroup: 'links', name: 'homepage-desktop-lazy' },
    { url: `${baseUrl}/how-it-works`, group: 'public', snapshotGroup: 'public', networkGroup: 'links', name: 'how-it-works-lazy' },
    { url: `${baseUrl}/create`, group: 'create-link', snapshotGroup: 'create-link', networkGroup: 'links', name: 'public-create-lazy' },
    { url: `${baseUrl}/login`, group: 'authentication', snapshotGroup: 'public', networkGroup: 'authentication', name: 'login-lazy' },
  ];
  for (const item of pages) await capture(page, item);
  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

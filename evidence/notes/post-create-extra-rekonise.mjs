import { chromium } from '/tmp/rekonise-pw/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

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
function redactUrl(raw) {
  try {
    const url = new URL(raw);
    return url.hostname.includes('rekonise.com') ? url.pathname + (url.search ? '?<query>' : '') : `<external:${url.hostname}>`;
  } catch {
    return raw;
  }
}
async function pageInfo(page) {
  return page.evaluate(() => ({
    url: location.href,
    title: document.title,
    textSample: document.body.innerText.replace(/\s+/g, ' ').slice(0, 5000),
    inputs: Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 140).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      placeholder: el.getAttribute('placeholder') || '',
      required: el.hasAttribute('required'),
      valueState: el.value ? '<filled>' : '',
      formControlName: el.getAttribute('formcontrolname') || '',
    })),
    buttons: Array.from(document.querySelectorAll('button, [role=button], input[type=submit]')).slice(0, 180).map((el) => ({
      text: (el.innerText || el.getAttribute('value') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
      aria: el.getAttribute('aria-label') || '',
      type: el.getAttribute('type') || '',
    })),
    links: Array.from(document.querySelectorAll('a')).slice(0, 120).map((a) => ({
      text: (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      href: a.href,
    })),
  }));
}
async function capture(page, group, name, network, when) {
  await page.waitForTimeout(1000);
  const screenshotPath = out('evidence', 'screenshots', group, `${name}.png`);
  await ensureDir(screenshotPath);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const snapshotPath = out('evidence', 'snapshots', group, `${name}.html`);
  await saveText(snapshotPath, await page.locator('body').evaluate((body) => body.outerHTML));
  const info = await pageInfo(page);
  await saveJson(out('evidence', 'notes', `${group}-${name}.json`), info);
  await saveJson(out('evidence', 'network', group === 'visitor-flow' ? 'visitor-flow' : 'links', `${name}.json`), network.splice(0).map((entry) => ({ ...entry, when })));
  return info;
}
function attachNetwork(page, network) {
  page.on('response', (response) => {
    const req = response.request();
    network.push({
      method: req.method(),
      path: redactUrl(response.url()),
      status: response.status(),
      resourceType: req.resourceType(),
      responseShape: response.headers()['content-type']?.split(';')[0] || 'unknown',
    });
  });
}
async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.locator('input[placeholder="your@email.com"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"], form input[type="submit"]').nth(0).click({ timeout: 8000 });
  await page.waitForTimeout(4000);
  await page.goto(`${baseUrl}/dashboard/links/create`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
}

async function main() {
  const createdSummary = JSON.parse(await fs.readFile(out('evidence', 'notes', 'create-link-types-summary.json'), 'utf8'));
  const urlCreated = createdSummary.created.find((item) => item.type === 'URL social gated' && item.finalUrl);
  const publicUrl = urlCreated?.finalUrl;
  const browser = await chromium.launch({ headless: true });
  const summary = { publicUrl, visitor: null, creatorInspections: [], errors: [] };

  if (publicUrl) {
    const visitorContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
    const visitorPage = await visitorContext.newPage();
    const visitorNetwork = [];
    attachNetwork(visitorPage, visitorNetwork);
    await visitorPage.goto(publicUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await visitorPage.waitForTimeout(2000);
    const initial = await capture(visitorPage, 'visitor-flow', 'created-url-mobile-initial', visitorNetwork, 'created public initial');
    let afterAction = null;
    try {
      const actionButton = visitorPage.locator('button').filter({ hasText: 'Subscribe to channel' });
      if (await actionButton.count()) {
        const popupPromise = visitorPage.context().waitForEvent('page', { timeout: 5000 }).catch(() => null);
        await actionButton.nth(0).click({ timeout: 8000 });
        const popup = await popupPromise;
        if (popup) {
          await popup.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
          summary.visitorPopup = { url: popup.url(), title: await popup.title().catch(() => '') };
          await popup.close().catch(() => {});
        }
        await visitorPage.waitForTimeout(2500);
        afterAction = await capture(visitorPage, 'visitor-flow', 'created-url-mobile-after-action-click', visitorNetwork, 'created public after action click');
      }
    } catch (error) {
      summary.errors.push({ phase: 'visitor action click', error: `${error.name}: ${error.message}` });
    }
    summary.visitor = { initial, afterAction };
    await visitorContext.close();
  }

  const rl = readline.createInterface({ input, output, terminal: false });
  const email = (await rl.question('email: ')).trim();
  const password = await rl.question('password: ');
  rl.close();

  const creatorContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  const creatorPage = await creatorContext.newPage();
  const creatorNetwork = [];
  attachNetwork(creatorPage, creatorNetwork);
  await login(creatorPage, email, password);
  await capture(creatorPage, 'create-link', 'auth-create-url-email-capture-collapsed', creatorNetwork, 'email capture collapsed');
  try {
    const emailAccordion = creatorPage.locator('button').filter({ hasText: 'Email capturing' });
    if (await emailAccordion.count()) {
      await emailAccordion.nth(0).click({ timeout: 8000 });
      await creatorPage.waitForTimeout(1000);
      const info = await capture(creatorPage, 'create-link', 'auth-create-url-email-capture-expanded', creatorNetwork, 'email capture expanded');
      summary.creatorInspections.push({ type: 'email-capture-expanded', info });
    }
  } catch (error) {
    summary.errors.push({ phase: 'email capture inspect', error: `${error.name}: ${error.message}` });
  }
  try {
    const fileToggle = creatorPage.locator('#mat-button-toggle-1-button');
    if (await fileToggle.count()) {
      await fileToggle.click({ timeout: 8000 });
      await creatorPage.waitForTimeout(1000);
      const info = await capture(creatorPage, 'create-link', 'auth-create-file-toggle-exact', creatorNetwork, 'file toggle exact');
      summary.creatorInspections.push({ type: 'file-toggle-exact', info });
    }
  } catch (error) {
    summary.errors.push({ phase: 'file toggle exact', error: `${error.name}: ${error.message}` });
  }
  try {
    const snippetToggle = creatorPage.locator('#mat-button-toggle-2-button');
    if (await snippetToggle.count()) {
      await snippetToggle.click({ timeout: 8000 });
      await creatorPage.waitForTimeout(1000);
      const info = await capture(creatorPage, 'create-link', 'auth-create-snippet-toggle-exact', creatorNetwork, 'snippet toggle exact');
      summary.creatorInspections.push({ type: 'snippet-toggle-exact', info });
    }
  } catch (error) {
    summary.errors.push({ phase: 'snippet toggle exact', error: `${error.name}: ${error.message}` });
  }

  await creatorContext.close();
  await saveJson(out('evidence', 'notes', 'post-create-extra-summary.json'), summary);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

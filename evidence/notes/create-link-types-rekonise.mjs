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

function safeName(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80) || 'step';
}

function redactUrl(raw) {
  try {
    const url = new URL(raw);
    return url.pathname + (url.search ? '?<query>' : '');
  } catch {
    return raw;
  }
}

function shapeOf(value, depth = 0) {
  if (depth > 2) return Array.isArray(value) ? ['...'] : typeof value;
  if (Array.isArray(value)) return value.length ? [shapeOf(value[0], depth + 1)] : [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).slice(0, 40).map((key) => [key, shapeOf(value[key], depth + 1)]));
  }
  return typeof value;
}

async function info(page) {
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
  const pageInfo = await info(page);
  await saveJson(out('evidence', 'notes', `${group}-${name}.json`), pageInfo);
  await saveJson(out('evidence', 'network', group === 'analytics' ? 'analytics' : group === 'visitor-flow' ? 'visitor-flow' : 'links', `${name}.json`), network.splice(0).map((entry) => ({ ...entry, when })));
  return pageInfo;
}

async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.locator('input[placeholder="your@email.com"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  const submit = page.locator('form button[type="submit"], form input[type="submit"]');
  if (await submit.count()) {
    await submit.nth(0).click({ timeout: 8000 });
  } else {
    await page.locator('input[type="password"]').press('Enter');
  }
  await page.waitForTimeout(4000);
  if (!page.url().includes('/dashboard')) {
    await page.goto(`${baseUrl}/dashboard/links`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
  }
}

async function ensureAuthenticated(page, email, password) {
  if (!page.url().includes('/login')) return;
  await login(page, email, password);
}

async function clickFirstVisible(page, selector, label) {
  const count = await page.locator(selector).count();
  for (let i = 0; i < count; i += 1) {
    const loc = page.locator(selector).nth(i);
    if (await loc.isVisible().catch(() => false)) {
      await loc.click({ timeout: 8000 });
      await page.waitForTimeout(1000);
      return true;
    }
  }
  throw new Error(`No visible ${label}`);
}

async function fillFirst(page, selector, value, optional = false) {
  const count = await page.locator(selector).count();
  for (let i = 0; i < count; i += 1) {
    const loc = page.locator(selector).nth(i);
    if (await loc.isVisible().catch(() => false)) {
      await loc.fill(value);
      await page.waitForTimeout(300);
      return true;
    }
  }
  if (!optional) throw new Error(`No visible input for ${selector}`);
  return false;
}

async function addRecentAction(page) {
  const recent = page.locator('button').filter({ hasText: 'Subscribe to channel' });
  const recentCount = await recent.count();
  for (let i = 0; i < recentCount; i += 1) {
    const loc = recent.nth(i);
    if (await loc.isVisible().catch(() => false)) {
      await loc.click({ timeout: 8000 });
      await page.waitForTimeout(1200);
      return 'recent Subscribe to channel';
    }
  }
  const select = page.getByText('Select action', { exact: true });
  const selectCount = await select.count();
  if (selectCount) {
    await select.nth(0).click({ timeout: 8000 });
    await page.waitForTimeout(1000);
    return 'opened Select action menu';
  }
  throw new Error('No action control found');
}

async function clickCreate(page) {
  const createButtons = page.locator('button,[role=button]').filter({ hasText: 'Create' });
  const count = await createButtons.count();
  for (let i = count - 1; i >= 0; i -= 1) {
    const loc = createButtons.nth(i);
    if ((await loc.isVisible().catch(() => false)) && (await loc.isEnabled().catch(() => false))) {
      await loc.click({ timeout: 10000 });
      await page.waitForTimeout(4000);
      return true;
    }
  }
  return false;
}

async function createUrlLink(page, network, summary, email, password) {
  await ensureAuthenticated(page, email, password);
  await page.goto(`${baseUrl}/dashboard/links/create`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  await capture(page, 'create-link', 'auth-create-url-initial', network, 'url initial');
  await fillFirst(page, 'input[placeholder="Enter a destination URL"]', 'https://example.com/codex-rekonise-demo');
  await fillFirst(page, 'input[placeholder="Enter a title"]', `Codex URL Demo ${Date.now()}`);
  const action = await addRecentAction(page);
  await capture(page, 'create-link', 'auth-create-url-filled-action', network, 'url filled action');
  const clicked = await clickCreate(page);
  await capture(page, 'create-link', 'auth-create-url-submit-result', network, 'url submit');
  summary.created.push({ type: 'URL social gated', createClicked: clicked, action, finalUrl: page.url(), info: await info(page) });
}

async function createSnippetLink(page, network, summary, email, password) {
  await ensureAuthenticated(page, email, password);
  await page.goto(`${baseUrl}/dashboard/links/create`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  const snippetButton = page.locator('button').filter({ hasText: 'Snippet' });
  if (await snippetButton.count()) {
    await snippetButton.nth(0).click({ timeout: 8000 });
    await page.waitForTimeout(1000);
  }
  await capture(page, 'create-link', 'auth-create-snippet-initial', network, 'snippet initial');
  await fillFirst(page, 'input[placeholder="Enter a title"]', `Codex Snippet Demo ${Date.now()}`);
  await fillFirst(page, 'textarea, input[placeholder*="snippet" i], input[formcontrolname="snippet"], input[formcontrolname="content"]', 'Codex demo snippet for reverse engineering.', true);
  const action = await addRecentAction(page);
  await capture(page, 'create-link', 'auth-create-snippet-filled-action', network, 'snippet filled action');
  const clicked = await clickCreate(page);
  await capture(page, 'create-link', 'auth-create-snippet-submit-result', network, 'snippet submit');
  summary.created.push({ type: 'Snippet social gated', createClicked: clicked, action, finalUrl: page.url(), info: await info(page) });
}

async function inspectFileLink(page, network, summary, email, password) {
  await ensureAuthenticated(page, email, password);
  await page.goto(`${baseUrl}/dashboard/links/create`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  const fileButton = page.locator('button').filter({ hasText: 'File' });
  if (await fileButton.count()) {
    await fileButton.nth(0).click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  }
  await capture(page, 'create-link', 'auth-create-file-initial', network, 'file initial');
  summary.created.push({ type: 'File', createClicked: false, note: 'Inspected file link creation UI only; did not publish a file link to avoid exposing existing account files.', finalUrl: page.url(), info: await info(page) });
}

async function inspectShortLink(page, network, summary, email, password) {
  await ensureAuthenticated(page, email, password);
  await page.goto(`${baseUrl}/dashboard/links/short`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  await capture(page, 'create-link', 'auth-short-links-page', network, 'short links');
  summary.created.push({ type: 'Shortened/direct link', createClicked: false, note: 'Inspected page; creation controls not visible in captured free UI.', finalUrl: page.url(), info: await info(page) });
}

async function main() {
  const rl = readline.createInterface({ input, output, terminal: false });
  const email = (await rl.question('email: ')).trim();
  const password = await rl.question('password: ');
  rl.close();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  const page = await context.newPage();
  const network = [];
  const summary = { created: [], errors: [] };

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('rekonise.com')) return;
    const req = response.request();
    const entry = {
      method: req.method(),
      path: redactUrl(url),
      status: response.status(),
      resourceType: req.resourceType(),
      responseShape: response.headers()['content-type']?.split(';')[0] || 'unknown',
    };
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method())) {
      const postData = req.postData();
      if (postData && postData.trim().startsWith('{')) {
        try { entry.requestShape = shapeOf(JSON.parse(postData)); } catch {}
      }
      try {
        const json = await response.json();
        entry.responseShapeDetail = shapeOf(json);
      } catch {}
    }
    network.push(entry);
  });

  await login(page, email, password);

  for (const task of [createUrlLink, createSnippetLink, inspectFileLink, inspectShortLink]) {
    try {
      await task(page, network, summary, email, password);
    } catch (error) {
      summary.errors.push({ task: task.name, error: `${error.name}: ${error.message}`, currentUrl: page.url(), page: await info(page).catch(() => null) });
      await capture(page, 'create-link', `auth-${safeName(task.name)}-error`, network, `${task.name} error`);
    }
  }

  await ensureAuthenticated(page, email, password);
  await page.goto(`${baseUrl}/dashboard/links`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  summary.linksAfter = await capture(page, 'dashboard', 'auth-links-after-create-attempts', network, 'links after create attempts');

  await saveJson(out('evidence', 'notes', 'create-link-types-summary.json'), summary);
  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

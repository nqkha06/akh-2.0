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

async function screenshot(page, group, name) {
  const filePath = out('evidence', 'screenshots', group, `${name}.png`);
  await ensureDir(filePath);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function snapshot(page, group, name) {
  const filePath = out('evidence', 'snapshots', group, `${name}.html`);
  await ensureDir(filePath);
  await saveText(filePath, await page.locator('body').evaluate((body) => body.outerHTML));
}

function redactUrl(raw) {
  try {
    const url = new URL(raw);
    return url.pathname + (url.search ? '?<query>' : '');
  } catch {
    return raw;
  }
}

function responseShape(headers) {
  const type = headers['content-type'] || '';
  if (type.includes('json')) return 'json';
  if (type.includes('html')) return 'html';
  if (type.includes('javascript')) return 'javascript';
  if (type.includes('css')) return 'css';
  if (type.includes('image')) return 'image';
  return type.split(';')[0] || 'unknown';
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const network = [];
  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('rekonise.com')) return;
    const req = response.request();
    network.push({
      method: req.method(),
      path: redactUrl(url),
      status: response.status(),
      resourceType: req.resourceType(),
      responseShape: responseShape(response.headers()),
    });
  });

  await page.goto(`${baseUrl}/create`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'create-link', 'public-create-initial');
  await snapshot(page, 'create-link', 'public-create-initial');

  const createInitial = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    visibleText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 3000),
    inputs: Array.from(document.querySelectorAll('input, textarea, select')).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      placeholder: el.getAttribute('placeholder') || '',
      required: el.hasAttribute('required'),
      value: el.value || '',
    })),
    buttons: Array.from(document.querySelectorAll('button, [role=button], input[type=submit]')).map((el) => ({
      text: (el.innerText || el.getAttribute('value') || '').replace(/\s+/g, ' ').trim(),
      disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
      role: el.getAttribute('role') || '',
    })),
  }));

  await page.locator('input[placeholder="e.g. Free script pack"]').fill('Codex Test Resource');
  await page.locator('input[placeholder="https://..."]').fill('https://example.com/codex-test');
  await page.waitForTimeout(500);
  await screenshot(page, 'create-link', 'public-create-filled-no-action');
  await snapshot(page, 'create-link', 'public-create-filled-no-action');

  const selector = page.getByText('Select action', { exact: true });
  if (await selector.count()) {
    await selector.click();
    await page.waitForTimeout(700);
    await screenshot(page, 'social-links', 'public-create-action-menu');
    await snapshot(page, 'create-link', 'public-create-action-menu');
  }

  const afterMenu = await page.evaluate(() => ({
    visibleText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 5000),
    menuButtons: Array.from(document.querySelectorAll('button, [role=option], [role=menuitem], [role=button]')).map((el) => ({
      text: (el.innerText || '').replace(/\s+/g, ' ').trim(),
      role: el.getAttribute('role') || '',
      disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
    })).filter((item) => item.text),
  }));

  const afterAction = await page.evaluate(() => ({
    note: 'Action selection was not clicked because visible menu text duplicated hidden/demo page text in automation.',
    visibleText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 5000),
    inputs: Array.from(document.querySelectorAll('input, textarea, select')).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      placeholder: el.getAttribute('placeholder') || '',
      required: el.hasAttribute('required'),
      value: el.value || '',
    })),
    buttons: Array.from(document.querySelectorAll('button, [role=button], input[type=submit]')).map((el) => ({
      text: (el.innerText || el.getAttribute('value') || '').replace(/\s+/g, ' ').trim(),
      disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
    })),
  }));

  const createButtons = page.getByText('Create', { exact: true });
  const createButtonCount = await createButtons.count();
  if (createButtonCount) {
    const lastCreate = createButtons.nth(createButtonCount - 1);
    if (await lastCreate.isEnabled()) {
      await lastCreate.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'create-link', 'public-create-submit-result');
      await snapshot(page, 'create-link', 'public-create-submit-result');
    }
  }

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1000);
  await page.locator('input[placeholder="your@email.com"]').fill('not-a-real-codex-test@example.invalid');
  await page.locator('input[type="password"]').fill('wrong-password-for-ui-check');
  await page.getByText('Sign in', { exact: true }).click();
  await page.waitForTimeout(2500);
  await screenshot(page, 'authentication', 'login-invalid-credentials');
  await snapshot(page, 'public', 'login-invalid-credentials');
  const invalidLogin = await page.evaluate(() => ({
    url: location.href,
    visibleText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 3000),
  }));

  const forgot = page.getByText('Forgot password?', { exact: true });
  if (await forgot.count()) {
    await forgot.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'authentication', 'forgot-password-click-result');
    await snapshot(page, 'public', 'forgot-password-click-result');
  }
  const forgotResult = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    visibleText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 3000),
  }));

  await page.goto(`${baseUrl}/this-link-should-not-exist-codex-test`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  await screenshot(page, 'visitor-flow', 'invalid-public-link');
  await snapshot(page, 'visitor-flow', 'invalid-public-link');
  const invalidPublic = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    visibleText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 2500),
  }));

  const design = await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 45000 }).then(async () => {
    await page.waitForTimeout(1000);
    return page.evaluate(() => {
      const sample = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          selector,
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          borderColor: cs.borderColor,
          borderRadius: cs.borderRadius,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      };
      return {
        body: sample('body'),
        h1: sample('h1'),
        primaryLink: sample('a[href="/create"], a[href$="/create"]'),
        button: sample('button'),
        input: sample('input'),
        surface: sample('.card, [class*="card"], form'),
      };
    });
  });

  await saveJson(out('evidence', 'notes', 'interaction-create-public.json'), {
    createInitial,
    afterMenu,
    afterAction,
    invalidLogin,
    forgotResult,
    invalidPublic,
    design,
  });
  await saveJson(out('evidence', 'network', 'links', 'interaction-create-public.json'), network);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

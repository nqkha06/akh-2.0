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
  return value
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .toLowerCase() || 'page';
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

async function pageInfo(page) {
  return page.evaluate(() => {
    const visibleText = document.body.innerText.replace(/\s+/g, ' ').trim();
    const anchorData = Array.from(document.querySelectorAll('a')).slice(0, 200).map((a) => ({
      text: (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      href: a.href,
    }));
    const buttonData = Array.from(document.querySelectorAll('button, [role=button], input[type=submit]')).slice(0, 160).map((el) => ({
      text: (el.innerText || el.getAttribute('value') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
      type: el.getAttribute('type') || '',
      aria: el.getAttribute('aria-label') || '',
    }));
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 120).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      placeholder: el.getAttribute('placeholder') || '',
      required: el.hasAttribute('required'),
      autocomplete: el.getAttribute('autocomplete') || '',
      valueState: el.value ? '<filled>' : '',
    }));
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,[role=heading]')).slice(0, 80).map((el) =>
      (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    ).filter(Boolean);
    return {
      url: location.href,
      title: document.title,
      headings,
      textSample: visibleText.slice(0, 6000),
      links: anchorData,
      buttons: buttonData,
      inputs,
    };
  });
}

async function capture(page, group, name, network, label) {
  await page.waitForTimeout(1200);
  const screenshotPath = out('evidence', 'screenshots', group, `${name}.png`);
  await ensureDir(screenshotPath);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const snapshotGroup = group === 'authentication' ? 'public' : group;
  const snapshotPath = out('evidence', 'snapshots', snapshotGroup, `${name}.html`);
  await saveText(snapshotPath, await page.locator('body').evaluate((body) => body.outerHTML));
  const info = await pageInfo(page);
  await saveJson(out('evidence', 'notes', `${group}-${name}.json`), info);
  await saveJson(out('evidence', 'network', group === 'analytics' ? 'analytics' : group === 'visitor-flow' ? 'visitor-flow' : group === 'authentication' ? 'authentication' : 'links', `${name}.json`), network.splice(0).map((entry) => ({ ...entry, when: label })));
  return info;
}

async function clickUniqueText(page, text) {
  const locator = page.getByText(text, { exact: true });
  const count = await locator.count();
  if (count !== 1) return false;
  await locator.click({ timeout: 8000 });
  await page.waitForTimeout(1500);
  return true;
}

async function main() {
  const rl = readline.createInterface({ input, output, terminal: false });
  const email = (await rl.question('email: ')).trim();
  const password = await rl.question('password: ');
  rl.close();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
  });
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

  const run = {
    login: null,
    dashboard: null,
    visited: [],
    createAttempts: [],
    publicUrls: [],
    errors: [],
  };

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.locator('input[placeholder="your@email.com"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByText('Sign in', { exact: true }).click();
  await page.waitForTimeout(5000);

  run.login = {
    finalUrl: page.url(),
    title: await page.title(),
    textSample: await page.locator('body').evaluate((body) => body.innerText.replace(/\s+/g, ' ').slice(0, 2000)),
  };

  const authSucceeded = network.some((entry) => entry.path === '/auth/login' && entry.status >= 200 && entry.status < 300)
    && network.some((entry) => entry.path === '/users' && entry.status >= 200 && entry.status < 300);

  if (page.url().includes('/login') && !authSucceeded) {
    await page.locator('input[placeholder="your@email.com"]').fill('');
    await page.locator('input[type="password"]').fill('');
    await capture(page, 'authentication', 'authenticated-login-failed-redacted', network, 'login failed');
    await saveJson(out('evidence', 'notes', 'authenticated-run-summary.json'), run);
    await context.close();
    await browser.close();
    return;
  }

  if (page.url().includes('/login') && authSucceeded) {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
  }

  run.dashboard = await capture(page, 'dashboard', 'authenticated-home', network, 'authenticated home');

  const candidates = new Set();
  for (const link of run.dashboard.links) {
    if (!link.href || !link.href.startsWith(baseUrl)) continue;
    if (/pricing|billing|checkout|payment|upgrade|premium|pro/i.test(link.href)) continue;
    candidates.add(link.href.split('#')[0]);
  }
  for (const route of ['/dashboard', '/links', '/create', '/new', '/bio', '/account', '/settings', '/analytics']) {
    candidates.add(`${baseUrl}${route}`);
  }

  let idx = 1;
  for (const href of Array.from(candidates).slice(0, 24)) {
    try {
      await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);
      const current = page.url();
      const group = /analytics|stats/i.test(current) ? 'analytics' : /account|settings|profile/i.test(current) ? 'settings' : /bio/i.test(current) ? 'link-in-bio' : /create|new|links|dashboard/.test(current) ? 'dashboard' : 'dashboard';
      const name = `auth-${String(idx).padStart(2, '0')}-${safeName(new URL(current).pathname)}`;
      const info = await capture(page, group, name, network, `visit ${href}`);
      run.visited.push({ href, finalUrl: current, group, name, title: info.title, textSample: info.textSample.slice(0, 800) });
      idx += 1;
    } catch (error) {
      run.errors.push({ href, error: `${error.name}: ${error.message}` });
    }
  }

  const createEntryUrls = run.visited
    .map((v) => v.finalUrl)
    .filter((url) => /create|new|links/.test(url));
  if (createEntryUrls.length) {
    try {
      await page.goto(createEntryUrls[0], { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1500);
      const before = await pageInfo(page);
      run.createAttempts.push({ stage: 'open', url: page.url(), textSample: before.textSample.slice(0, 1200), inputs: before.inputs, buttons: before.buttons.slice(0, 80) });
      const titleInput = page.locator('input[placeholder="e.g. Free script pack"], input[placeholder*="title" i], input[placeholder*="name" i]').first();
      const destInput = page.locator('input[placeholder="https://..."], input[placeholder*="https" i], input[type="url"]').first();
      if (await titleInput.count()) await titleInput.fill(`Codex Demo ${Date.now()}`);
      if (await destInput.count()) await destInput.fill('https://example.com/codex-demo');
      await page.waitForTimeout(700);
      await capture(page, 'create-link', 'authenticated-create-filled-basic', network, 'authenticated create filled');
      run.createAttempts.push({ stage: 'filled-basic', info: await pageInfo(page) });
      for (const label of ['Select action', 'Add action', 'Create', 'Save', 'Publish']) {
        try {
          const clicked = await clickUniqueText(page, label);
          if (clicked) {
            await capture(page, 'create-link', `authenticated-create-click-${safeName(label)}`, network, `clicked ${label}`);
            run.createAttempts.push({ stage: `clicked ${label}`, info: await pageInfo(page) });
          }
        } catch (error) {
          run.createAttempts.push({ stage: `click ${label} failed`, error: `${error.name}: ${error.message}` });
        }
      }
    } catch (error) {
      run.errors.push({ href: 'create attempt', error: `${error.name}: ${error.message}` });
    }
  }

  await saveJson(out('evidence', 'notes', 'authenticated-run-summary.json'), run);
  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

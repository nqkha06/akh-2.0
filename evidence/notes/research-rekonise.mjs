import { chromium } from '/tmp/rekonise-pw/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const baseUrl = 'https://rekonise.com';
const out = (...parts) => path.join(root, ...parts);

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
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

async function saveJson(filePath, data) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function saveText(filePath, data) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, data);
}

async function collectPage(page, url, group, name, viewport) {
  const network = [];
  const onResponse = async (response) => {
    const request = response.request();
    const responseUrl = response.url();
    if (!responseUrl.includes('rekonise.com')) return;
    network.push({
      method: request.method(),
      path: redactUrl(responseUrl),
      status: response.status(),
      resourceType: request.resourceType(),
      responseShape: responseShape(response.headers()),
      when: `load ${url}`,
    });
  };
  page.on('response', onResponse);
  const result = {
    requestedUrl: url,
    finalUrl: null,
    title: null,
    viewport,
    links: [],
    forms: [],
    buttons: [],
    textSample: '',
    error: null,
  };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    result.finalUrl = page.url();
    result.title = await page.title();
    result.links = await page.locator('a').evaluateAll((anchors) =>
      anchors.slice(0, 120).map((a) => ({
        text: (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
        href: a.href,
      })),
    );
    result.forms = await page.locator('form').evaluateAll((forms) =>
      forms.map((form) => ({
        action: form.getAttribute('action') || '',
        method: form.getAttribute('method') || 'get',
        fields: Array.from(form.querySelectorAll('input, textarea, select')).map((el) => ({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || '',
          name: el.getAttribute('name') || '',
          placeholder: el.getAttribute('placeholder') || '',
          required: el.hasAttribute('required'),
          autocomplete: el.getAttribute('autocomplete') || '',
        })),
      })),
    );
    result.buttons = await page.locator('button, input[type=submit], [role=button]').evaluateAll((buttons) =>
      buttons.slice(0, 80).map((b) => ({
        text: (b.innerText || b.getAttribute('value') || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
        type: b.getAttribute('type') || '',
        disabled: b.hasAttribute('disabled') || b.getAttribute('aria-disabled') === 'true',
      })),
    );
    result.textSample = await page.locator('body').evaluate((body) =>
      (body.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 4000),
    );
    const png = out('evidence', 'screenshots', group, `${name}.png`);
    await ensureDir(png);
    await page.screenshot({ path: png, fullPage: true });
    const html = await page.locator('body').evaluate((body) => body.outerHTML);
    await saveText(out('evidence', 'snapshots', group === 'authentication' ? 'public' : group, `${name}.html`), html);
  } catch (error) {
    result.error = `${error.name}: ${error.message}`;
  } finally {
    page.off('response', onResponse);
    await saveJson(out('evidence', 'notes', `${group}-${name}.json`), result);
    await saveJson(out('evidence', 'network', group === 'authentication' ? 'authentication' : 'links', `${name}.json`), network);
  }
  return { result, network };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  const pages = [
    { url: `${baseUrl}/`, group: 'public', name: 'homepage-desktop' },
    { url: `${baseUrl}/login`, group: 'authentication', name: 'login' },
    { url: `${baseUrl}/register`, group: 'authentication', name: 'register' },
    { url: `${baseUrl}/forgot-password`, group: 'authentication', name: 'forgot-password' },
    { url: `${baseUrl}/password/reset`, group: 'authentication', name: 'password-reset' },
    { url: `${baseUrl}/dashboard`, group: 'dashboard', name: 'dashboard-unauthenticated' },
  ];

  const observed = [];
  for (const item of pages) {
    observed.push(await collectPage(page, item.url, item.group, item.name, { width: 1440, height: 1000 }));
  }

  const homeNote = JSON.parse(await fs.readFile(out('evidence', 'notes', 'public-homepage-desktop.json'), 'utf8'));
  const publicLinks = Array.from(new Set(homeNote.links
    .map((link) => link.href)
    .filter((href) => href && href.startsWith(baseUrl))
    .filter((href) => !/pricing|premium|pro|billing|checkout|payment|upgrade/i.test(href))
    .map((href) => href.split('#')[0])))
    .filter((href) => ![
      `${baseUrl}/`,
      `${baseUrl}/login`,
      `${baseUrl}/register`,
      `${baseUrl}/forgot-password`,
      `${baseUrl}/password/reset`,
    ].includes(href))
    .slice(0, 8);

  let index = 1;
  for (const href of publicLinks) {
    const name = `public-link-${String(index).padStart(2, '0')}-${safeName(new URL(href).pathname)}`;
    observed.push(await collectPage(page, href, 'public', name, { width: 1440, height: 1000 }));
    index += 1;
  }

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  observed.push(await collectPage(mobile, `${baseUrl}/`, 'mobile', 'homepage-mobile-390', { width: 390, height: 844 }));
  observed.push(await collectPage(mobile, `${baseUrl}/login`, 'mobile', 'login-mobile-390', { width: 390, height: 844 }));

  await context.close();

  const summary = observed.map(({ result, network }) => ({
    requestedUrl: result.requestedUrl,
    finalUrl: result.finalUrl,
    title: result.title,
    error: result.error,
    linkCount: result.links.length,
    formCount: result.forms.length,
    buttonCount: result.buttons.length,
    networkCount: network.length,
  }));
  await saveJson(out('evidence', 'notes', 'research-summary.json'), summary);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

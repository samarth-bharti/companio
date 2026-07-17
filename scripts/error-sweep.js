// Visit every route, collect console errors + page errors. Read-only.
const { chromium } = require('playwright-core');

const ROUTES = [
  '/', '/explore', '/explore?matched=1', '/quiz', '/login', '/register',
  '/pricing', '/dashboard', '/book?companion=ananya', '/companion/ananya',
  '/become-a-companion', '/become-a-companion/apply', '/companion-dashboard',
  '/how-it-works', '/safety', '/terms', '/privacy', '/refunds', '/delivery',
  '/cookies', '/trust', '/verify', '/about', '/blog', '/careers', '/press',
];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await ctx.newPage();
  const report = {};
  let cur = '';
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (t.includes('favicon') || t.includes('404')) return;
      (report[cur] ||= []).push('console: ' + t.slice(0, 160));
    }
  });
  page.on('pageerror', (e) => { (report[cur] ||= []).push('pageerror: ' + String(e).slice(0, 160)); });

  for (const r of ROUTES) {
    cur = r;
    try {
      await page.goto('http://localhost:3003' + r, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(1200);
    } catch (e) {
      (report[cur] ||= []).push('NAVFAIL: ' + String(e).slice(0, 100));
    }
  }
  const dirty = Object.entries(report).filter(([, v]) => v.length);
  console.log(dirty.length ? JSON.stringify(Object.fromEntries(dirty), null, 1) : 'CLEAN — no console/page errors on any route');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

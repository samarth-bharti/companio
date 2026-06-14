// One-off: verify hydration error + target-ref warning are gone. Read-only.
const { chromium } = require('playwright-core');

const ROUTES = ['/', '/explore', '/pricing', '/dashboard', '/lounge', '/feed', '/quiz', '/how-it-works', '/about', '/companion/ananya'];
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await ctx.newPage();
  const report = {};
  let cur = '';
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (t.includes('favicon') || t.includes('404')) return;
      (report[cur] ||= []).push('console: ' + t.slice(0, 200));
    }
  });
  page.on('pageerror', (e) => { (report[cur] ||= []).push('pageerror: ' + String(e).slice(0, 200)); });

  for (const r of ROUTES) {
    cur = r;
    try {
      await page.goto('http://localhost:3000' + r, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(1500);
    } catch (e) {
      (report[cur] ||= []).push('NAVFAIL: ' + String(e).slice(0, 120));
    }
  }
  const dirty = Object.entries(report).filter(([, v]) => v.length);
  console.log(dirty.length ? JSON.stringify(Object.fromEntries(dirty), null, 1) : 'CLEAN — no console/page errors on tested routes');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

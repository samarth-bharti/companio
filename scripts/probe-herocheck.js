// Verify redesigned hero: centered text, no phone, scroll states, 3D stickers, aurora button. Read-only.
const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));

  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000); // wait out intro
  await page.mouse.move(5, 5);

  // State 0 (top) — centered, no phone
  await page.screenshot({ path: 'scripts/hero-top.png' });

  // Button hover (aurora) before scrolling away
  const btn = page.locator('#hero').getByRole('link', { name: 'Find a companion' }).first();
  await btn.hover();
  await page.waitForTimeout(550);
  await btn.screenshot({ path: 'scripts/hero-btn-hover.png' });
  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);

  // Sticker sweep (3D images)
  for (const y of [380, 430]) { await page.mouse.move(250, y); await page.mouse.move(1000, y, { steps: 16 }); await page.waitForTimeout(80); }
  await page.mouse.move(640, 410, { steps: 6 });
  await page.screenshot({ path: 'scripts/hero-stickers.png' });
  await page.mouse.move(5, 5);

  // Scroll to state 1, then state 2
  await page.evaluate(() => window.scrollTo({ top: 580, behavior: 'auto' }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scripts/hero-state1.png' });

  await page.evaluate(() => window.scrollTo({ top: 1050, behavior: 'auto' }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scripts/hero-state2.png' });

  // Confirm no phone frame remains in the hero DOM
  const phoneCount = await page.evaluate(() =>
    document.querySelectorAll('#hero [class*="rounded-[2.5rem]"]').length);
  console.log('phone-frame nodes in hero:', phoneCount);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console/page errors');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

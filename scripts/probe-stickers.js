// Verify hero cursor stickers spawn on mouse move + capture a screenshot. Read-only.
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
  await page.waitForTimeout(1500); // let intro settle

  // Sweep the mouse across the hero in steps to spawn the trail.
  const ys = [380, 420, 460, 440, 400];
  for (let i = 0; i < ys.length; i++) {
    await page.mouse.move(200, ys[i]);
    await page.mouse.move(1050, ys[i], { steps: 25 });
    await page.waitForTimeout(120);
  }

  // Count live sticker nodes mid-animation.
  await page.mouse.move(600, 430, { steps: 15 });
  const count = await page.evaluate(() => document.querySelectorAll('#hero span[style*="companio-sticker"]').length);

  await page.screenshot({ path: 'scripts/sticker-shot.png' });
  console.log('live sticker nodes during sweep:', count);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console/page errors');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

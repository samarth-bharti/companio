// Verify hero CTA hover (color overlay opacity + text-roll transforms). Read-only.
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

  const btn = page.locator('#hero').getByRole('link', { name: 'Find a companion' }).first();

  // Inspect overlay opacity + the two label copies' transforms at rest vs hover.
  const readState = () => btn.evaluate((el) => {
    const overlay = el.querySelector('span[aria-hidden="true"]'); // first aria-hidden = color overlay
    const copies = el.querySelectorAll('span > span'); // the two stacked labels
    return {
      overlayOpacity: overlay ? getComputedStyle(overlay).opacity : 'n/a',
      labelA: copies[0] ? getComputedStyle(copies[0]).transform : 'n/a',
      labelB: copies[1] ? getComputedStyle(copies[1]).transform : 'n/a',
    };
  });

  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);
  const rest = await readState();
  await btn.screenshot({ path: 'scripts/btn-rest.png' });

  await btn.hover();
  await page.waitForTimeout(600); // settle
  const hover = await readState();
  await btn.screenshot({ path: 'scripts/btn-hover.png' });

  console.log('REST :', JSON.stringify(rest));
  console.log('HOVER:', JSON.stringify(hover));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console/page errors');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

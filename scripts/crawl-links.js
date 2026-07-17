// Crawl every route, collect all internal <a href> + any 404 responses,
// and report hrefs that point to non-existent routes.
const { chromium } = require('playwright-core');

const ROUTES = [
  '/', '/explore', '/explore?matched=1', '/quiz', '/login', '/register',
  '/pricing', '/dashboard', '/book?companion=ananya', '/companion/ananya',
  '/become-a-companion', '/become-a-companion/apply', '/companion-dashboard',
  '/how-it-works', '/safety', '/terms', '/community-guidelines', '/privacy',
  '/refunds', '/delivery', '/cookies', '/trust', '/verify',
];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const notFound = new Set();
  page.on('response', (r) => {
    const u = r.url();
    if (r.status() === 404 && u.includes('localhost:3003') && !u.includes('_next') && !u.includes('favicon')) {
      notFound.add(u.replace('http://localhost:3003', '').split('?')[0]);
    }
  });

  const allHrefs = new Set();
  for (const route of ROUTES) {
    try {
      await page.goto('http://localhost:3003' + route, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(800);
      const hrefs = await page.$$eval('a[href]', (as) =>
        as.map((a) => a.getAttribute('href')).filter((h) => h && h.startsWith('/')));
      hrefs.forEach((h) => allHrefs.add(h.split('?')[0].split('#')[0]));
    } catch (e) {
      console.log('NAV FAIL', route, String(e).slice(0, 80));
    }
  }

  // Known existing routes
  const known = new Set(ROUTES.map((r) => r.split('?')[0]).concat(['/']));
  const unknownHrefs = [...allHrefs].filter((h) => h && !known.has(h) && !h.startsWith('/companion/'));

  console.log('=== 404 resources hit ===');
  console.log(JSON.stringify([...notFound], null, 1));
  console.log('=== internal hrefs to routes not in known-list ===');
  console.log(JSON.stringify(unknownHrefs.sort(), null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

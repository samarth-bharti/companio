import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * SITE_URL is computed at module scope, so each case re-imports the module with a
 * fresh environment. resetModules() is what makes that re-evaluation happen.
 */
async function siteUrlWith(env: Record<string, string | undefined>): Promise<string> {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const mod = await import('@/lib/seo');
  return mod.SITE_URL;
}

const KEYS = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL',
  'NEXT_PUBLIC_VERCEL_URL',
];

describe('SITE_URL', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) saved[k] = process.env[k];
    for (const k of KEYS) delete process.env[k];
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('uses an explicit NEXT_PUBLIC_SITE_URL', async () => {
    expect(await siteUrlWith({ NEXT_PUBLIC_SITE_URL: 'https://trycompanio.com' })).toBe(
      'https://trycompanio.com',
    );
  });

  it('strips a trailing slash so canonical URLs do not double up', async () => {
    expect(await siteUrlWith({ NEXT_PUBLIC_SITE_URL: 'https://trycompanio.com/' })).toBe(
      'https://trycompanio.com',
    );
  });

  it('IGNORES the your-app placeholder and falls back to the platform domain', async () => {
    // This is the exact value that shipped: a sitemap for a domain nobody owns.
    const url = await siteUrlWith({
      NEXT_PUBLIC_SITE_URL: 'https://your-app.vercel.app',
      NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: 'companio-bice.vercel.app',
    });
    expect(url).toBe('https://companio-bice.vercel.app');
  });

  it('prefers the stable production domain over the per-deployment one', async () => {
    const url = await siteUrlWith({
      NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: 'companio-bice.vercel.app',
      NEXT_PUBLIC_VERCEL_URL: 'companio-9x2h4k-samarth.vercel.app',
    });
    expect(url).toBe('https://companio-bice.vercel.app');
  });

  it('falls back to the deployment URL when that is all there is', async () => {
    expect(
      await siteUrlWith({ NEXT_PUBLIC_VERCEL_URL: 'companio-9x2h4k.vercel.app' }),
    ).toBe('https://companio-9x2h4k.vercel.app');
  });

  it('falls back to localhost only when nothing else is known', async () => {
    expect(await siteUrlWith({})).toBe('http://localhost:3000');
  });
});

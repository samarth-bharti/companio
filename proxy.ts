// proxy.ts — security headers on every response + rate limiting on sensitive
// API writes. Runs on the edge for all routes except static assets.
//
// Renamed from middleware.ts: Next 16 deprecated the `middleware` file
// convention in favour of `proxy` (same capabilities, same `config.matcher`).
//
// CSP is sent as Content-Security-Policy-Report-Only on purpose: it observes
// violations (logged by the browser) WITHOUT breaking the app, so we can tighten
// it against the real third parties (GA, PostHog, Sentry, Vercel, Spline,
// Razorpay, Unsplash) before flipping it to the enforcing header.
//
// Where the flip stands (checked 2026-07-14, in a browser, against this policy):
//   Zero violations on /, /explore, /explore?view=map, /spin, /quiz, /pricing,
//   /dashboard, /how-it-works, /admin. The allowlist is correct for everything
//   this deployment can currently reach.
//
// It is NOT flipped, for one reason: the Razorpay Checkout sheet cannot be
// exercised without live keys, and a CSP that blocks the payment sheet is worse
// than no CSP. The origins Razorpay needs are now listed above, but listed from
// their documentation — not from watching a real payment succeed.
//
// To flip: run one real checkout with live keys, confirm the browser console is
// clean, then change the header name below to 'Content-Security-Policy'. Note
// that script-src still carries 'unsafe-inline' and 'unsafe-eval' (Next's inline
// bootstrap and Turbopack), so enforcing buys the origin allowlist — connect-src
// is the valuable one, it stops exfiltration to an unknown host — but it is not
// yet XSS-proof. Nonces are the follow-on.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), browsing-topics=()',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.posthog.com https://*.spline.design https://checkout.razorpay.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  // Map tiles are <img> elements. Neither OpenStreetMap nor MapTiler was listed
  // here, so the explore map would go blank the day CSP flips from Report-Only
  // to enforcing. Keep this in step with lib/map/tiles.ts.
  // Razorpay's own CSP requirements are wider than "the script origin": Checkout
  // pulls its assets from cdn.razorpay.com, beacons to lumberjack.razorpay.com,
  // and frames api.razorpay.com in addition to checkout.razorpay.com. None of
  // those three were listed. Under Report-Only that costs nothing — but it means
  // the day this header is switched to enforcing, the payment sheet is exactly
  // what breaks, which is the one thing worse than having no CSP at all.
  // NOT verified against a live gateway (this deployment has no Razorpay keys) —
  // taken from Razorpay's published integration requirements. Confirm with a real
  // checkout before enforcing.
  "img-src 'self' data: blob: https://images.unsplash.com https://cdn.razorpay.com https://*.googletagmanager.com https://*.google-analytics.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://api.maptiler.com",
  "font-src 'self' data: https://cdn.razorpay.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com https://api.razorpay.com https://lumberjack.razorpay.com https://*.spline.design",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.spline.design",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Per-bucket limits for sensitive POST paths (auth, payments, messaging).
const LIMITS: { test: RegExp; limit: number; windowMs: number; bucket: string }[] = [
  { test: /^\/api\/auth\//, limit: 20, windowMs: 60_000, bucket: 'auth' },
  { test: /^\/api\/razorpay\//, limit: 15, windowMs: 60_000, bucket: 'pay' },
  { test: /^\/api\/messages\//, limit: 30, windowMs: 60_000, bucket: 'msg' },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === 'POST' && pathname.startsWith('/api/')) {
    const rule = LIMITS.find((r) => r.test.test(pathname));
    if (rule) {
      const rl = await rateLimit({
        key: clientKey(req, rule.bucket),
        limit: rule.limit,
        windowMs: rule.windowMs,
      });
      if (!rl.ok) {
        return NextResponse.json(
          { error: 'rate_limited' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
        );
      }
    }
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  res.headers.set('Content-Security-Policy-Report-Only', CSP);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// lib/analytics.ts
//
// Isomorphic analytics facade — the ONE place product code calls to record an
// event. It fans out to whichever sinks are configured (GA4 via gtag, PostHog)
// and silently no-ops when none are configured or consent is not granted.
//
// Design rules:
//   1. Analytics must NEVER throw into product code — every send is try/caught.
//   2. Nothing fires unless consent === 'granted' (see lib/consent.ts).
//   3. Sink SDKs are referenced off `window`, never imported, so this file adds
//      zero bundle weight and works whether or not a sink script loaded.

import type { EventMap, EventName } from './analytics-events';
import { getConsent } from './consent';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    posthog?: {
      capture: (event: string, props?: Record<string, unknown>) => void;
      identify: (id: string, traits?: Record<string, unknown>) => void;
    };
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
export const analyticsConfigured = Boolean(GA_ID || POSTHOG_KEY);

function allowed(): boolean {
  return typeof window !== 'undefined' && getConsent() === 'granted';
}

/** Record a typed product event. No-ops without consent / configured sinks. */
export function track<K extends EventName>(name: K, props: EventMap[K]): void {
  if (!allowed()) return;
  const payload = props as Record<string, unknown>;
  try {
    window.gtag?.('event', name, payload);
    window.posthog?.capture(name, payload);
  } catch {
    /* analytics is best-effort; never surface to the user */
  }
}

/** Record a single-page-app navigation. */
export function pageview(path: string): void {
  if (!allowed()) return;
  try {
    if (GA_ID) window.gtag?.('event', 'page_view', { page_path: path });
    window.posthog?.capture('$pageview', { path });
  } catch {
    /* best-effort */
  }
}

/** Associate subsequent events with a user id (call after login). */
export function identify(id: string, traits?: Record<string, unknown>): void {
  if (!allowed()) return;
  try {
    if (GA_ID) window.gtag?.('set', { user_id: id });
    window.posthog?.identify(id, traits);
  } catch {
    /* best-effort */
  }
}

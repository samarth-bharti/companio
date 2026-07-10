'use client';

// ConsentBanner — DPDP (India) / GDPR analytics consent. Shows only while the
// choice is 'unset'. Accepting flips Google Consent Mode to granted AND records
// consent so lib/analytics begins sending; declining keeps everything dormant.
//
// Visibility is read via useSyncExternalStore (not useState+effect) so it is
// hydration-safe — the server renders nothing, the client reads localStorage
// after hydration, and the banner live-hides the instant a choice is made.
// Self-contained styling (no shared Button import) to stay low-risk in the
// shared repo and render correctly regardless of design-token drift.

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { getConsent, setConsent, onConsentChange } from '@/lib/consent';

const isUndecided = () => getConsent() === 'unset';
const serverSnapshot = () => false; // never render on the server → no flash

export function ConsentBanner() {
  const show = useSyncExternalStore(onConsentChange, isUndecided, serverSnapshot);
  if (!show) return null;

  function choose(value: 'granted' | 'denied') {
    setConsent(value); // dispatches the consent event → this component re-hides
    if (value === 'granted' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-xl rounded-2xl border border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:left-4 sm:right-auto sm:bottom-4"
    >
      <p className="text-sm leading-relaxed text-neutral-700">
        We use privacy-friendly analytics to understand what works and improve
        Companio. No ads, no selling data. See our{' '}
        <Link href="/privacy" className="font-medium underline">
          Privacy Policy
        </Link>
        .
      </p>
      {/* min-h-11 = 44px, the smallest comfortable touch target. These two are
          the first buttons every visitor on a phone taps, and they were 36px. */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => choose('denied')}
          className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose('granted')}
          className="inline-flex min-h-11 items-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

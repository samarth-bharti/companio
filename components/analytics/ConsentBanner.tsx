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

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { getConsent, setConsent, onConsentChange } from '@/lib/consent';

const isUndecided = () => getConsent() === 'unset';
const serverSnapshot = () => false; // never render on the server → no flash

// useLayoutEffect warns during SSR; this component renders nothing on the server,
// but the import is still evaluated there.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function ConsentBanner() {
  const show = useSyncExternalStore(onConsentChange, isUndecided, serverSnapshot);
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Reserve the banner's height at the bottom of the document while it is up.
   *
   * This is a floating, fixed-position card, so it covers whatever page content
   * happens to sit underneath it — and on /book, what sat underneath it was the
   * wizard's **Continue** button. `document.elementFromPoint()` at the centre of
   * that button returned the banner's own paragraph: a first-time visitor, who by
   * definition has not answered the banner yet, could not start a booking. They
   * would click and nothing would happen, because they were clicking the banner.
   *
   * The button lives at the end of the document, so no amount of scrolling moved
   * it clear. Padding the body by the banner's height creates the room to scroll
   * it out from under, and it costs nothing once the banner is dismissed.
   */
  useIsomorphicLayoutEffect(() => {
    if (!show) return;
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      // 16px so the content clears the banner rather than kissing its edge, and
      // + the mobile tab bar's height (--mobile-nav-h, 0 on desktop) so the two
      // fixed bars stack instead of the nav covering the banner's buttons.
      document.body.style.paddingBottom = `calc(var(--mobile-nav-h, 0px) + ${el.offsetHeight + 16}px)`;
    };
    apply();

    // The banner wraps to a different height on a narrow screen and on rotate.
    const ro = new ResizeObserver(apply);
    ro.observe(el);

    return () => {
      ro.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [show]);

  if (!show) return null;

  // setConsent() now pushes the Consent Mode update itself, so the banner and the
  // dashboard's opt-out switch cannot drift into disagreeing about what gtag was told.
  function choose(value: 'granted' | 'denied') {
    setConsent(value); // dispatches the consent event → this component re-hides
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Cookie consent"
      // Sit above the mobile tab bar (--mobile-nav-h, 0 on desktop → 1rem) so its
      // Accept/Decline buttons are never hidden behind the fixed nav.
      style={{ bottom: "calc(var(--mobile-nav-h, 0px) + 1rem)" }}
      className="fixed inset-x-3 z-40 mx-auto max-w-xl rounded-2xl border border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:left-4 sm:right-auto"
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

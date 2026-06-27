'use client';

// PostHogProvider — product analytics (funnels, retention, autocapture).
// PostHog uses cookies / localStorage for a distinct id, so it is strictly
// consent-gated: the SDK is not even downloaded until the visitor accepts.
// Once initialised it exposes window.posthog, which lib/analytics fans out to.
//
// Dormant by default: with NEXT_PUBLIC_POSTHOG_KEY unset this is a no-op.

import { useEffect } from 'react';
import { POSTHOG_KEY } from '@/lib/analytics';
import { getConsent, onConsentChange } from '@/lib/consent';

const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function PostHogProvider() {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    let started = false;

    async function start() {
      if (started || getConsent() !== 'granted') return;
      started = true;
      const posthog = (await import('posthog-js')).default;
      posthog.init(POSTHOG_KEY, {
        api_host: HOST,
        capture_pageview: false, // $pageview is sent from lib/analytics
        capture_pageleave: true,
        autocapture: true,
        persistence: 'localStorage+cookie',
      });
      // Expose the narrow shape lib/analytics depends on.
      window.posthog = {
        capture: (event, props) => {
          posthog.capture(event, props);
        },
        identify: (id, traits) => {
          posthog.identify(id, traits);
        },
      };
    }

    start();
    return onConsentChange(start);
  }, []);

  return null;
}

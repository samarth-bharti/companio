// Sentry client init (Next picks up instrumentation-client.ts automatically).
// Dormant unless NEXT_PUBLIC_SENTRY_DSN is set. Session replay is disabled to
// stay privacy-light; only errors + a light trace sample are captured.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// Lets Sentry tie client-side navigations to traces (no-op when disabled).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

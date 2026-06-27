// Sentry server-side init. Loaded by instrumentation.ts on the Node runtime.
// Fully dormant unless SENTRY_DSN is set (enabled:false → no network, no cost).

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
});

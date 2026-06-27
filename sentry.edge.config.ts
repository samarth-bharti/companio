// Sentry edge-runtime init. Loaded by instrumentation.ts on the edge runtime.
// Dormant unless SENTRY_DSN is set.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
});

// Next.js instrumentation hook. Initialises Sentry per runtime and forwards
// server request errors to it. All Sentry calls are dormant without SENTRY_DSN.
// (Manual init, no withSentryConfig wrapper — keeps the build light; source-map
// upload is the only feature skipped, irrelevant until a DSN is configured.)

export async function register() {
  // Validate server env at boot — fails fast on a malformed value, no-op when
  // everything is unset (dormant mode).
  const { getServerEnv } = await import('@/lib/env');
  getServerEnv();

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(err: unknown, request: unknown, context: unknown) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  (Sentry.captureRequestError as (...a: unknown[]) => void)(err, request, context);
}

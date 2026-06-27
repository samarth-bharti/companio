# Analytics & monitoring

Like the backend, the monitoring stack is **fully wired but dormant**: every sink
is in place and no-ops until you paste its key, and **nothing fires until the
visitor accepts the consent banner** (DPDP / GDPR). The app ships with zero
analytics config and behaves identically.

## The one place product code calls

`lib/analytics.ts` is the single facade. Product code only ever calls:

```ts
import { track } from '@/lib/analytics';
track('booking_complete', { companionId, bookingId });
```

`track()` fans out to whatever is configured (GA4 via `gtag`, PostHog) and is
guaranteed never to throw into product code. It no-ops unless consent is granted.
`pageview()` and `identify()` exist for navigation and post-login association.

Every event is typed in `lib/analytics-events.ts` (`EventMap`) — adding an event
is one line there, and `track()` then enforces its payload at every call site.
Wired funnel events today: `login`, `signup`, `unlock_intent`, `unlock_success`,
`booking_start`, `booking_complete` (+ `web_vitals`, `page_view` automatically).

## Sinks

| Sink | Env var | What it gives | Consent |
|------|---------|---------------|---------|
| **Google Analytics 4** | `NEXT_PUBLIC_GA_ID` | Pageviews, events, funnels | Consent Mode v2; storage denied until accept |
| **PostHog** | `NEXT_PUBLIC_POSTHOG_KEY` (+ `_HOST`) | Product analytics, autocapture, funnels | SDK only downloads after accept |
| **Sentry** | `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | Client + server error monitoring | Errors only, replay off |
| **Vercel Analytics** | _(automatic on Vercel)_ | Cookieless traffic | Cookieless — no banner needed |
| **Vercel Speed Insights** | _(automatic on Vercel)_ | Real-user Core Web Vitals | Cookieless |

Core Web Vitals are also pushed through `track('web_vitals', …)` via Next's
`useReportWebVitals`, so they land in GA4 / PostHog too.

## Consent model

`lib/consent.ts` holds the state: `granted | denied | unset`. While `unset`,
nothing fires and `components/analytics/ConsentBanner.tsx` is shown (read via
`useSyncExternalStore`, so it is hydration-safe and never flashes for visitors
who already chose). Accepting flips Google Consent Mode to granted and lets
PostHog initialise; declining keeps everything dormant.

## Going live

1. **GA4** — create a Web data stream, paste the `G-XXXXXXXXXX` id into
   `NEXT_PUBLIC_GA_ID`.
2. **PostHog** (optional) — project API key → `NEXT_PUBLIC_POSTHOG_KEY`
   (set `NEXT_PUBLIC_POSTHOG_HOST` to the EU host if relevant).
3. **Sentry** (optional) — DSN → `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`.
4. **Vercel Analytics / Speed Insights** — turn them on in the Vercel project;
   no code change needed.

See [`.env.example`](../.env.example) for the annotated variables.

## Files

| File | Purpose |
|------|---------|
| `lib/analytics.ts` | The `track` / `pageview` / `identify` facade |
| `lib/analytics-events.ts` | Typed `EventMap` taxonomy |
| `lib/consent.ts` | Consent state + change subscription |
| `components/analytics/AnalyticsProvider.tsx` | Mounts sinks + SPA pageviews |
| `components/analytics/GoogleAnalytics.tsx` | GA4 + Consent Mode loader |
| `components/analytics/WebVitals.tsx` | Core Web Vitals → `track` |
| `components/analytics/PostHogProvider.tsx` | Consent-gated PostHog init |
| `components/analytics/ConsentBanner.tsx` | DPDP/GDPR consent UI |
| `instrumentation*.ts` + `sentry.*.config.ts` | Sentry client/server/edge init |

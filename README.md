# Companio

A paid **platonic companionship marketplace** — book an ID-checked companion for
real-world activities (city walks, café chats, museum tours). Warm, premium,
and **strictly platonic**: no romantic/sexual/dating framing anywhere (legal +
trust + payment-processor requirement — see [the hard rule](#hard-rules)).

> **"ID-checked", not "verified".** No companion is verified: the `verified` column
> is operator-owned and false for all of them, and there is no Aadhaar/KYC vendor
> integrated. `lib/trust.ts` is the single source of truth for what the product may
> claim, and `tests/trustClaims.test.ts` fails the build if a claim it cannot keep
> reappears. See [`docs/STATUS.md`](docs/STATUS.md).

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
framer-motion**. Backend seam is **Prisma + Neon Postgres · Auth.js · Razorpay ·
zod** (see [`docs/BACKEND.md`](docs/BACKEND.md)).

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (see note on memory below)
```

> **Memory note:** this machine is memory-constrained for Next 16 + Turbopack.
> If dev/build freezes or OOMs, bump the Node heap:
> ```powershell
> $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run dev    # build: 6144
> ```

The app runs fully on **mock data** out of the box (`NEXT_PUBLIC_DATA_CLIENT=local`).
No database or keys are needed until you wire the backend.

### What's real vs. mock

The **frontend is fully built**. With no keys it runs on browser `localStorage`
(per-device, no sign-in required) and says so. The **backend is complete and
tested**: the full Prisma schema, every API route, server-authoritative payments,
and a 200-test suite, all behind the `lib/dataClient.ts` seam.

Sign-in and payment are **real when configured** and **honestly simulated when
not**. Supplying `GOOGLE_CLIENT_ID` + `NEXTAUTH_SECRET` + `DATABASE_URL` turns on
real Google sign-in; supplying `NEXT_PUBLIC_RAZORPAY_KEY_ID` turns on real
payment *and switches the demo path off entirely* — a keyed build will never
grant a paid benefit without a verified payment.

> **`NEXT_PUBLIC_DATA_CLIENT=http` has never been run against a real database.**
> The core components (nav, auth, dashboard, explore) go through `dataClient`
> now; the rest of the tree still reads `localStorage` directly. Finish that
> sweep before flipping the flag. See [`docs/STATUS.md`](docs/STATUS.md) for the
> honest picture and [`docs/BACKEND.md`](docs/BACKEND.md) for the recipe.
>
> **Three env vars gate real behaviour and cannot be guessed from the code:**
> `ADMIN_EMAILS` (without it nobody can ever reach `/admin`),
> `MARKETPLACE_PAYMENTS_ENABLED` (leave unset — RBI Payment Aggregator rules),
> and `NEXT_PUBLIC_MAPTILER_KEY` (map tiles). See
> [`docs/GO-LIVE.md`](docs/GO-LIVE.md#vars-added-2026-07-10--read-these-before-deploying).

## Scripts

| Command          | What it does                                  |
|------------------|-----------------------------------------------|
| `npm run dev`    | Dev server (Turbopack)                        |
| `npm run build`  | Production build                              |
| `npm start`      | Serve the production build                     |
| `npm run lint`   | ESLint                                         |
| `npm test`       | Vitest unit + route tests                      |
| `npx prisma ...` | DB tooling (see `docs/BACKEND.md`)            |

## Project shape

```
app/            App Router routes (pages + app/api/** backend)
components/      UI, grouped by feature (home, explore, booking, auth, lounge, feed, …)
lib/            Client state (journeyState, appState), data (companions, cities),
                the data-access seam (dataClient.ts), and server-only helpers (lib/server/**)
prisma/         schema.prisma + seed.ts
tests/          Vitest suites (serialize, validation, http, payments, routes, dataClient)
docs/           This documentation
```

## Documentation

- [`docs/STATUS.md`](docs/STATUS.md) — **start here**: what's done, what's next, blockers.
- [`docs/GO-LIVE.md`](docs/GO-LIVE.md) — launch runbook, real infra costs, deploy steps.
- [`docs/BACKEND.md`](docs/BACKEND.md) — API routes, the data-client seam, and how to go live.
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — consent-gated GA4 / PostHog / Sentry wiring.
- [`docs/LAUNCH-AUDIT.md`](docs/LAUNCH-AUDIT.md) — security/UX audit (25 Jun; partly superseded).
- [`docs/journey-spec.md`](docs/journey-spec.md) — the master design/journey spec (historical).

## Hard rules

- **Strictly platonic.** No romantic/sexual/flirtatious copy or imagery, no
  couple photos. "People having fun" = friends/groups/activities. This is a
  legal + processor + trust requirement, not a style choice.
- **Never claim something the product doesn't do.** "₹ held in escrow" was
  written into 18 places — including the Terms of Service — for a feature that
  does not exist. On a payments product in India that is a liability, not a
  copy nit. If a claim isn't true today, don't ship it.
- **v1 sells the ₹199 unlock only.** Taking a meetup fee and paying a companion
  from it is unlicensed Payment Aggregator activity under RBI. See
  [`docs/STATUS.md`](docs/STATUS.md#v1-scope-decision-locked-2026-07-10).
- **Line endings: CRLF.** Keep edits surgical; do not mass-reformat (shared repo).

# Companio

A paid **platonic companionship marketplace** — book a verified companion for
real-world activities (city walks, café chats, museum tours). Warm, premium,
and **strictly platonic**: no romantic/sexual/dating framing anywhere (legal +
trust + payment-processor requirement — see [the hard rule](#hard-rules)).

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

The **frontend is fully built** and runs today on browser `localStorage` (per-device,
no sign-in required). The **backend is complete and tested but dormant**: the full
Prisma schema, every API route, server-authoritative payments, and a 150-test suite
all exist behind the `lib/dataClient.ts` seam, but **no UI call site imports it yet**.

> **Flipping `NEXT_PUBLIC_DATA_CLIENT=http` does nothing on its own.** The
> `httpDataClient` has zero importers — ~36 components read `localStorage`
> directly. Going live is a repo-wide async migration, plus real auth. Today
> **login is fake** (`LoginForm` never calls next-auth) and **payment is a demo
> animation**. See [`docs/STATUS.md`](docs/STATUS.md#what-actually-blocks-launch)
> for the honest picture, and
> [`docs/BACKEND.md`](docs/BACKEND.md#wiring-the-ui-to-the-backend-the-remaining-gap)
> for the migration recipe.

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

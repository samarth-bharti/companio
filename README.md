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
Prisma schema, every API route, server-authoritative payments, and a 96-test suite
all exist behind the `lib/dataClient.ts` seam, but no UI call site imports it yet.
Flipping `NEXT_PUBLIC_DATA_CLIENT=http` (after providing a database + auth + keys)
switches the app onto the real backend — see
[`docs/BACKEND.md`](docs/BACKEND.md#going-live-what-you-must-provide) for the steps
and the call-site migration recipe.

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
- [`docs/BACKEND.md`](docs/BACKEND.md) — API routes, the data-client seam, and how to go live.
- [`docs/backend-plan.md`](docs/backend-plan.md) — original step-by-step migration checklist.
- [`docs/journey-spec.md`](docs/journey-spec.md) — the master design/journey spec.

## Hard rules

- **Strictly platonic.** No romantic/sexual/flirtatious copy or imagery, no
  couple photos. "People having fun" = friends/groups/activities. This is a
  legal + processor + trust requirement, not a style choice.
- **Line endings: CRLF.** Keep edits surgical; do not mass-reformat (shared repo).

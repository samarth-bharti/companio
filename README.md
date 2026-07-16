# Companio

A **platonic companionship marketplace** — book an ID-checked companion for
real-world activities (city walks, café chats, museum tours). Warm, premium, and
**strictly platonic**: no romantic, sexual or dating framing anywhere. That is a
legal, payment-processor and trust requirement, not a style choice.

> **"ID-checked", not "verified".** No companion is *verified*: the `verified`
> column is operator-owned and true of nobody, and no KYC vendor is integrated.
> `lib/trust.ts` is the single source of truth for what the product may claim,
> and `tests/trustClaims.test.ts` **fails the build** if a claim it cannot keep
> reappears.

**Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma +
Neon Postgres · Auth.js · Razorpay · sharp + Vercel Blob · Vitest**

---

## Where the project actually is

Companio has **not launched**. It has no companions, no members and no revenue.

- The software is real and tested: **443 tests**, clean typecheck, clean build,
  and the full flow driven in a browser against a real Neon database.
- The catalogue is **empty on purpose**. It used to hold 22 invented people with
  stock portraits; selling access to them would have been selling access to
  people who cannot be met. Real companions arrive through applications and a
  hand-checked ID.
- Pass checkout is **built, tested, and switched off** (`PASS_SALES_ENABLED`).
  A pass buys access to the catalogue, so there is nothing to sell yet.

**The launch is the companion funnel, not the buyer funnel.** See
[`docs/STATUS.md`](docs/STATUS.md).

## What it sells

One thing: **the pass**. Four durations, same access, no auto-renewal and no
auto-debit — it lapses and the member chooses to buy again.

| Tier | Price |
|---|---|
| 1 month | ₹199 |
| 3 months | ₹499 |
| 12 months | ₹999 |
| Lifetime | ₹1999 |

Prices live in `lib/money.ts` (`PASS_TIERS`) and **nothing may derive a price
independently** — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#1-the-client-never-sends-a-price).

Meetups themselves are **not charged for**. Paying a companion out of money we
collected is unlicensed Payment Aggregator activity under RBI rules, so
`booking`/`credits`/`plus` are refused outright. That gate is a licence boundary,
not a feature flag.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

With no keys the app runs on browser `localStorage` (`NEXT_PUBLIC_DATA_CLIENT=local`)
and says so on screen. No database or keys needed to look around.

> **Memory note:** Next 16 + Turbopack is heavy. If dev or build OOMs:
> ```powershell
> $env:NODE_OPTIONS="--max-old-space-size=6144"; npm run build
> ```

### Running against a real database

Set `NEXT_PUBLIC_DATA_CLIENT=http` plus `DATABASE_URL` / `DIRECT_URL` /
`NEXTAUTH_SECRET`. This path is **proven** — sign-in, paywall, checkout,
approval and the admin panel have all been driven against real Neon.

The Prisma CLI reads `.env`, **not** `.env.local` (Next reads `.env.local`). To
run migrations locally:

```bash
node -e "require('dotenv').config({path:'.env.local'});require('child_process').execSync('npx prisma migrate deploy',{stdio:'inherit',env:process.env})"
```

### Testing it without any keys

Both are impossible in production and turn themselves off the moment real keys
exist.

| Want to test | Set | What happens |
|---|---|---|
| **Sign-in** | nothing | With no `RESEND_API_KEY` the code is shown **on screen**. Production refuses to run without email at all, so no real user's code can be handed back. |
| **The pass** | `ALLOW_TEST_CHECKOUT=true` **and** `PASS_SALES_ENABLED=true` | Checkout completes for free via `POST /api/test-checkout`, granting through `settlePurchase()` — the same function the real webhook calls. **Setting `RAZORPAY_KEY_ID` kills it dead**, flag or no flag. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (runs migrations first — production only) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest — 443 tests, no database needed |
| `node scripts/gen-icons.mjs` | Regenerate favicon + PWA icons from the brand mark |
| `node scripts/gen-og.mjs` | Regenerate the social card |

## Project shape

```
app/            Routes. app/api/** is the backend; app/admin/** is the operator panel.
components/     UI, grouped by feature (home, explore, booking, companion, admin…)
lib/
  money.ts      Prices. Pure. The only source.
  server/       Server-only helpers. Never import from a client component.
  dataClient.ts The local-vs-http seam.
  data/         Static reference data. companions.ts is EMPTY by design.
prisma/         schema.prisma (+ the comments explaining each column's rules)
tests/          Vitest, mirroring lib/ and app/api/
scripts/        Icon generation, the deploy migration runner
```

## Documentation

Start here, in this order:

- [`docs/STATUS.md`](docs/STATUS.md) — **what is done, what is left, what blocks launch.**
- [`DEPLOY.md`](DEPLOY.md) — deploying: every key, where to get it, what it costs.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how it works and **why** — the invariants, and the bug behind each one.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — running it: incidents, the database, backups, scaling, refunds.
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) — symptom → cause → fix.
- [`SECURITY.md`](SECURITY.md) — reporting a vulnerability.
- [`docs/BACKEND.md`](docs/BACKEND.md) — API route reference.
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — consent-gated GA4 / PostHog / Sentry.
- [`docs/journey-spec.md`](docs/journey-spec.md), [`docs/FEATURE-AUDIT.md`](docs/FEATURE-AUDIT.md),
  [`docs/LAUNCH-AUDIT.md`](docs/LAUNCH-AUDIT.md), [`docs/GO-LIVE.md`](docs/GO-LIVE.md),
  [`docs/CHAT-ROADMAP.md`](docs/CHAT-ROADMAP.md) — **historical.** Useful for intent,
  stale on specifics. Trust the four above over these.

## Hard rules

- **Strictly platonic.** No romantic/sexual/flirtatious copy or imagery, no
  couple photos. "People having fun" means friends, groups, activities.
- **Never claim something the product doesn't do.** "Held in escrow" was written
  into 18 places — including the Terms of Service — for a feature that does not
  exist. So was Aadhaar KYC, in fourteen. So was a "24/7 safety rep on the
  phone". On a product where people meet strangers, a claim you cannot keep is a
  liability, not a copy nit.
- **The client never sends a price.** It names what it wants; the server prices
  it.
- **A face we cannot destroy is a face we do not send.** CSS blur is a costume.
- **No invented people, ever** — not in the catalogue, not as testimonials, not
  as "Rohan just booked a walk" toasts. `tests/catalogue.test.ts` enforces it.
- **`MARKETPLACE_PAYMENTS_ENABLED` is a licence boundary**, not a flag to flip to
  make a feature work.
- **Line endings: CRLF.** Keep edits surgical; do not mass-reformat.

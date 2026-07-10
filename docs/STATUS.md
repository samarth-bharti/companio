# Status & next steps

_Last updated: 2026-07-10._

The single source of truth for **where the project is and what to do next**.
Keep this current — it's the first file to read when resuming.
**Launch plan / buying / deploy steps live in [`GO-LIVE.md`](GO-LIVE.md).**

## The one-line summary

A beautiful, well-engineered **demo**. Every quality gate is green, and the app
**cannot take a single rupee** — login is fake and payment is an animation.

## Quality gates (all green — verified 2026-07-10, by running them)

- `npx tsc --noEmit` → **0 errors**
- `npx vitest run` → **150 passing** (9 files)
- prod build → **success**, all routes compile incl. 9 `/admin/*` routes
  (`NODE_OPTIONS=--max-old-space-size=6144 npx next build`)
- every page route returns 200; API returns 401 signed-out; `/api/health` 200
- lint → our code clean; pre-existing React-19 hook warnings remain (not a regression)

> Green gates are not a working product. They prove the code compiles and the
> units behave — not that a stranger can pay you. See below.

## What actually blocks launch

Verified by driving the funnel in a real browser on 2026-07-10:

1. **Login is fake.** `components/auth/LoginForm.tsx` never imports next-auth.
   `handleSocial()` and `handleSubmit()` write a name into `localStorage` after a
   `setTimeout`. Any email + any password "works". (`lib/auth.ts` *does* have a
   real Google provider drafted — nothing calls it.)
2. **Guests never see a pay button.** `UnlockSheet.tsx` renders
   "Create a free account to unlock →" for guests, and the account it asks for
   cannot actually be created.
3. **Payment is a demo.** `payWithRazorpay()` returns `'unconfigured'` without
   keys *and* a session, falling back to `runDemoPay()` — a 900 ms spinner.
4. **`lib/dataClient.ts` has ZERO importers.** ~36 components read `localStorage`
   synchronously. `NEXT_PUBLIC_DATA_CLIENT=http` **is not a switch that turns the
   product on.** This is a repo-wide async migration.

**Fix order:** SessionProvider + real `signIn('google')` → `dataClient` migration
(wallet first) → Razorpay live. Everything else is decoration on top of this.

## v1 scope decision (locked 2026-07-10)

**We sell the ₹199 unlock and nothing else.** First two meetings are included and
free. Companions are compensated by Companio directly.

**Why:** collecting a ₹499 meetup fee and paying a companion out of it is pooling
and settling funds for a third party — unlicensed **Payment Aggregator** activity
under RBI. Selling the unlock is just selling access to our own product.

Consequently the credit packs (`pack1`/`pack5`/`pack10` in `lib/server/pricing.ts`)
and the ₹299 Plus membership are **not sold**. `PackCard`, `PlusCard` and
`CheckoutSheet` stay in the tree, unused, for when **Razorpay Route** (linked
accounts) lands — which is also what will make an "escrow" claim true.

## Done 2026-07-10 (truth-up + honesty pass)

- **Secrets:** `NEXTAUTH_SECRET` + `CRON_SECRET` were committed in plaintext in
  `GO-LIVE.md` in a **public** repo since `07c46b1`. Removed from the file and
  flagged as burned — **they must be regenerated**; they live in history forever.
- **"₹ held in escrow" removed everywhere.** It appeared in **18** places
  including the Terms of Service, Trust, Safety, Press, and two SEO meta
  descriptions. There is no escrow. Replaced with what is true: the two included
  meetings, and the 7-day refund window.
- **Terms §3 rewritten** to describe the unlock-only model and to state plainly
  that Companio does not collect, hold, or settle payments between members and
  companions.
- **Pricing page rebuilt** as a single honest ₹199 offer. `TopUpMenu` is now a
  read-only wallet (it used to sell credit packs straight from the nav);
  `WalletCard`'s "Top up →" became "What's included →".
- **Booking guarded:** a meetup can only be booked against an included meeting.
  The confirm button disables at zero rather than silently creating a free
  booking (`BookingWizard`, `BookingStepReview`, `CompanionProfileBookingRail`).
- **Dead "Continue with Apple" button removed** — no Apple provider exists, or
  ever did.
- **Site-wide hydration bug fixed (reduced-motion users).** Framer's
  `useReducedMotion()` returns `false` on the server but `true` on the client's
  first render. **92 components** branched markup or inline styles on it, so
  every visitor with `prefers-reduced-motion` hit
  *"Hydration failed because the server rendered HTML didn't match the client"*
  on the homepage and React threw the whole tree away and re-rendered it.
  All of them now use the repo's SSR-safe `useEffectiveReducedMotion()`
  (which returns `false` until mounted) — exactly what `journey-spec.md` §0.4
  already mandated. `app/template.tsx` and `components/motion/Reveal.tsx` were
  the worst offenders (`Reveal` wraps nearly every section on the site).
  Verified: 11 routes × both motion modes, zero JS errors.
- **`middleware.ts` → `proxy.ts`** (Next 16 deprecated the old convention).
- **Sentry build wrapper added** to `next.config.ts`. The runtime init existed;
  the `withSentryConfig` wrapper did not, so nothing was instrumented at build.
- **`/styleguide` 404s in production** (it was publicly reachable).
- **Hero video no longer downloads for everyone.** `public/hero.mp4` is 2.48 MB of
  a ~4.8 MB homepage. It is now skipped under reduced-motion, Data Saver and
  2G/3G, mounts after first paint, and `preload="auto"` → `"metadata"`.
  **It still needs re-encoding.**
- **Domain settled: `trycompanio.com`** — `lib/company.ts` mailboxes updated.
- **Docs:** deleted `backend-plan.md` (every step done; it told you to create
  files that exist and to use `ts-node` where the repo uses `tsx`). Test count
  corrected to **150** — it had been quoted as 71, 96, 102 and 150 in four
  different places.

## Known-stale / open

- **Grievance Officer name + phone are still `[[placeholders]]`** in
  `lib/company.ts`. `COMPANY_DISPLAY` prevents them rendering raw, but DPDPA
  requires a real reachable person. **Blocks legal validity of the public pages.**
- CSP is `Report-Only` with `unsafe-inline`/`unsafe-eval` (`proxy.ts`).
- `GST_ACTIVE` is used in `lib/server/payments.ts` but missing from `.env.example`;
  `SMS_SENDER_ID` is in `.env.example` but read nowhere.
- Five **dead components** still exist, unimported: `home/HowItWorks.tsx`,
  `home/HeroSection.tsx`, `home/FinalCta.tsx`, `home/ProcessSection.tsx`,
  `home/MoneySplit.tsx`. Their copy was corrected too, so reviving one cannot
  resurrect a false claim, but they should be deleted.
- `scripts/` holds 19 ad-hoc Playwright probes wired into neither `package.json`
  nor CI (`probe-hero2.js`, `shoot-quick.js`, …). Only `gen-icons.mjs` had a
  lasting purpose, and it has already run.
- `docs/journey-spec.md` lists `three`/`r3f` as available — they are not
  installed — and places `AuroraWipe`/`FlipPill` under `components/journey/`
  when they live in `components/motion/`. Treat it as a historical build spec.
- `docs/LAUNCH-AUDIT.md` (25 Jun) is **partly superseded**: B1 (free cash
  bookings), B4 (feed/lounge), B6 (no /contact), M3 (wallet upsert) and the
  spoofable rate-limit key are all fixed. B3 (no real auth) and the `dataClient`
  gap remain the whole story.
- `/feed` and `/lounge` call `notFound()` on purpose — **deferred until after
  launch**, not a bug.

## Team split

- **Us:** backend, UX/flow, data. **Dhruv:** UI (working in parallel).
  Keep our changes off pure-visual files where we can, and **coordinate commits**.

## Conventions

- **Strictly platonic** content rule (legal/processor/trust). No romance framing.
- **Never claim something the product does not do.** Escrow was the cautionary
  tale: it reached the Terms of Service.
- **CRLF** line endings; surgical edits only (shared repo).
- New API routes follow the pattern in [`BACKEND.md`](BACKEND.md#api-routes-appapi):
  session→401, zod→400, lazy Prisma import, serialize on return, `guard()` wrap.

# Status & next steps

_Last updated: 2026-07-10 (evening — after the security + wiring pass)._

The single source of truth for **where the project is and what to do next**.
Keep this current — it's the first file to read when resuming.
**Launch plan / buying / deploy steps live in [`GO-LIVE.md`](GO-LIVE.md).**

## The one-line summary

**Launch-safe, not launch-complete.** This morning a keyed production build would
have given every visitor a free ₹199 unlock. That, and three other holes of the
same class, are closed. What remains is unfinished product, not unsafe product.

## Quality gates (all green — verified 2026-07-10 by running them)

- `npx tsc --noEmit` → **0 errors**
- `npx vitest run` → **200 passing** (14 files)
- `npx eslint lib components app` → **0 errors** (first time; 57 warnings remain)
- prod build → **success**
- against the running production build: 25 pages **200**; `/feed` `/lounge`
  `/styleguide` **404**; `/admin` **307** with no admin session; 12 authenticated
  `GET`s **401**; 4 money `POST`s **401**; webhook + cron **503** without secrets

> Green gates still are not a working product. See "What is still not real".

## ⚠️ The end-to-end path has NEVER been run against a real database

`NEXT_PUBLIC_DATA_CLIENT=http` has not been switched on, because no
`DATABASE_URL` exists on this machine. `httpDataClient` is unit-tested against a
stubbed `fetch`, and every API route it calls is tested — but the two have never
shaken hands over live Postgres.

**"The bridge works" is an inference from tests, not an observation.** Converting
that into a fact is the single highest-value next action, and it needs a Neon
connection string plus Google OAuth credentials.

## Fixed 2026-07-10 (evening) — commits `ad47df4`, `4b41a57`, `659301e`, `b63f399`

### The four security holes

1. **Free unlock in production.** `payWithRazorpay()` mapped a `401` (no session)
   to `'unconfigured'`, and both checkout sheets read that as "demo mode" and
   granted the paid benefit locally. Since `LoginForm` never created a server
   session, **every visitor** to a keyed build would have unlocked for free.
   `'unconfigured'` now means *only* "no publishable key"; `auth_required`,
   `unavailable` and `failed` surface as real errors and can never reach
   `runDemoPay()`.
2. **The RBI Payment Aggregator trap was armed.** `create-order` accepted
   `kind=booking|credits|plus`, each of which ends with `settlePurchase()` writing
   a `CompanionPayout` — i.e. Companio holding money owed to a third party.
   Dropping a Razorpay key into `.env` would have switched that on silently. Now
   gated behind `MARKETPLACE_PAYMENTS_ENABLED`, which **must stay unset**.
3. **Moderation was write-only.** `suspended`, `bannedAt` and `messageBlocked`
   were written by six admin actions and read by **zero queries**. Suspending a
   companion left them in explore, on the map and bookable; banning a user let
   them keep booking, messaging and paying. `lib/server/visibility.ts` now holds
   the canonical filters and they are enforced in companions, bookings, messages
   and `getSessionUserId()`.
4. **Nobody could ever reach `/admin`.** `User.role` defaults to `user`, and the
   only code that could promote anyone was itself admin-gated — a closed loop on
   a fresh database. `ADMIN_EMAILS` breaks it.

### Admin panel

- Every one of the 22 actions used to `return` silently on failure. They now
  return an `ActionState` that the new `<ActionForm>` renders inline, with
  **pending state** (a double-submitted `grantCredits` granted twice) and
  `confirm()` on destructive actions.
- **The companions page never rendered its own CRUD.** `createCompanion`,
  `editCompanion`, `suspend`, `ban`, `delete`, `setVerified`, `setPremium` had
  existed for months as dead exports — you could not add a companion at all.
  Rebuilt, and the editor now covers every field that drives explore and the map,
  not just `name/city/hourlyRate/bio`.
- `deleteCompanion` raised a raw Prisma `P2003` the moment anyone had booked
  them. It refuses with a reason now (`lib/server/erase.ts`); ban instead.
- **Audit-log viewer** at `/admin/audit`. Every action has written
  `AdminAuditLog` rows since day one and nothing ever read them.

### No manual refresh, anywhere

`journeyState`/`appState` were plain localStorage getters — nothing announced a
write, so every component read its slice once in a mount effect and went stale.
Unlocking on `/explore` left the Nav wallet chip, `TopUpMenu` and `/dashboard`
showing the old value until a hard reload, and two tabs disagreed forever.

`lib/consent.ts` had already solved exactly this for the cookie banner with a
window `CustomEvent`. Generalised:

- `lib/dataEvents.ts` — emit/subscribe; a cross-tab `storage` event → `'all'`
- `lib/useData.ts` — re-reads on change, on cross-tab write, and on window focus
- `dataClient` — a `withChangeEvents()` decorator emits **after** the underlying
  call resolves, so a rejected write never triggers a re-read implying success

Migrated: `Nav`, `NavUser`, `TopUpMenu`, `OverviewPanel`, `BookingsPanel`,
`SavedPanel`, `NotificationsPanel`, `DashboardClient`. The same decorator works
unchanged in `http` mode.

### Auth is real when configured

- `SessionProvider` mounted. Nothing could read a session before.
- `LoginForm` calls `signIn('google')` when Google is wired; it only simulates
  locally when it is not. **The password box is hidden in a live build** rather
  than accepting any string against a provider that does not exist.
- Sign-out ends the JWT session, not just the localStorage profile.
- `/api/auth/capability` answers "can we make a real session" without the `500`
  that next-auth's `/api/auth/providers` throws when `NEXTAUTH_SECRET` is absent.
- `UnlockSheet`'s `onSuccess` reports `'live' | 'demo'`. A live unlock **re-reads**
  the server flag instead of writing it — writing it was the bypass, restated.

### Map

- **CARTO's basemap was removed.** Its hosted tiles are free for *non-commercial*
  use only, capped at 75k monthly views, with no SLA. Provider now comes from the
  environment (`lib/map/tiles.ts`), falling back to OpenStreetMap.
- **CSP's `img-src` allowed no tile host at all**, so the map would have gone
  blank the day `Content-Security-Policy-Report-Only` became enforcing.
- **Positions were fake in a way the labels denied.** Every companion was jittered
  ±4 km around the *city* centre; `area` was fed into the hash as a seed but never
  used geographically, so Bandra and Colaba — 17 km apart — landed in the same
  cloud. `lib/data/areas.ts` now anchors them on real neighbourhoods. Cities with
  no verified anchors keep the old scatter rather than get an invented coordinate,
  and **say plainly that their profiles are illustrative**.

### Other

- `prisma/seed.ts` used `update: {}` — re-seeding silently did **nothing** to
  existing rows. Editing `lib/data/companions.ts` and re-running appeared to work
  and changed nothing. It refreshes catalogue fields now, and deliberately never
  touches the moderation columns (a re-seed must not un-ban anyone). It also
  promotes `ADMIN_EMAILS`.
- `/dashboard` claimed "your weekly spin is ready" unconditionally, including to
  users who had just spun. It asks `/api/spin` now.
- Two pre-existing lint errors were real bugs: `CompanionProfileReviews` read
  `trackRef.current` **during render**, so cards were laid out against a hardcoded
  300 px on first paint and never responded to a resize; `admin/discounts` called
  `Date.now()` in the render body.

### Verification (added later on 2026-07-10)

Two findings, both in the "the badge lies" family:

- **`idVerifyStatus` was set to `verified` unconditionally** by
  `/api/application/upload`, for every submission, regardless of any check. And
  `ocrMatched` — the thing that looked like corroboration — is computed by
  **tesseract.js in the applicant's own browser** and POSTed. An applicant could
  upload a photo of a cat with `ocrMatched=true` and the admin queue would show
  *"ID check: verified · OCR matched ✓"*. Nothing is ever marked `verified` now;
  it lands `pending` and an admin approval stamps `manual`. The admin UI labels
  the OCR result as self-reported.
- **There was no 18+ check on the server at all.** `StepAboutYou` refuses under-18s
  in the browser and then *discards the date of birth*; nothing persisted it, no
  API asked for it, and Google OAuth does not supply one. `User.dateOfBirth` now
  exists, is set-once, and `POST /api/bookings` and `POST /api/application` both
  return `403 age_verification_required` without it. An admin can correct a
  genuine mistake but **cannot** wave through anyone under 18.

New upload checks: the selfie may not be byte-identical to the ID; the selfie may
not be a PDF; **both** fingerprints (not just the ID) are checked for reuse across
applicants; the endpoint is rate limited.

**What none of this proves:** that a person owns the identity they submitted.
Only a KYC vendor querying UIDAI / the Income Tax database can. Format checks,
magic bytes and duplicate fingerprints are a filter in front of a human, not a
substitute for one.

**Still open on age:** a Google-OAuth user has no date of birth, so their first
booking will 403. **A post-sign-in "confirm your date of birth" step is required
before `http` mode goes live.** The register wizard already supplies it for the
local path.

## v1 scope decision (locked 2026-07-10)

**We sell the ₹199 unlock and nothing else.** First two meetings are included and
free. Companions are compensated by Companio directly.

**Why:** collecting a ₹499 meetup fee and paying a companion out of it is pooling
and settling funds for a third party — unlicensed **Payment Aggregator** activity
under RBI (₹15 crore net worth to apply, ₹25 crore within three years). Selling
the unlock is just selling access to our own product.

The credit packs and the ₹299 Plus membership stay in the tree, unused, behind
`MARKETPLACE_PAYMENTS_ENABLED`, for when **Razorpay Route** (linked accounts)
lands — which is also what will make an "escrow" claim true.

### Companion dashboard + 18+ gate (later on 2026-07-10)

- **`/companion-dashboard` was 100% hardcoded and quietly dangerous.** It greeted
  every visitor as "Priya S.", listed two invented booking requests with
  Accept/Decline buttons for a flow the schema has no status for, showed a bank
  account ending 4521 that belonged to nobody, promised "payouts every Monday"
  that no code keeps, and — worst — **fell back to ₹7,485 of "earnings" whenever
  the earnings fetch failed.** A real companion could read that as money owed.
  Now backed by `GET /api/companion/dashboard` and `PATCH /api/companion/profile`,
  with a four-state hook (`loading | preview | live | error`) that **never shows a
  number it does not have**. Rate, bio, activities, availability and a payout UPI
  id all persist. `Companion.payoutUpi` added; the admin payouts page shows it, or
  says loudly that there isn't one.
- **The 18+ gate now has a client path.** `AccountGate` renders `ConfirmAge` when
  the signed-in user has no date of birth — which is every Google-OAuth user.
  Age rules live in `lib/age.ts` and are enforced identically in the browser and
  on the server (`lib/server/age.ts` re-exports them), instead of a private
  `calcAge()` in `StepAboutYou` and four hardcoded `18`s.
- **`public/hero.mp4`: 2422 KB → 1299 KB (46% smaller), SSIM 0.98794.** The source
  carried a 139 kb/s AAC track and the `<video>` is `muted`. Reproducible via
  `npm run encode:hero`, which **refuses to write** below an SSIM floor of 0.985.

## What is still NOT real

- **`/contact` has no form** — just email addresses.
- **Phone OTP is inert.** `verifyOtp()` in `lib/auth.ts` is `return false`.
- **Forgot-password is a `setTimeout`.** No email is ever sent.
- **Booking with money is deliberately off** (see the RBI note). The only thing
  sellable today is the ₹199 unlock.
- Only **Mumbai** has real companions. Every other city re-skins the same 18
  people via `localizeArea()`. The map now says so; the explore grid does not.
- Companions cannot decline a booking. There is no status for it in
  `BookingStatus` — the old Accept/Decline buttons were fiction, and the honest
  version shows confirmed meetups instead. Add a status before adding the UI.

## Known-stale / open

- **Grievance Officer name + phone are still `[[placeholders]]`** in
  `lib/company.ts`. DPDPA requires a real reachable person. Parked by decision,
  **blocks legal validity of the public pages.**
- **`NEXTAUTH_SECRET` + `CRON_SECRET` are still burned.** They were committed in
  plaintext to `GO-LIVE.md` in a **public** repo at `07c46b1` and live in history
  forever. Rotate them.
- **Upstash is not optional in production.** Without it `rateLimit()` uses an
  in-memory `Map`, and Vercel runs many lambda instances each with its own
  counter — so "20 payment attempts/minute" silently becomes 20 × warm instances.
- `hero.mp4` is **2.48 MB** of a ~4.7 MB homepage. Still needs re-encoding (no
  ffmpeg on this machine).
- Four stacked mobile sections (`PeopleSection` 2.4 screens, `BentoSection` 2.6,
  `StatsSection` 2.5, `SafetySection` 1.9) and **21 tap targets under 44 px**.
- CSP is `Report-Only` with `unsafe-inline`/`unsafe-eval` (`proxy.ts`).
- `tesseract.js` (~7 MB) is in `package.json` and **imported by nothing**.
- Five **dead components**, unimported: `home/HowItWorks.tsx`,
  `home/HeroSection.tsx`, `home/FinalCta.tsx`, `home/ProcessSection.tsx`,
  `home/MoneySplit.tsx`.
- `scripts/` holds 19 ad-hoc Playwright probes wired into neither `package.json`
  nor CI.
- `docs/journey-spec.md` lists `three`/`r3f` as available — they are not
  installed — and places `AuroraWipe`/`FlipPill` under `components/journey/` when
  they live in `components/motion/`. Treat it as a historical build spec.
- `/feed` and `/lounge` call `notFound()` on purpose — **deferred until after
  launch**, not a bug.

## Team split

- **Us:** backend, UX/flow, data. **Dhruv:** UI (working in parallel).
  Keep our changes off pure-visual files where we can, and **coordinate commits**.

## Conventions

- **Strictly platonic** content rule (legal/processor/trust). No romance framing.
- **Never claim something the product does not do.** Escrow was the cautionary
  tale: it reached the Terms of Service.
- **Never branch rendered markup on framer's `useReducedMotion()`** — it returns
  `false` on the server and the OS value on the client's first render. Use
  `useEffectiveReducedMotion()`.
- **Money-gated state is flipped only by `settlePurchase()`**, never by a client
  setter. `/api/wallet/add-credits`, `POST /api/user/unlocked` and
  `POST /api/subscription {plan:'plus'}` all return `403 use_checkout` by design.
- **CRLF** line endings; surgical edits only (shared repo).
- New API routes follow the pattern in [`BACKEND.md`](BACKEND.md#api-routes-appapi):
  session→401, zod→400, lazy Prisma import, serialize on return, `guard()` wrap.

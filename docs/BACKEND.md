# Backend reference

> **Partly stale (as of 2026-07-17).** Useful as a route reference; wrong on the
> product and on the state of play. Trust [`ARCHITECTURE.md`](ARCHITECTURE.md)
> and [`STATUS.md`](STATUS.md) over anything here that conflicts.
>
> Known-wrong below: the backend is **not dormant** (it has been driven against
> real Neon end to end); the product sells **a pass at four durations**, not a
> one-time ₹199 unlock; `lib/photo.ts`'s Unsplash blur has been replaced by
> `lib/server/photoStore.ts` (sharp at ingest, our own storage); and
> `lib/data/companions.ts` is now **empty by design**.

The backend is **fully implemented** — every route exists, is typed, and is
tested.

> **Updated 2026-07-10 (evening).** The gap this section used to describe is
> mostly closed:
>
> - `lib/dataClient.ts` now has real importers. `Nav`, `NavUser`, `TopUpMenu`,
>   `LoginForm`, `StepDone`, `QuizClient`, `ExploreClient` and the four dashboard
>   panels go through it. The rest of the tree still reads `localStorage`
>   directly — finish that sweep before flipping the flag.
> - **Sign-in is real when configured.** `SessionProvider` is mounted and
>   `LoginForm` calls `signIn('google')` when Google is wired. It only simulates
>   locally when `/api/auth/capability` reports `{configured:false}`.
> - Every mutation now emits a change event (`lib/dataEvents.ts`) so the UI
>   re-reads instead of going stale. This works identically in `http` mode.
>
> **Still true: `NEXT_PUBLIC_DATA_CLIENT=http` has never been run against a real
> database.** It is unit-tested against a stubbed `fetch`, nothing more.
>
> **New gates you must know about** before setting any key:
> `MARKETPLACE_PAYMENTS_ENABLED` (leave unset — RBI), `ADMIN_EMAILS` (without it
> `/admin` is unreachable by anyone, forever), and the fact that setting
> `NEXT_PUBLIC_RAZORPAY_KEY_ID` **disables the demo payment path by design**.
> See [`GO-LIVE.md`](GO-LIVE.md#vars-added-2026-07-10--read-these-before-deploying).

## The data-access seam

`lib/dataClient.ts` is the single boundary between UI and storage:

```
DataClient (typed interface)
  ├── localStorageDataClient   ← default; wraps lib/journeyState + lib/appState
  └── httpDataClient           ← fetch('/api/...'); used when NEXT_PUBLIC_DATA_CLIENT=http
```

Components only ever `await dataClient.getWallet()` etc. The singleton at the
bottom of the file picks the implementation from `NEXT_PUBLIC_DATA_CLIENT`
(`local` by default). The `httpDataClient` paths are the contract the API routes
implement.

**Signed-out tolerance:** the `httpDataClient` getters return the same defaults
the localStorage client gives a fresh user when the API replies `401` (wallet →
`{credits:2,used:0}`, lists → `[]`, flags → `false`, user/plan/application →
`null`, unknown companion → `undefined`). Writes still throw on any non-2xx, so a
failed action is never silently dropped. This is covered by `tests/dataClient.test.ts`.

## API routes (`app/api/**`)

All user routes follow the same shape: **session → 401**, **zod parse → 400**,
lazy-import Prisma *after* auth, **serialize Prisma rows → the TS shapes** the
frontend already uses (`lib/server/serialize.ts`). Errors run through
`guard()` (`lib/server/http.ts`): Prisma `P2025→404`, `P2002→409`, `P2003→400`,
anything else `→500` (logged, no internals leaked).

| Method + path                         | Purpose                                   | Auth |
|---------------------------------------|-------------------------------------------|------|
| `GET  /api/health`                    | Health check                              | —    |
| `GET  /api/companions`                | Catalogue (mock fallback w/o DB)          | —    |
| `GET  /api/companions/:id`            | One profile (mock fallback w/o DB)        | —    |
| `GET  /api/wallet`                    | Credit balance (creates w/ 2 free)        | ✓    |
| `POST /api/wallet/add-credits`        | Top up (+ ledger row, txn)                | ✓    |
| `POST /api/wallet/decrement`          | Spend a credit (no-op at 0, + ledger)     | ✓    |
| `GET/POST /api/user`                  | Profile (firstName, city)                 | ✓    |
| `GET/POST /api/user/unlocked`         | Full-unlock flag                          | ✓    |
| `GET/POST /api/user/welcomed`         | Welcome-played flag                       | ✓    |
| `GET/POST /api/bookings`              | List / create bookings                    | ✓    |
| `POST /api/bookings/:id`              | Patch (owner-scoped, 404 if not yours)    | ✓    |
| `GET  /api/favorites`                 | Favorited companion ids                   | ✓    |
| `POST /api/favorites/toggle`          | Add/remove favorite                       | ✓    |
| `GET  /api/messages`                  | All DM threads, grouped by companion      | ✓    |
| `GET/POST /api/messages/:companionId` | One DM thread / append                     | ✓    |
| `GET/POST /api/notifications`         | List / create                             | ✓    |
| `POST /api/notifications/read`        | Mark all the user's notifications read     | ✓    |
| `GET/POST /api/subscription`          | Plus plan (`plus` upsert / `null` cancel) | ✓    |
| `GET/POST /api/application`           | Companion application (upsert)            | ✓    |
| `POST /api/razorpay/create-order`     | Create order (503 until keyed)            | ✓    |
| `POST /api/razorpay/verify`           | Verify HMAC, settle booking               | ✓    |
| `POST /api/razorpay/webhook`          | Server callback (raw-body HMAC)           | sig  |
| `GET/POST /api/auth/[...nextauth]`    | Auth.js handler                           | —    |
| `GET  /api/user/export`               | DPDP data export (JSON download)          | ✓    |
| `POST /api/user/delete`               | DPDP account erasure (txn)                | ✓    |
| `GET  /api/cron`                      | Maintenance job (CRON_SECRET Bearer)      | sec  |

## Payments

> **v1 sells only the ₹199 unlock.** `CREDIT_PACKS` (`pack1`/`pack5`/`pack10`) and
> the `plus` kind still exist in `lib/server/pricing.ts` and are fully
> implemented, but **no UI sells them**. Charging for a meetup and paying a
> companion out of that money is unlicensed Payment Aggregator activity under
> RBI; they return once **Razorpay Route** (linked accounts) is wired, so that
> Razorpay is the settling entity. `splitEarnings()` exists for that future.

Payment authority is **server-side**. The client names *what* it buys
(`kind` + `packId`); `create-order` fixes the price from `lib/server/pricing.ts`
(the single source of truth, in paise) and records a `Purchase` row. The benefit
(credits / unlock / Plus / booking-complete) is granted only by **idempotent**
`settlePurchase()` in `lib/server/payments.ts` after HMAC verification — a paid
purchase is never applied twice, so `verify` (client) and `webhook` (server)
firing for the same payment is safe. Verify checks `HMAC(order_id|payment_id)`
and that the order belongs to the session user; the webhook checks
`HMAC(rawBody)` against the `x-razorpay-signature` header. The free-grant
endpoints (`add-credits`, `user/unlocked`, `subscription` → `plus`) return `403`
by design — credits/unlock/Plus only come through a paid purchase.

`lib/server/payments.ts` also exposes `hmac()` and length-safe `safeEqual()`
(constant-time).

## Transactional email

`lib/server/notify.ts` sends a **booking confirmation** on booking creation and
a **payment receipt** on first settlement (idempotency-aware — `verify` and
`webhook` only email once). It uses `lib/server/email.ts` (Resend over `fetch`)
and the templates in `lib/server/emailTemplates.ts`. **Dormant without
`RESEND_API_KEY`** — it short-circuits before any DB lookup — and never throws or
blocks the response.

## Auth

`lib/auth.ts` holds `authOptions` (JWT strategy, no Prisma adapter — we own the
`User` row, a better fit for phone-OTP). **Both providers are drafted behind an
env switch:** Google OAuth auto-enables once `GOOGLE_CLIENT_ID` +
`GOOGLE_CLIENT_SECRET` are set; the phone-OTP credentials form is registered but
`verifyOtp()` returns `false` until an SMS gateway is wired. There is **no Apple
provider** — the sign-in button for it has been removed.

> **Nothing in the UI calls any of this.** `LoginForm` fakes a session by writing
> to `localStorage`, and no `SessionProvider` is mounted. Wiring
> `signIn('google')` and mounting the provider is step one of going live.

Routes only depend on `session.user.id` via `lib/server/session.ts`, so the
provider choice changes nothing else.

## Going live (what you must provide)

1. **Neon Postgres** — set `DATABASE_URL` + `DIRECT_URL` in `.env`, then:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed          # seeds companions from lib/data/companions
   ```
2. **Auth** — set `NEXTAUTH_SECRET` + `NEXTAUTH_URL`, choose Google OAuth **or**
   phone-OTP, and implement `authorize()` in `lib/auth.ts` (+ provider creds).
3. **Razorpay** — set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` /
   `RAZORPAY_WEBHOOK_SECRET`. Until set, the razorpay routes return `503`.
4. **Wire the UI to the seam** (see below) — today the components still call
   `lib/journeyState` / `lib/appState` directly, so the `httpDataClient` has no
   importers yet. Flipping the flag does nothing until call sites migrate.
5. **Flip the flag** — `NEXT_PUBLIC_DATA_CLIENT=http`, redeploy, smoke-test each
   feature. Then delete the `local` branch in `lib/dataClient.ts`.

See [`.env.example`](../.env.example) for every variable with notes.

## Wiring the UI to the backend (the remaining gap)

The `httpDataClient` is fully implemented and tested, but no component imports
`dataClient` yet — that migration is the last step before the backend does
anything. Recommended approach (small, reversible, mergeable):

1. **Migrate one feature end-to-end first** (suggest the wallet): swap its
   `getWallet()` / `decrementMeeting()` call sites from the direct
   `journeyState` import to `await dataClient.<method>()`, behind the existing
   flag (default `local`, so behaviour is unchanged for everyone).
2. The call is already async on both sides of the seam — the only change at a
   call site is `const w = getWallet()` → `const w = await dataClient.getWallet()`
   inside an effect or handler, plus the usual loading state.
3. Verify with the flag on `local` (no regression), then on `http` against a
   seeded DB. Roll feature-by-feature; never a repo-wide find-and-replace.
4. Keep these edits isolated from the collaborator's pure-visual files to avoid
   merge churn.

## Tests

`npm test` (Vitest, **150 tests across 9 files**): `serialize` (BigInt/Date conversion), `validation`
(every zod schema, valid/invalid/boundary), `http` (guard + helpers), `payments`
(signature + idempotency), `routes` (handlers with mocked session + Prisma —
401/400/404 and edge cases like wallet-at-zero and the booking IDOR guard), and
`dataClient` (httpDataClient over a mocked `fetch` — 401 fallbacks, 404→undefined,
writes throwing on error).
**DB integration tests run once Neon is wired.**

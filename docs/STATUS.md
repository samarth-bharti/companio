# Status & next steps

_Last updated: 2026-06-26._

The single source of truth for **where the project is and what to do next**.
Keep this current — it's the first file to read when resuming.
**Launch plan / buying / deploy steps live in [`GO-LIVE.md`](GO-LIVE.md).**

## Quality gates (all green — verified 2026-06-26)

- `npx tsc --noEmit` → **0 errors**
- `npx vitest run` → **150 passing** (9 files)
- prod build → **success**, all routes compile incl. 9 `/admin/*` routes
  (`NODE_OPTIONS=--max-old-space-size=6144 npx next build`)
- lint → our code clean; pre-existing React-19 hook warnings remain (not a regression)

## Built 2026-06-26 (document checks + MNC admin)

- **Free document validation** (no vendor): `lib/idFormat.ts` (client-safe:
  Aadhaar Verhoeff checksum, PAN format, magic-byte file integrity, masking) +
  `lib/server/documentValidation.ts` (adds SHA-256 hashing). 18 unit tests.
  Apply wizard wired: live ID validation, file-type rejection, lazy client OCR
  (tesseract.js, guarded — never blocks), live camera selfie, and
  `POST /api/application/upload` (server re-validate + duplicate-ID block 409 +
  masked storage). Demo-mode safe (upload only fires in http mode).
- **MNC-grade admin** — 9 routes (Overview, Users, Companions, Applications,
  Bookings, Discounts, Reports, Payouts, Surge). Users: suspend/ban/block-msgs/
  grant-credits/role/edit/delete. Companions: add/edit/suspend/ban/verify/
  premium/delete. Discounts: create %/₹ codes, max-uses, expiry, toggle/delete.
  Bookings: cancel(+credit refund)/refund(best-effort Razorpay)/complete.
  Applications: approve(creates companion)/reject. **Every action audit-logged**
  (`AdminAuditLog`). Actions in `app/admin/actions/*.ts`; gate re-checked each.
- **Schema additions:** `DocVerifyStatus`/`DiscountType` enums; `refunded`
  BookingStatus; User+Companion suspend/ban/banReason (+User.messageBlocked);
  Booking refundedAt/refundReason/discountCode; CompanionApplication doc fields
  (idHash/photoHash/idDocMasked/idVerifyStatus/ocrMatched/verifiedAt); new
  `DiscountCode` + `AdminAuditLog` models. zod schemas added in
  `lib/server/validation.ts`. Schema validates; client generated.

## Team split

- **Us:** backend, UX/flow, data. **A collaborator:** UI (working in parallel,
  writing an end-to-end plan). Keep our changes off pure-visual files where we
  can, and **coordinate commits** — the backend work changed `package.json` +
  lockfile.

## Done

- **Merge** of our account-gated onboarding flow into the shared repo, kept the
  collaborator's design/copy. Flow verified structurally identical to the
  `companio-frontend-3` reference.
- **Lounge/feed** bug + UX pass (deferred for further feature work).
- **Perf:** fixed the `TiltCard` mousemove layout-thrash (was the explore-grid
  jank); `next/image` aspect-ratio warnings silenced.
- **Nav:** Safety moved out of the primary links into a small shield button.
- **Backend (complete, dormant):** full Prisma schema, the `dataClient` seam,
  every API route, Auth.js wiring (stub provider), Razorpay order/verify/webhook,
  seed script, and a 71-test suite. See [`BACKEND.md`](BACKEND.md).
- **Monitoring & analytics (Stage 1, dormant):** GA4 + Consent Mode, SPA
  pageviews, a typed event taxonomy with a central `track()`, Core Web Vitals,
  a DPDP/GDPR consent banner, PostHog, Sentry, and Vercel Analytics / Speed
  Insights — all env-gated and no-op until keyed, nothing fires before consent.
  Funnel events wired (login, signup, unlock, booking). See [`ANALYTICS.md`](ANALYTICS.md).
- **CI:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — type-check,
  test, and build are blocking; lint runs non-blocking (pre-existing UI hook
  warnings tracked separately). Runs on push / PR to `main`.
- **Transactional email (seam wired, dormant):** `lib/server/notify.ts` sends a
  booking confirmation on booking creation and a payment receipt on first
  settlement (idempotent — verify + webhook fire once). No-op without
  `RESEND_API_KEY`; never throws, never blocks the response.
- **`SECURITY.md`:** responsible-disclosure policy + posture summary.
- **PWA + social:** generated brand assets (`public/icon-192.png`,
  `icon-512.png` maskable, `apple-icon.png`, `og.png`) via
  `scripts/gen-icons.mjs`; wired into `manifest.ts` + layout OG/Twitter metadata.
- **`httpDataClient` hardened:** getters return signed-out defaults on `401`
  (matching the local client) instead of crashing; writes still throw. Covered by
  `tests/dataClient.test.ts` (13 tests). The remaining go-live step is migrating
  UI call sites onto the seam — recipe in [`BACKEND.md`](BACKEND.md#wiring-the-ui-to-the-backend-the-remaining-gap).
- **Security hardening:** `app/api/application` create branch now clamps `status`
  to `draft`/`submitted` server-side (defense-in-depth against mass-assignment,
  robust even if the enum is widened); update branch still strips `status`.
  Covered by 3 route tests.

## Resume point / what's pending (2026-06-26)

**Everything is UNCOMMITTED** (owner authorized committing the full tree). Local
git remote is still `ninjaaaaaa7/Comp`; target is `samarth-bharti/companio`,
commits authored **samarth / samarthsgsits23@gmail.com** only.

**Immediate next action (blocks deploy):** user runs the two governance overrides
in the Claude Code terminal, then ME: set identity → commit → push to
samarth-bharti. See [`GO-LIVE.md`](GO-LIVE.md) §A:
`$env:CLAUDE_SKIP_IDENTITY_CHECK = '1'; $env:CLAUDE_ALLOW_OTHER_REPO = '1'`

**Strategy: free-tier first, full E2E today, buy ~29 Jun** (official release).
Auth = Google only (OTP skipped). Email/Resend skipped. KYC = free doc-checks +
manual approve (vendor later). Full buying + env + deploy plan in
[`GO-LIVE.md`](GO-LIVE.md).

Backend runs the moment creds arrive: **Neon** (`DATABASE_URL`+`DIRECT_URL` →
`prisma migrate deploy` + `db seed`), **Google OAuth** (auto-enables with
`GOOGLE_CLIENT_ID/SECRET`), **Razorpay** test keys. Then
`NEXT_PUBLIC_DATA_CLIENT=http` + promote account to `role='admin'` + smoke-test.

## Next candidates (not started)

- Draft both real auth providers behind a one-line switch so picking one is trivial.
- Resume lounge/feed feature work (deferred).
- Wire footer `#sos` / `#promise` anchors (currently no target) — collaborator's
  Footer design, confirm first.
- DB integration tests (need Neon).

## Conventions

- **Strictly platonic** content rule (legal/processor/trust). No romance framing.
- **CRLF** line endings; surgical edits only (shared repo).
- New API routes follow the pattern in [`BACKEND.md`](BACKEND.md#api-routes-appapi):
  session→401, zod→400, lazy Prisma import, serialize on return, `guard()` wrap.

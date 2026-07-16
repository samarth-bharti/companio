# Companio — Go-Live Runbook, Deployment & Buying Plan

> # ⚠️ SUPERSEDED — do not follow this to deploy.
>
> **[`../DEPLOY.md`](../DEPLOY.md) is the live runbook.** It has verified July
> 2026 pricing, every environment variable and where each one comes from, and the
> RBI / Razorpay Route position.
>
> This file is kept for its reasoning and its history. Its specifics are wrong in
> at least these ways:
>
> - The product no longer sells a one-time ₹199 unlock. It sells **a pass** at
>   four durations (₹199/1mo, ₹499/3mo, ₹999/12mo, ₹1999 lifetime).
> - It predates `PASS_SALES_ENABLED` and `BLOB_READ_WRITE_TOKEN`, both of which
>   are required.
> - It predates the finding that **Vercel Hobby forbids commercial use**, which
>   makes Pro (~₹1,750/mo) mandatory from the day payments go live.
> - Its cost figures were not verified against official pricing pages.
>
> Original header follows.
>
> ---

> **Single source of truth for launch.** Read this first when resuming. "YOU" =
> a value you procure and paste in. "ME" = code and commands run in the repo.

## Timeline & strategy

_Rewritten 2026-07-10. The original 26/29 Jun dates lapsed without launch._

- **Deploy + test on FREE tiers first.** All infra used to prove the flow is free.
- **Ship when the blockers below are cleared, not on a date.** The site cannot
  currently take a single rupee (see "What actually blocks launch").
- **Cost to deploy + test: ₹0.** Fixed monthly cost at launch ≈ **₹2,300–3,200**,
  inside the ₹5,000/month budget.

## Decisions locked

| Topic | Decision |
|---|---|
| **What we sell in v1** | **The ₹199 unlock ONLY.** First 2 meetings included, free. Meetup fees, credit packs and Plus are **not sold** — collecting a meetup fee and paying a companion out of it makes us an unlicensed **Payment Aggregator** under RBI. They return with **Razorpay Route** (linked accounts), which also makes "held in escrow" a true statement. |
| Auth at launch | **Google OAuth only.** Phone OTP **skipped** (stub `verifyOtp()` left inert; DLT reg + per-SMS cost not worth it now). There is **no Apple provider** — the button was removed. |
| Email (Resend) | **Skipped for now** — app runs fine, emails are no-ops. Add later. |
| KYC vendor | **Skipped for now.** Using **free document-sanity checks** (built) + **manual admin approve**. Vendor (Digio/Cashfree ~₹3–5/check) added when scaling. |
| Company structure | **LLP recommended** (bootstrapping; limited liability). Pvt Ltd only if raising VC. **Confirm with a CA.** Code uses **LLPIN** field if LLP. |
| Data mode | `NEXT_PUBLIC_DATA_CLIENT=local` for demo. Flipping to `http` **does nothing on its own** — no component imports `lib/dataClient.ts` yet. |
| Hosting | **Vercel** (free Hobby to test → **Pro required** for commercial use). Pro is **$20/user/mo billed annually, $24 monthly — PER SEAT.** Keep it to one seat. |
| Domain | **trycompanio.com** (already owned). `lib/company.ts` uses `@trycompanio.com` for support / privacy / grievance. |
| Git | Repo **github.com/samarth-bharti/companio**; commits authored **samarth / samarthsgsits23@gmail.com** ONLY (no office IDs: jitender/ozpool/manmeet). |

## What actually blocks launch

Verified by running the app on 2026-07-10. `tsc` is clean, 150/150 tests pass and
the prod build succeeds — but the product cannot take money:

1. **Login is fake.** `components/auth/LoginForm.tsx` never imports next-auth; it
   writes a name to `localStorage`. Any email + any password "works".
2. **Guests never reach a pay button.** `UnlockSheet` shows "Create a free account
   to unlock →" instead, and the account it asks for cannot be created.
3. **Payment falls back to a demo animation.** `payWithRazorpay()` returns
   `'unconfigured'` without keys **and** a session.
4. **`lib/dataClient.ts` has zero importers.** ~36 components read `localStorage`
   synchronously. Going live is an async migration, **not a flag flip**.

Fix order: wire `LoginForm` → `signIn('google')` and mount a `SessionProvider`;
migrate the UI onto `dataClient` feature-by-feature (wallet first); then Razorpay.

---

## What we are going to BUY

Prices re-verified 2026-07-10 against the vendors' own pricing pages.
Everything is free to deploy + test first.

| # | Thing | Cost | Needed for | Creds it produces |
|---|---|---|---|---|
| 1 | **Domain** `trycompanio.com` | owned | Real URL, OAuth, email | — |
| 2 | **Neon** Postgres — **Launch** | **pay-as-you-go, no monthly minimum** (~₹450–1,300/mo at our size) | All real data + **7-day PITR** | `DATABASE_URL`, `DIRECT_URL` |
| 3 | **Google Cloud** OAuth | ₹0 | Login | `GOOGLE_CLIENT_ID/SECRET` |
| 4 | **Razorpay** (test → live) | ₹0 signup; **2% + 18% GST ≈ 2.36%/txn**, from revenue | The ₹199 unlock | `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` |
| 5 | **Vercel Pro** — **one seat** | **$20/user/mo annual · $24 monthly** (~₹1,760/mo) | Hosting; Hobby forbids commercial use | — |
| 6 | **Razorpay business KYC** | ₹0 (needs PAN + bank) | Leave test mode | — |
| 7 | **Upstash Redis** | ₹0 (free tier) | Rate limiting — the in-memory default is **per-instance**, i.e. useless on serverless | `UPSTASH_REDIS_REST_*` |
| 8 | Resend / Sentry / GA4 / PostHog | ₹0 (free tiers) | email / monitoring | see env list |

> **Vercel Pro is billed per seat.** Do not add a second team member; one seat.

> **Neon: take Launch, not Free.** Launch has no monthly minimum and gives a
> **7-day** point-in-time-restore window. Free gives **6 hours**, which will not
> survive a payments incident. (An earlier version of this doc claimed Launch was
> "$19/mo" — that is outdated.)

### Fixed monthly cost at launch

| Item | ₹/month |
|---|---|
| Vercel Pro (1 seat) | ~1,760 |
| Neon Launch | ~450–1,300 |
| Domain (amortised) | ~75 |
| Upstash / Sentry / PostHog / GA4 | 0 |
| **Total** | **~₹2,300–3,200** |

Comfortably inside the **₹5,000/month** budget. Razorpay's ~2.36% comes out of
revenue, not budget: at 5,000 buyers × ₹199 that is ~₹23,500 on ~₹9.95L collected.

---

## Deployment steps

### A. Push code — DONE
The tree is committed and lives at `github.com/samarth-bharti/companio`.

> **The repo is PUBLIC.** Treat everything committed here as world-readable.

### A2. Rotate the burned secrets — DO THIS FIRST
- [ ] **YOU:** generate fresh `NEXTAUTH_SECRET` + `CRON_SECRET` (commands above).
- [ ] **YOU:** paste them into Vercel (mark *Sensitive*) and local `.env` only.
- [ ] Never let either value re-enter a tracked file.

### B. Demo-mode link (fastest CEO-testable URL, ₹0)
- [ ] **YOU:** vercel.com (sign up with samarth-bharti GitHub) → import `companio`.
- [ ] **YOU:** add the 3 demo envs (below) → Deploy → send me the `*.vercel.app` URL.
- [ ] **YOU:** add `NEXTAUTH_URL` + `NEXT_PUBLIC_SITE_URL` = that URL → redeploy.

### C. Make the product real (the actual work — weeks, not hours)
- [ ] **ME:** mount a next-auth `SessionProvider`; wire `LoginForm` to
      `signIn('google')`; delete the fake `setUser()` login path.
- [ ] **ME:** migrate UI call sites onto `lib/dataClient.ts`, one feature at a
      time, wallet first. Verify on `local` (no regression) before `http`.
      Never a repo-wide find-and-replace.
- [ ] **YOU:** Neon → New Project `companio`, region Mumbai/Singapore → copy pooled + direct strings.
- [ ] **YOU:** Google Cloud → OAuth consent (External) → Web client; redirect URIs
      `http://localhost:3000/api/auth/callback/google` + `https://<vercel-url>/api/auth/callback/google`.
- [ ] **YOU:** Razorpay → test keys; Webhooks → `https://<vercel-url>/api/razorpay/webhook`, secret, subscribe `payment.captured`.
- [ ] **ME:** `npx prisma migrate deploy` + `npx prisma db seed`, promote your
      account to `role='admin'`, flip `NEXT_PUBLIC_DATA_CLIENT=http`, run the
      verify gates, smoke-test a real ₹199 payment end to end.
- [ ] **ME:** set Vercel Cron for `/api/cron` with `CRON_SECRET`.

### D. At real launch
- [ ] Point `trycompanio.com` at Vercel → DNS. Razorpay business KYC → swap test→live keys.
- [ ] Upgrade Vercel to Pro, **one seat** (commercial-use requirement).
- [ ] Compress `public/hero.mp4` (2.48 MB — the heaviest asset on the site).
- [ ] Watch CSP `Report-Only` violations for a few days, then enforce.

---

## Complete env list (25 total)

> ### ⚠️ The old secrets in this file were public. Regenerate them.
>
> Until 2026-07-10 this file printed a live `NEXTAUTH_SECRET` and `CRON_SECRET`
> in plaintext, in a **public** GitHub repo, from commit `07c46b1` onward. They
> are burned — they remain in git history forever and must never be used.
> `NEXTAUTH_SECRET` signs session JWTs, so anyone holding it can forge a session
> for any user, including `role='admin'`.
>
> **Never write a real secret into this file again.** Generate fresh values and
> paste them straight into the Vercel dashboard (marked *Sensitive*) and your
> local `.env` (gitignored):
>
> ```bash
> openssl rand -base64 32   # NEXTAUTH_SECRET
> openssl rand -base64 24   # CRON_SECRET
> ```

**Demo mode — 3 (+2 after first deploy):**
```
NEXT_PUBLIC_DATA_CLIENT=local
NEXTAUTH_SECRET=...
CRON_SECRET=...
# after first deploy:
NEXTAUTH_URL=https://<url>
NEXT_PUBLIC_SITE_URL=https://<url>
```

**Essential for real E2E — 16:** DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET,
NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, RAZORPAY_KEY_ID,
NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
RESEND_API_KEY*, EMAIL_FROM*, NEXT_PUBLIC_DATA_CLIENT=http, NEXT_PUBLIC_SITE_URL,
CRON_SECRET, **ADMIN_EMAILS**. (*Resend optional — skip for now.)

**Optional — 12:** UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, GST_ACTIVE,
SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, NEXT_PUBLIC_GA_ID,
NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, SMS_API_KEY,
NEXT_PUBLIC_MAPTILER_KEY, NEXT_PUBLIC_MAP_TILE_URL.

### Vars added 2026-07-10 — read these before deploying

| Var | Read by | Why it exists |
|---|---|---|
| `ADMIN_EMAILS` | `lib/server/admin.ts` | **Without it nobody can ever reach `/admin`.** `User.role` defaults to `user`, and only an existing admin could promote anyone — a closed loop on a fresh database. Comma-separated; any signed-in account with a listed email is promoted on first visit. It is a permanent root key: keep it to addresses you control. |
| `MARKETPLACE_PAYMENTS_ENABLED` | `lib/server/pricing.ts` | **Leave it unset.** Set to the exact string `true` only when Razorpay Route (or a PA licence) is in place. It unlocks `kind=booking\|credits\|plus` in `create-order` — the flows where Companio collects a user's money and owes part of it to a companion. Doing that unlicensed is the RBI Payment Aggregator breach. v1 sells the ₹199 unlock only, and that needs no flag. |
| `NEXT_PUBLIC_MAPTILER_KEY` | `lib/map/tiles.ts` | Basemap tiles. **Unset = OpenStreetMap's community servers**, which permit commercial use but forbid heavy traffic under the OSMF Tile Usage Policy. Set a key before real volume. (`NEXT_PUBLIC_MAP_TILE_URL` + `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` accept any raster source you license instead.) The old hardcoded CARTO basemap was enterprise-only for commercial use and has been removed. |
| `GST_ACTIVE` | `lib/server/payments.ts` | Was undocumented. `true` once GST registration is live; receipts show ₹0 tax until then. |
| `ALLOW_TEST_CHECKOUT` | `app/api/test-checkout/route.ts` | Added 2026-07-13. `true` lets the ₹199 unlock complete **for free**, so the only thing Companio sells can be clicked through before Razorpay exists. It grants the benefit through `settlePurchase()` — the same function the real webhook calls — so what works here works in production, and the RBI gate still applies (only `unlock`). **The off switch is `RAZORPAY_KEY_ID`:** its presence is an unconditional refusal, so the day the real keys are pasted in this endpoint stops working with no code change and nothing to remember. Only the exact string `true` enables it. |

### Deploying to Vercel with no keys — read this or sign-in will look broken

A Vercel deployment runs with `NODE_ENV=production`, and **production refuses to
send a sign-in code it cannot email** (`lib/server/otp.ts`). That is deliberate:
accepting the request, sending nothing, and showing "check your inbox" is precisely
the theatre this codebase spent a week deleting.

The practical consequence: **on a Vercel deploy with no `RESEND_API_KEY`, nobody
can sign in at all.** The code is not printed to the screen there — that only
happens outside production, where no real user's code exists to leak.

So pick one:

- **Test locally** (`npm run dev`), where the code appears on the sign-in screen. This
  is the fastest path and needs no keys at all.
- **Or set `RESEND_API_KEY` in Vercel** (free tier: 3,000 emails/month) before
  expecting anyone to sign in to the deployed site.

`ALLOW_TEST_CHECKOUT=true` in Vercel does work, and is safe there — but it is
useless without a way to sign in first.

**A note on `NEXT_PUBLIC_RAZORPAY_KEY_ID`.** The instant this is set, the demo
payment path becomes unreachable by design — `lib/razorpayClient.ts` no longer
degrades a 401 or 503 into "run the local simulation". Before this change, a
keyed build handed every signed-out visitor a free ₹199 unlock. So set it only
together with `DATABASE_URL`, `NEXTAUTH_SECRET` and the Google credentials, or
users will hit a real "please sign in" wall with no way past it.

- `GST_ACTIVE` is read at `lib/server/payments.ts:56` but is **not** in
  `.env.example` — add it there.
- `SMS_SENDER_ID` is in `.env.example` but read nowhere — OTP was skipped.
- `SENTRY_AUTH_TOKEN` is new: `next.config.ts` now wraps the build with
  `withSentryConfig`, and source maps upload only when this token is present.
- **Upstash is not really optional in production.** Without it `rateLimit()`
  falls back to an in-memory Map that is per-instance — on Vercel's serverless
  functions that provides almost no protection.

Mark secrets sensitive in Vercel. `NEXT_PUBLIC_*` are browser-exposed by design.
Any env change needs a redeploy.

---

## Verify gates (run after every change)
`npx tsc --noEmit` · `npx vitest run` · prod build
(`NODE_OPTIONS=--max-old-space-size=6144 npx next build`).
**Last verified (10 Jul 2026): tsc 0 · 150 tests · build OK.**

## Honest gaps before real public users
- **Login is fake and payment is a demo animation.** See "What actually blocks
  launch" above. This is the gap; everything else is secondary.
- Admin panel + persisted doc-status + duplicate-block **only operate with a DB**
  (gate requires `DATABASE_URL` + `role='admin'`) — by design, not a bug.
- Doc checks = sanity (format + file + OCR), **not identity proof**. Manual
  admin-approve is the backstop. Site copy still claims "KYC verified" —
  over-claim risk; revisit before scaling.
- `lib/company.ts` still has `[[Grievance Officer full name]]` and
  `[[Grievance Officer phone]]`. `COMPANY_DISPLAY` stops the raw placeholder
  rendering, but **DPDPA requires a real, reachable officer.** LLPIN, registered
  address and the `@trycompanio.com` mailboxes are filled.
- CSP is `Content-Security-Policy-Report-Only` with `unsafe-inline`/`unsafe-eval`
  (`proxy.ts`) — no XSS containment until it is enforced.
- Real companions: onboard via Apply → admin approve, or seed starters. Catalogue
  is demo profiles until then.
- `public/hero.mp4` is 2.48 MB and the homepage weighs ~4.8 MB. The video is now
  skipped for reduced-motion / Data-Saver / 2G-3G users, but it still needs
  re-encoding before paid traffic.

# Companio — Go-Live Runbook, Deployment & Buying Plan

> **Single source of truth for launch.** Read this first when resuming. "YOU" =
> you procure / paste a value. "ME" = code/commands Claude runs.

## Timeline & strategy (locked)

- **Today (≈26 Jun 2026): full end-to-end deploy + test on FREE tiers.** "Normal"
  deploy does NOT mean partial — every feature works end-to-end. We only defer
  *spending money*; all infra used today is free.
- **Official release: 29 Jun 2026.** On/around the 29th we buy the paid pieces
  (domain, and upgrade tiers as needed) and flip to the production setup.
- **Cost to deploy + test today: ₹0** (free tiers everywhere). Domain (~₹1,000)
  is the only guaranteed spend, bought on/around the 29th.

## Decisions locked

| Topic | Decision |
|---|---|
| Auth at launch | **Google OAuth only.** Phone OTP **skipped** (stub `verifyOtp()` left inert; DLT reg + per-SMS cost not worth it now). |
| Email (Resend) | **Skipped for now** — app runs fine, emails are no-ops. Add later. |
| KYC vendor | **Skipped for now.** Using **free document-sanity checks** (built) + **manual admin approve**. Vendor (Digio/Cashfree ~₹3–5/check) added when scaling. |
| Company structure | **LLP recommended** (bootstrapping; limited liability). Pvt Ltd only if raising VC. **Confirm with a CA.** Code uses **LLPIN** field if LLP. |
| Data mode | `NEXT_PUBLIC_DATA_CLIENT=local` for demo; flip to `http` after Neon is migrated + seeded. |
| Hosting | **Vercel** (free Hobby to test → **Pro ~₹1,700/mo required** for commercial use once taking real money). |
| Git | Repo **github.com/samarth-bharti/companio**; commits authored **samarth / samarthsgsits23@gmail.com** ONLY (no office IDs: jitender/ozpool/manmeet). |

---

## What we are going to BUY (and when)

Everything is free to deploy + test today. The table is what to actually pay for
around the 29th.

| # | Thing | When | Cost | Needed for | Creds it produces |
|---|---|---|---|---|---|
| 1 | **Domain** `trycompanio.com` | ~29 Jun | ~₹1,000/yr | Real URL, OAuth, email | — |
| 2 | **Neon** Postgres | now (free) | ₹0 (free tier holds 500–1k users) | All real data | `DATABASE_URL`, `DIRECT_URL` |
| 3 | **Google Cloud** OAuth | now (free) | ₹0 | Login | `GOOGLE_CLIENT_ID/SECRET` |
| 4 | **Razorpay** (test → live) | test now; live ~29 after KYC | ₹0 signup; ~2%/txn from revenue | Payments | `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` |
| 5 | **Vercel** Hobby → **Pro** | Hobby now; Pro at real launch | ₹0 → ~₹1,700/mo | Hosting (Pro = commercial) | — |
| 6 | **Razorpay business KYC** | ~29 | ₹0 (needs PAN + bank) | Leave test mode | — |
| 7 | KYC vendor (optional) | when scaling companions | ~₹3–5/check | Automated ID verify | vendor key |
| 8 | Resend / Upstash / Sentry / GA4 / PostHog | anytime | ₹0 (free tiers) | email / rate-limit / monitoring | see env list |

**Monthly at real scale (≈10k traffic, 500–1k buyers):** ~₹1,700/mo (Vercel Pro);
Neon free tier holds, upgrade to ~₹1,600/mo only if always-on wanted. Razorpay
~2% of sales (from revenue, not budget). Budget ₹5k comfortably covers launch.

---

## Deployment steps

### A. Push code (one-time)
- [ ] **YOU:** run the two governance overrides in the Claude Code terminal:
      `$env:CLAUDE_SKIP_IDENTITY_CHECK = '1'; $env:CLAUDE_ALLOW_OTHER_REPO = '1'`
- [ ] **YOU:** ensure `github.com/samarth-bharti/companio` exists (private) and the
      machine can push to it (logged in as samarth-bharti or has a token).
- [ ] **ME:** set repo-local identity → samarth; commit full tree (junk excluded);
      add the samarth-bharti remote; push `main`.

### B. Demo-mode link (fastest CEO-testable URL, ₹0)
- [ ] **YOU:** vercel.com (sign up with samarth-bharti GitHub) → import `companio`.
- [ ] **YOU:** add the 3 demo envs (below) → Deploy → send me the `*.vercel.app` URL.
- [ ] **YOU:** add `NEXTAUTH_URL` + `NEXT_PUBLIC_SITE_URL` = that URL → redeploy.

### C. Full end-to-end (real DB/auth/payments, free tiers)
- [ ] **YOU:** Neon → New Project `companio`, region Mumbai/Singapore → copy pooled + direct strings.
- [ ] **YOU:** Google Cloud → OAuth consent (External) → Web client; redirect URIs
      `http://localhost:3000/api/auth/callback/google` + `https://<vercel-url>/api/auth/callback/google`.
- [ ] **YOU:** Razorpay → test keys; Webhooks → `https://<vercel-url>/api/razorpay/webhook`, secret, subscribe `payment.captured`.
- [ ] **GIVE ME:** the 4 essential cred groups (DB, Google, Razorpay) — see env list.
- [ ] **ME:** put in `.env`, `npx prisma migrate deploy` + `npx prisma db seed`,
      promote your account to `role='admin'`, flip `NEXT_PUBLIC_DATA_CLIENT=http`,
      run the verify gates, smoke-test the full flow.
- [ ] **ME:** set Vercel Cron for `/api/cron` with `CRON_SECRET`.

### D. At real launch (~29)
- [ ] Buy domain → add in Vercel → DNS. Razorpay business KYC → swap test→live keys.
- [ ] Upgrade Vercel to Pro (commercial-use requirement).

---

## Complete env list (25 total)

Generated secrets (reuse): `NEXTAUTH_SECRET=i9ZvY+8k6yS/sjJSr1FZTBnQI+wlpmQR35rnuDd92KQ=` ·
`CRON_SECRET=AjJR8pvorJaZF8umdQZc1OAd7+CbJSon`

**Demo mode — 3 (+2 after first deploy):**
```
NEXT_PUBLIC_DATA_CLIENT=local
NEXTAUTH_SECRET=...
CRON_SECRET=...
# after first deploy:
NEXTAUTH_URL=https://<url>
NEXT_PUBLIC_SITE_URL=https://<url>
```

**Essential for real E2E — 15:** DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET,
NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, RAZORPAY_KEY_ID,
NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
RESEND_API_KEY*, EMAIL_FROM*, NEXT_PUBLIC_DATA_CLIENT=http, NEXT_PUBLIC_SITE_URL,
CRON_SECRET. (*Resend optional — skip for now.)

**Optional — 10:** UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, GST_ACTIVE,
SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_POSTHOG_KEY,
NEXT_PUBLIC_POSTHOG_HOST, SMS_API_KEY, SMS_SENDER_ID.

Mark secrets sensitive in Vercel. `NEXT_PUBLIC_*` are browser-exposed by design.
Any env change needs a redeploy.

---

## Verify gates (run after every change)
`npx tsc --noEmit` · `npx vitest run` · prod build
(`NODE_OPTIONS=--max-old-space-size=6144 npx next build`).
**Last verified (26 Jun): tsc 0 · 150 tests · build OK.**

## Honest gaps before real public users
- Admin panel + persisted doc-status + duplicate-block **only operate with a DB**
  (gate requires `DATABASE_URL` + `role='admin'`) — by design, not a bug.
- Doc checks = sanity (format + file + OCR), **not identity proof**. Manual
  admin-approve is the backstop. Site copy still claims "KYC verified" (user
  chose not to soften yet) — over-claim risk; revisit before scaling.
- `lib/company.ts` legal placeholders (LLPIN/CIN, registered address, Grievance
  Officer name+phone) still need real values before public legal pages are valid.
- Real companions: onboard via Apply → admin approve, or seed starters. Catalogue
  is demo profiles until then.

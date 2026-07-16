# Deploying Companio

Target: **Vercel + Neon**. This is the whole path from an empty Vercel account to
a live site, plus the short list of things that genuinely cannot be verified
until real keys exist.

---

## 0. What launches, and what does not

Companio launches **supply-first**. The companion catalogue is empty — there are
no companions until real people apply and pass an ID check — and a pass buys
nothing except access to that catalogue. So on day one:

| Surface | State |
|---|---|
| Marketing pages, safety, trust, terms | Live |
| Sign-in (email OTP + Google) | Live |
| Companion applications (`/become-a-companion` → `/admin/applications`) | **Live — this is the launch** |
| Explore / catalogue | Live, and empty until applications are approved |
| Pass checkout (₹199 / ₹499 / ₹999 / ₹1999) | **Built and tested, switched OFF** (`PASS_SALES_ENABLED`) |
| Paid meetups, credit packs, Companio Plus | **Off, and must stay off** — see §6 |

Turn pass sales on (§5) once there are companions worth ₹199 to a member.

---

## 1. Neon

1. Create a project (region: **Singapore / ap-southeast-1** — closest to Indian users).
2. Take **two** connection strings from the dashboard:
   - the **pooled** one (`-pooler` in the host) → `DATABASE_URL`
   - the **direct** one (no `-pooler`) → `DIRECT_URL`
3. Both need `?sslmode=require`.

`DIRECT_URL` is not optional. Prisma migrations run over a direct connection;
running them through the pooler fails in ways that look like random timeouts.

---

## 2. Vercel

1. Import the repo. Framework preset: Next.js. Build command is already correct
   (`package.json` → `build` runs `scripts/migrate-on-deploy.mjs && next build`).
2. Add every variable in §3.
3. Deploy.

**Migrations run themselves on production deploys only.**
`scripts/migrate-on-deploy.mjs` runs `prisma migrate deploy` when
`DATABASE_URL` + `DIRECT_URL` exist **and** `VERCEL_ENV === 'production'` (or
`RUN_MIGRATIONS=true`). Preview builds skip it deliberately: previews used to
migrate the production database.

---

## 3. Environment variables

Set these in **Vercel → Settings → Environment Variables**. `[[...]]`,
`<...>`, `changeme`, `todo`, `your_*` and `xxx` are all read as **unset** by
`lib/env.ts#isPlaceholder`, so a half-filled value fails closed rather than
reaching a live API with garbage.

### Required — the site will not function without these

| Var | Where it comes from | Notes |
|---|---|---|
| `DATABASE_URL` | Neon, pooled | |
| `DIRECT_URL` | Neon, direct | migrations |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | also salts OTP hashes — **changing it invalidates every live sign-in code** |
| `NEXTAUTH_URL` | `https://trycompanio.com` | must match the real origin exactly |
| `NEXT_PUBLIC_SITE_URL` | `https://trycompanio.com` | canonical URLs, OG tags, sitemap |
| `ADMIN_EMAILS` | your own email(s), comma-separated | bootstrap only — see §4 |

### Required before taking money

| Var | Where it comes from |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | same, shown **once** at generation |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same value as `RAZORPAY_KEY_ID` (publishable; safe in the bundle) |
| `RAZORPAY_WEBHOOK_SECRET` | you choose it when creating the webhook (§5) |
| `PASS_SALES_ENABLED` | `true` — **only when real companions exist** |

### Required for email

| Var | Where it comes from |
|---|---|
| `RESEND_API_KEY` | resend.com, after verifying the sending domain |
| `EMAIL_FROM` | e.g. `Companio <hello@trycompanio.com>` — the domain must be the verified one |

Without `RESEND_API_KEY`, **email sign-in refuses in production** (an honest 503
and the UI offers Google instead). It does not silently print codes to the
screen — that only happens outside production.

### Strongly recommended

| Var | Why |
|---|---|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Rate limiting. Without these the limiter falls back to in-memory, which on serverless means **per-instance** — i.e. barely a limiter. Payment and OTP endpoints are the abuse targets. |
| `CRON_SECRET` | Any random string. Guards `/api/cron`. Without it the cron endpoint is open. |
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Errors. `SENTRY_AUTH_TOKEN` additionally uploads source maps at build. |

### Optional

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Google sign-in — the button only
renders when both resolve), `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY` /
`NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_MAPTILER_KEY` /
`NEXT_PUBLIC_MAP_TILE_URL` / `NEXT_PUBLIC_MAP_ATTRIBUTION`, `KYC_PROVIDER`.

### Must NOT be set in production

| Var | Why |
|---|---|
| `ALLOW_TEST_CHECKOUT` | Grants passes for free. It refuses automatically once `RAZORPAY_KEY_ID` exists, but do not rely on that — leave it unset. |
| `MARKETPLACE_PAYMENTS_ENABLED` | Arms paid meetups. **See §6 before ever setting this.** |
| `GST_ACTIVE` | Only once GST registration is real. Setting it early stamps a tax component onto invoices you are not registered to collect. |

> **`.env.example` is not updated by this change** — it is outside what this
> workflow can write. It needs `PASS_SALES_ENABLED` added, documented as
> default-off and gated on real companion supply.

---

## 4. Google OAuth

1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID → Web.
2. Authorised JavaScript origin: `https://trycompanio.com`
3. Authorised redirect URI: `https://trycompanio.com/api/auth/callback/google`
4. The consent screen needs a privacy policy URL (`/privacy`) and terms URL
   (`/terms`) — both exist.

## 5. Razorpay

1. Complete KYC on the Razorpay account. This takes days, not minutes — **start it first**.
2. Generate **live** API keys. The secret is shown once.
3. Create the webhook:
   - URL: `https://trycompanio.com/api/razorpay/webhook`
   - Secret: generate one, put the same value in `RAZORPAY_WEBHOOK_SECRET`
   - Events: **`payment.captured`** (the only one handled)
4. Set `PASS_SALES_ENABLED=true` **only when the catalogue has real companions.**

Verify + webhook both settle, and settlement is idempotent, so the two firing for
one payment is safe and expected.

## 6. The line you must not cross

`lib/server/pricing.ts` refuses `booking`, `credits` and `plus` purchases unless
`MARKETPLACE_PAYMENTS_ENABLED=true`. That gate is not a feature flag — it is a
licence boundary.

The moment Companio collects a member's money and owes part of it to a companion,
it is pooling and settling third-party funds: **Payment Aggregator** activity
under the RBI rules (₹15 crore net worth to apply, ₹25 crore within three years).
A Razorpay key does not make that legal.

The legitimate route to paid meetups is **Razorpay Route** with linked accounts,
where Razorpay is the aggregator of record and pays companions directly. That
needs Route enabled on the account and KYC on every companion before they can
receive a rupee. **Neither exists in this codebase yet.** Do not set this flag to
ship a feature.

## 7. Admin access

`ADMIN_EMAILS` is a **bootstrap**, not the permission system:

1. Set `ADMIN_EMAILS=you@example.com`.
2. **Sign in once** with that email. The seed never invents a login.
3. `npx prisma db seed` (or just visit `/admin` — the gate promotes on the way through).

Role `admin` then persists in the database. Suspended or banned accounts are
never admin regardless of the allowlist.

## 8. Domain

1. Vercel → Domains → add `trycompanio.com`, follow the DNS instructions.
2. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the final origin.
3. Add the same domain to Resend and complete SPF/DKIM, or email silently lands
   in spam.

---

## 9. What must be verified after the keys land

Everything below is tested as far as it can be without live credentials — 425
unit tests, a clean typecheck, and a clean build. These are the things that
**cannot** be proven without a real transaction against real keys. Budget about
fifteen minutes.

1. **One real payment, end to end.** Buy the ₹199 pass with a real card, then
   refund it from the Razorpay dashboard. This is the only way to prove the
   live/test key split and the HMAC signature verification. Signature
   verification fails **silently and closed** if the secret is wrong: checkout
   appears to work and the pass is never granted.
2. **The webhook actually arrives.** Razorpay Dashboard → Webhooks → check the
   delivery log shows a 200 for that payment. A webhook pointed at a preview URL,
   or registered for the wrong event, produces exactly zero symptoms until a
   customer pays and gets nothing.
3. **One real OTP email lands** in an inbox that is not yours, and not in spam.
4. **Google sign-in on the real domain** — the redirect URI must match to the
   character.
5. `/admin` opens for you and 404s/redirects for a signed-out browser.

Then, before flipping `PASS_SALES_ENABLED=true`: approve at least one real
companion application and confirm the explore grid shows a real, ID-checked
person. The pass is a promise about that grid.

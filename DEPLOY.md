# Deploying Companio

Everything from an empty Vercel account to a live site: what to buy, what it
costs, where each key comes from, and what genuinely cannot be verified until
real keys exist.

Target stack: **Vercel + Neon + Razorpay + Resend**.

- Running it once it is live → [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- When something breaks → [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)
- Why the code is shaped this way → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 0. What launches, and what does not

Companio launches **supply-first**. The catalogue is empty — there are no
companions until real people apply and pass an ID check — and a pass buys nothing
except access to that catalogue.

| Surface | State |
|---|---|
| Marketing, safety, trust, terms | Live |
| Sign-in (email OTP + Google) | Live |
| Companion applications → `/admin/applications` | **Live — this is the launch** |
| Explore / catalogue | Live, and empty until applications are approved |
| Pass checkout (₹199 / ₹499 / ₹999 / ₹1999) | **Built and tested, switched OFF** (`PASS_SALES_ENABLED`) |
| Paid meetups, credit packs, Plus | **Off, and must stay off** — §7 |

Turn pass sales on once there are companions worth ₹199 to a member. Note a city
needs **several**: with one companion she is the free preview, so the pass sells
nothing there.

---

## 1. What to buy, and what it costs

Verified against official pricing pages, July 2026. Anything I could not confirm
from an official source is marked — **do not treat it as fact**.

| Service | Free tier | What you pay | ~INR/mo |
|---|---|---|---|
| **Vercel Pro** | Hobby exists but **forbids commercial use** | **$20/user/mo** (incl. $20 usage credit) | **~₹1,750** |
| **Neon** | 0.5 GB storage, 100 CU-hrs/project | Launch tier: no fixed fee, $0.106/CU-hr + $0.35/GB-mo | ₹0 → ~₹450 |
| **Resend** | 100/day, 3,000/mo, 1 domain | Pro $20/mo (50K emails) | ₹0 → ~₹1,750 |
| **Upstash Redis** | 500K commands/**month** | PAYG $0.20/100K | ₹0 → ~₹100 |
| **Vercel Blob** | 5 GB storage, 100 GB transfer | $0.023/GB-mo + regional transfer | ~₹0 |
| **Sentry** | 5K errors/mo, 1 user | Team $26/mo annual | ₹0 → ~₹2,280 |
| **Domain (.com)** | — | Cloudflare Registrar sells at cost | ~₹1,000–1,500/**yr** *(exact price unverified — their page is JS-gated)* |
| **Razorpay** | — | **2% + 18% GST = 2.36% effective**. No setup fee, no AMC, no refund fee | per-transaction |

### Realistic launch cost: **~₹1,750/month + a domain**

Everything else stays free below roughly 1,000 users. Against a ₹5,000/month
budget you have room, but not for Sentry Team (₹2,280) **and** Resend Pro
(₹1,750) on top of Vercel Pro — that is ₹5,780. Stay on the free tiers of both
until they actually bite (5K errors/month; 100 emails/day).

### The line item you cannot avoid

**Vercel Hobby forbids commercial use.** Their terms name *"any method of
requesting or processing payment from visitors of the site"* as commercial —
donations included. A ₹199 pass is squarely commercial.

So **Pro is mandatory from the day payments go live**, regardless of traffic.
This is a licence question, not a performance one. Budget ₹1,750/month before you
earn ₹1.

### What Razorpay actually costs you

2% + 18% GST on the fee = **2.36% effective**.

| Pass | Price | Razorpay takes | You keep |
|---|---|---|---|
| 1 month | ₹199 | ~₹4.70 | ~₹194.30 |
| 3 months | ₹499 | ~₹11.78 | ~₹487.22 |
| 12 months | ₹999 | ~₹23.58 | ~₹975.42 |
| Lifetime | ₹1999 | ~₹47.18 | ~₹1951.82 |

Settlement is **T+1** by default (instant settlement is a paid add-on). Refunds
do **not** return Razorpay's fee — a refunded ₹199 costs you the ~₹4.70 either
way.

---

## 2. Neon (database)

1. Create a project. Region: **Singapore / ap-southeast-1** — closest to Indian
   users.
2. Take **two** connection strings:
   - the **pooled** one (`-pooler` in the host) → `DATABASE_URL`
   - the **direct** one (no `-pooler`) → `DIRECT_URL`
3. Both need `?sslmode=require`.

`DIRECT_URL` is not optional. Migrations run over a direct connection; through
the pooler they fail in ways that look like random timeouts. The app itself must
use the **pooled** one, or serverless invocations exhaust Postgres' connection
limit under trivial load.

## 3. Vercel

1. Import the repo. Framework preset: Next.js — the build command is already
   correct (`scripts/migrate-on-deploy.mjs && next build`).
2. **Upgrade to Pro** (§1).
3. Add every variable in §5.
4. Deploy.

**Migrations run themselves on production deploys only.**
`scripts/migrate-on-deploy.mjs` runs `prisma migrate deploy` when `DATABASE_URL`
+ `DIRECT_URL` exist **and** `VERCEL_ENV === 'production'` (or
`RUN_MIGRATIONS=true`). Previews skip it deliberately — they used to migrate the
production database.

## 4. Photos (Vercel Blob)

Vercel → **Storage** → **Create** → **Blob** → connect it to this project.
`BLOB_READ_WRITE_TOKEN` is injected automatically; redeploy once so the running
build picks it up.

That is the whole setup — no image CDN, no transform rules.
`lib/server/photoStore.ts` resizes and blurs every portrait with sharp at ingest
and stores both variants itself, so the paywall never depends on a third party
honouring a `?blur=` parameter.

**How a portrait reaches a profile, with no manual step:**

1. The applicant uploads their photo in `/become-a-companion`.
2. `/api/application/upload` validates it, blurs it, stores both variants. (The
   **ID document** is hashed and discarded — a portrait is published by design;
   an Aadhaar image is a DPDPA liability once its number is checked.)
3. Approving in `/admin/applications` copies both onto the profile, which goes
   **live with the applicant's own face**.
4. A member without a pass is served the blurred variant. The sharp URL is never
   in the response at all.

Free tier is 5 GB; a portrait is ~150 KB.

## 5. Environment variables

Set these in **Vercel → Settings → Environment Variables**.

`[[...]]`, `<...>`, `changeme`, `todo`, `your_*` and `xxx` are all read as
**unset** by `lib/env.ts#isPlaceholder`, so a half-pasted value fails closed
rather than reaching a live API with garbage.

### Required — the site will not work without these

| Var | Where it comes from | Notes |
|---|---|---|
| `DATABASE_URL` | Neon, **pooled** | |
| `DIRECT_URL` | Neon, **direct** | migrations only |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | also salts the OTP hash — **changing it invalidates every live code and session** |
| `NEXTAUTH_URL` | `https://trycompanio.com` | must match the real origin exactly |
| `NEXT_PUBLIC_SITE_URL` | `https://trycompanio.com` | canonical URLs, OG tags, sitemap |
| `ADMIN_EMAILS` | your own email(s), comma-separated | bootstrap only — §8 |
| `NEXT_PUBLIC_DATA_CLIENT` | `http` | **`local` is the localStorage demo.** Production must be `http` |

### Required before taking money

| Var | Where |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | same, **shown once** at generation |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same value as `RAZORPAY_KEY_ID` (publishable; safe in the bundle) |
| `RAZORPAY_WEBHOOK_SECRET` | **you choose it** when creating the webhook — §6 |
| `PASS_SALES_ENABLED` | `true` — **only when real companions exist** |

### Required for photos

| Var | Where |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | injected by Vercel when you connect a Blob store (§4) |

### Required for email

| Var | Where |
|---|---|
| `RESEND_API_KEY` | resend.com, **after verifying the sending domain** |
| `EMAIL_FROM` | e.g. `Companio <hello@trycompanio.com>` — domain must be the verified one |

Without `RESEND_API_KEY`, **email sign-in refuses in production** (an honest 503;
the UI offers Google instead). It does not print codes to the screen — that only
happens outside production.

### Strongly recommended

| Var | Why |
|---|---|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | **Rate limiting.** Without these the limiter falls back to in-memory, which on serverless is per-instance and resets on every cold start — i.e. barely a limiter. Your payment and OTP endpoints are the abuse targets. Free at this scale. |
| `CRON_SECRET` | `openssl rand -hex 32`. Guards `/api/cron`. Without it that endpoint is open. |
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Errors. `SENTRY_AUTH_TOKEN` additionally uploads source maps at build. |

### Optional

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (the button only renders when both
resolve), `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY` /
`NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_MAPTILER_KEY` /
`NEXT_PUBLIC_MAP_TILE_URL` / `NEXT_PUBLIC_MAP_ATTRIBUTION`, `KYC_PROVIDER`.

### Must NOT be set in production

| Var | Why |
|---|---|
| `ALLOW_TEST_CHECKOUT` | Grants passes for free. It refuses automatically once `RAZORPAY_KEY_ID` exists, but do not rely on that — leave it unset. |
| `MARKETPLACE_PAYMENTS_ENABLED` | Arms paid meetups. **Read §7 before ever setting this.** |
| `GST_ACTIVE` | Only once GST registration is real (§9). Setting it early stamps a tax component onto invoices you are not registered to collect. |

> **`.env.example` is not maintained by this repo's tooling.** It needs
> `PASS_SALES_ENABLED` and `BLOB_READ_WRITE_TOKEN` added, both documented as
> default-off.

### Rotate the leaked secrets

**`NEXTAUTH_SECRET` and `CRON_SECRET` were committed to a public repo at
`07c46b1`.** Git history is public forever; the commit being old does not help.
Generate new ones before launch.

## 6. Razorpay

1. **Complete KYC first.** It takes days, not minutes — start before anything
   else. *(The exact LLP document list and activation time are not published
   officially; ask your Razorpay contact. Do not confuse the RazorpayX current-account
   KYC docs with the payment-gateway ones — different product.)*
2. Generate **live** API keys. The secret is shown once.
3. Create the webhook:
   - URL: `https://trycompanio.com/api/razorpay/webhook`
   - Secret: generate one; the same value goes in `RAZORPAY_WEBHOOK_SECRET`
   - Events: **`payment.captured`** — the only one handled
4. Set `PASS_SALES_ENABLED=true` **only when the catalogue has real companions.**

`verify` and `webhook` both settle, and settlement is idempotent, so both firing
for one payment is safe and expected.

## 7. The line you must not cross

`lib/server/pricing.ts` refuses `booking`, `credits` and `plus` purchases unless
`MARKETPLACE_PAYMENTS_ENABLED=true`. **That gate is a licence boundary, not a
feature flag.**

The moment Companio collects a member's money and owes part of it to a companion,
it is pooling and settling third-party funds — **Payment Aggregator** activity
under the RBI's PA/PG guidelines. New PAs need **₹15 crore net worth at
application, rising to ₹25 crore by the end of the third financial year**. You
will not clear that.

The legitimate route is **Razorpay Route**, where Razorpay is the aggregator of
record and pays companions directly. It costs **0.25% per transfer** on top of
the 2% gateway fee, and it is **not self-serve**:

- Razorpay requires **payer–payee transparency** — the linked account must
  directly interface with your customers — plus written approval of your use case.
- There are **financial turnover thresholds** *(figures not published — ask your
  rep)*.
- Razorpay's docs flag a **31 Dec 2025 compliance deadline**: accounts using
  Route without the required proofs have had access disabled.

**Confirm Route eligibility before building marketplace payouts, not after.**
None of that wiring exists in this codebase today.

## 8. Admin access

`ADMIN_EMAILS` is a **bootstrap**, not the permission system:

1. Set `ADMIN_EMAILS=you@example.com`.
2. **Sign in once** with that email. The seed never invents a login — an admin
   row with no OAuth identity behind it is a credential nobody can use and
   everybody can find.
3. `npx prisma db seed`, or just visit `/admin` — the gate promotes on the way
   through.

Role `admin` then persists in the database. Suspended or banned accounts are
never admin, allowlist or not.

## 9. GST

Not required pre-revenue. The threshold is **₹20 lakh aggregate turnover** for a
services business (₹10 lakh in Manipur, Mizoram, Nagaland, Tripura) under CGST
Act s.22.

**One caveat worth a CA's opinion:** registration becomes mandatory *regardless
of turnover* if you supply through an e-commerce operator liable to collect TCS —
which becomes a live question the moment Route-based marketplace payouts exist.
Ask before that ships, not after.

Leave `GST_ACTIVE=false` until registration is real.

## 10. Domain

1. Vercel → Domains → add `trycompanio.com`, follow the DNS instructions.
2. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the final origin.
3. Add the same domain to **Resend** and complete SPF/DKIM, or email silently
   lands in spam.

## 11. Before you launch

- [ ] Vercel **Pro** (commercial use — §1)
- [ ] `NEXTAUTH_SECRET` and `CRON_SECRET` **rotated** (§5)
- [ ] Grievance Officer name + phone filled in `lib/company.ts` — **legally
      required** under DPDPA 2023 / the IT Act. Cannot be invented; nothing
      renders while they are `[[placeholders]]`, but the obligation stands.
- [ ] Blob store connected
- [ ] Upstash set (rate limiting is otherwise decorative)
- [ ] Razorpay KYC done, webhook created, delivery log checked
- [ ] `NEXT_PUBLIC_DATA_CLIENT=http`
- [ ] `ALLOW_TEST_CHECKOUT` unset, `MARKETPLACE_PAYMENTS_ENABLED` unset

## 12. What must be verified after the keys land

Everything below is tested as far as it can be without live credentials — 443
unit tests, a clean typecheck, a clean build, and the whole flow driven in a
browser against real Neon. These are the things that **cannot** be proven without
a real transaction. Budget fifteen minutes.

1. **One real payment, end to end.** Buy the ₹199 pass with a real card, then
   refund it from the Razorpay dashboard. This is the only way to prove the
   live/test key split and HMAC signature verification. **Signature verification
   fails silently and closed**: checkout appears to work and the pass is never
   granted.
2. **The webhook actually arrives.** Razorpay → Webhooks → the delivery log shows
   a 200 for that payment. A webhook pointed at a preview URL, or registered for
   the wrong event, produces exactly zero symptoms until a customer pays and gets
   nothing.
3. **One real OTP email lands** in an inbox that is not yours, and not in spam.
4. **Google sign-in on the real domain** — the redirect URI must match to the
   character.
5. `/admin` opens for you and redirects a signed-out browser.

Then, before flipping `PASS_SALES_ENABLED=true`: approve at least one real
companion application and confirm the explore grid shows a real, ID-checked
person with their own photo. The pass is a promise about that grid.

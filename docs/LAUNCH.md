# Launch: the whole path, in order

**Start here. This is the only file you have to read.**

Everything below is either a step you can do yourself or a link to the page that
explains one step in depth. It is written to be followed by a person with the
repo, a browser and a bank account, and nobody else.

_Written 2026-07-17, after the policy-alignment pass. If a fact here disagrees with
another file, this file and [`../DEPLOY.md`](../DEPLOY.md) win — see §9._

---

## The honest summary

**The software is finished. Four things stand between it and money, and only one
of them is technical.**

| # | Blocker | Who fixes it | How long |
|---|---------|-------------|----------|
| 1 | **No companions exist.** The catalogue is empty. | You, recruiting | Weeks. **This is the long pole.** |
| 2 | Three policy PDFs describe features that do not exist | Your lawyer | An email |
| 3 | Razorpay KYC not started | You + Razorpay | Days |
| 4 | Env vars, Vercel Pro, rotate two leaked secrets | You | An afternoon |

Nobody can promise Razorpay will approve you — it is an underwriter's judgement.
What §3 does is remove every known rejection cause on our side and tell you what to
do when they push back.

---

## 1. Today: the free things that unblock everything else

### 1.1 Set the business category to **Services**

Razorpay Dashboard → Account & Settings → Business Settings.

If you are seeing a **"minimum 5 products"** checklist, this is why: that rule
belongs to the **e-commerce storefront** category, where it exists to filter out
shell companies with two SKUs. It is not in Razorpay's own activation docs.

Companio sells **one pass at four durations**, not SKUs. Category should be
**Services** — sub-category "Dating / Matrimony / Social" or "Other services".
**Never E-commerce / Marketplace.**

This field drives the checklist you see, the review path, and the MDR you pay. It is
free to change and it is probably the entire problem.

> **Do not create fake companion profiles to reach five.** It is fabricating people
> to satisfy a check that does not apply, on a product whose only claim is that the
> people are real. If it is found after approval, that is a frozen account with your
> settlement money inside it. Full reasoning: [`PAYMENTS-ACTIVATION.md`](PAYMENTS-ACTIVATION.md) §1.

### 1.2 Start Razorpay KYC

It takes **days**, and everything else waits on it. Start it before you finish
reading this file.

Documents for an **LLP** — scans must be legible, and **expired or blurry scans are a
named rejection cause**:

- LLP PAN card
- LLP incorporation certificate / LLP agreement
- Designated partners' PAN + Aadhaar
- Bank account proof (cancelled cheque or statement) — **name must match the LLP exactly**
- GST certificate, if registered
- Registered office address proof

**The name-match trap.** Roughly 40% of Indian payment-gateway KYC delays are name
mismatches. These must agree **character for character**:

- `COMPANY.legalName` in `lib/company.ts` → `TRYCOMPANIOLABS LLP`
- The incorporation certificate
- The GST trade name, if registered
- The settlement bank account name

`Ltd.` vs `Limited`, a missing full stop, or a trade name that differs from the
registered name will each bounce it. Check this before you submit, not after.

### 1.3 Email the lawyer

Three executed documents describe a product you do not have. They were drafted from a
dating-app template. **Do not hand these to a reviewer as-is** — they advertise
recurring billing, which triggers a *second, slower* e-mandate approval on top of
standard KYC.

| Document | Clause | Problem |
|---|---|---|
| Refund Policy | §1, §4 | Auto-renewal, billing cycles, cancellation. **None exist.** A pass is one payment; no mandate is stored. |
| Refund Policy | §2, §5 | Boosts and wallet top-ups. **Cannot be bought** — `lib/server/pricing.ts` refuses them (RBI aggregator rule). The wallet holds *meetings*, not money. |
| Terms of Service | §4 | Same auto-renewal fiction. |
| Terms of Service | §2 | "subscriptions, boosts, wallet credit, or gifts". Only the pass is purchasable. |
| Community Guidelines | §3(k) | Same list. The published page already says "the pass". |

The full table with suggested wording: [`PAYMENTS-ACTIVATION.md`](PAYMENTS-ACTIVATION.md) §4.

### 1.4 Rotate the two leaked secrets

`NEXTAUTH_SECRET` and `CRON_SECRET` were committed to a **public** repo at `07c46b1`.
Git history is public forever; the commit being old does not help.

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 32      # CRON_SECRET
```

> **Rotating `NEXTAUTH_SECRET` invalidates every live session and every unused OTP.**
> Harmless now (no users). Not harmless later. Do it now.

---

## 2. This week: infrastructure

Full detail and costs: [`../DEPLOY.md`](../DEPLOY.md) §1–§5.

| Thing | Why | Note |
|---|---|---|
| **Vercel Pro** | **Mandatory, not a scaling choice.** The Hobby tier's terms forbid commercial use — taking payments on it risks the deployment itself. | ~$20/mo |
| **Neon** Postgres | The database | Launch tier gives 7-day point-in-time restore; Free gives 6 hours |
| **Vercel Blob** | Companion photos. Without it, uploads fail. | Connect in the Vercel dashboard; it injects `BLOB_READ_WRITE_TOKEN` |
| **Upstash** Redis | **Rate limiting.** Without it the limiter is in-memory — per-instance on serverless, resets on cold start, i.e. barely a limiter. Your OTP and payment routes are the abuse targets. | Free at this scale |
| **Resend** | OTP emails. Without it, email sign-in refuses in production and **nobody can sign in.** | Verify the sending domain, complete SPF/DKIM, or mail silently lands in spam |
| **Domain** | `trycompanio.com` | Add to Vercel *and* to Resend |

Realistic total: **~₹1,750/month + the domain.**

---

## 3. Environment variables

Set in **Vercel → Settings → Environment Variables**. The authoritative table is
[`../DEPLOY.md` §5](../DEPLOY.md#5-environment-variables).

**A placeholder reads as unset, not as a value.** `[[...]]`, `<...>`, `changeme`,
`todo`, `your_*` and `xxx` are all treated as absent by `lib/env.ts#isPlaceholder`, so
a half-pasted value fails closed instead of reaching a live API with garbage.

### The site will not work without these

```
DATABASE_URL              Neon, pooled
DIRECT_URL                Neon, direct — migrations only
NEXTAUTH_SECRET           openssl rand -base64 32  (the rotated one)
NEXTAUTH_URL              https://trycompanio.com  — must match the origin exactly
NEXT_PUBLIC_SITE_URL      https://trycompanio.com
NEXT_PUBLIC_DATA_CLIENT   http     ← "local" is the localStorage demo. Production MUST be http.
ADMIN_EMAILS              your email — see §5
RESEND_API_KEY            resend.com, after domain verification
EMAIL_FROM                Companio <hello@trycompanio.com>
```

### Before taking money

```
RAZORPAY_KEY_ID                 Razorpay → Settings → API Keys
RAZORPAY_KEY_SECRET             shown ONCE at generation
NEXT_PUBLIC_RAZORPAY_KEY_ID     same value (publishable, safe in the bundle)
RAZORPAY_WEBHOOK_SECRET         you choose it when creating the webhook
PASS_SALES_ENABLED              true — ONLY when real companions exist
BLOB_READ_WRITE_TOKEN           injected by Vercel when you connect Blob
```

### Strongly recommended

```
UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN    rate limiting
CRON_SECRET                                          openssl rand -hex 32 (the rotated one)
SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN                  errors
```

### Must NOT be set in production

```
ALLOW_TEST_CHECKOUT           grants passes free. Refuses once RAZORPAY_KEY_ID exists,
                              but do not rely on that — leave it unset.
MARKETPLACE_PAYMENTS_ENABLED  arms paid meetups. Read §7 of DEPLOY.md first — it is
                              a licence boundary, not a feature flag.
GST_ACTIVE                    only once GST registration is real
```

---

## 4. Razorpay setup, exactly

1. **KYC first** (§1.2). Live keys do not exist until it clears.
2. Generate **live** API keys. **The secret is shown once** — save it immediately.
3. Create the webhook:
   - URL: `https://trycompanio.com/api/razorpay/webhook`
   - Secret: generate one; the **same value** goes in `RAZORPAY_WEBHOOK_SECRET`
   - Events: **`payment.captured`** — the only one handled
4. Leave `PASS_SALES_ENABLED` unset until real companions exist.

`verify` and `webhook` both settle, and settlement is **idempotent**, so both firing
for one payment is safe and expected.

### What the reviewer will look at

- **`/pricing`** — this is your catalogue. Four tiers, real prices, reachable from the footer.
- **The policy pages** — all six exist and are linked in the footer: [`/terms`](https://trycompanio.com/terms), [`/privacy`](https://trycompanio.com/privacy), [`/refunds`](https://trycompanio.com/refunds), [`/delivery`](https://trycompanio.com/delivery), [`/community-guidelines`](https://trycompanio.com/community-guidelines), [`/cookies`](https://trycompanio.com/cookies), plus [`/contact`](https://trycompanio.com/contact).
- **The grievance disclosure** — in the footer of every page: name, address, LLPIN, email, phone.
- **`/explore`** — and this is where an empty catalogue kills you (§6).

### If they reject you

A rejection is not a ban. In order:

1. **Read the actual reason.** It arrives by email and names a specific field. Do not guess.
2. **Fix that one thing and re-submit.** Most rejections are one document or one name mismatch.
3. **Escalate to a human.** Dashboard support, then an account manager. A category dispute
   ("we are a service, not a store") is resolved by a person, not a form.
4. **Apply to Cashfree in parallel.** Applications are independent and free. Cashfree is the
   closest substitute — ~1.75–1.95%, T+1 settlement, and onboarding is often gentler for
   services. Provider comparison: [`PAYMENTS-ACTIVATION.md`](PAYMENTS-ACTIVATION.md) §6.

**Do not open a second Razorpay account to dodge a rejection.** Same PAN, same partners —
they link them, and it turns a fixable rejection into a flagged one.

---

## 5. Admin access — there is no password

Companio has **no passwords at all.** Sign-in is passwordless email OTP, plus Google.

1. Set `ADMIN_EMAILS=you@example.com` (comma-separated for several).
2. **Sign in normally** with that email — request an OTP like any user.
3. Visit `/admin`. The gate promotes your account to `admin` on the way through and
   persists it, so the allowlist is a bootstrap, not a permanent dependency.

Three things to know (`lib/server/admin.ts`):

- It is a **permanent root key**. Anyone who can read mail at a listed address is an
  admin. Keep it to addresses you control.
- It is **inert without `DATABASE_URL`** — no database, no admin.
- A **suspended or banned account is never admin**, whatever its role says.

---

## 6. The blocker no key fixes: there is nothing to sell

A reviewer opens the site, clicks "Find a companion", and finds an **empty
marketplace**. That reads as an inactive website — a rejection cause in its own
right, and a fair one.

**Recruit real companions before applying.** Five real, ID-checked, consenting people
with real photos, in one launch city. `/become-a-companion` → the admin approval queue
→ a live profile works end to end today; the photo pipeline blurs and strips EXIF at
ingest. The machinery is built and tested. It needs humans in it.

**One companion is not enough for a city.** With one, she is the free preview and the
pass sells nothing there. A city needs several before `PASS_SALES_ENABLED=true` means
anything.

---

## 7. Go-live checklist

- [ ] Business category = **Services** (§1.1)
- [ ] Razorpay KYC approved
- [ ] Lawyer has amended the Refund Policy, Terms and Community Guidelines (§1.3)
- [ ] `NEXTAUTH_SECRET` + `CRON_SECRET` rotated (§1.4)
- [ ] Vercel **Pro**
- [ ] Neon, Blob, Upstash, Resend connected
- [ ] Domain live; added to Vercel **and** Resend with SPF/DKIM
- [ ] `NEXT_PUBLIC_DATA_CLIENT=http`
- [ ] `ALLOW_TEST_CHECKOUT` unset, `MARKETPLACE_PAYMENTS_ENABLED` unset, `GST_ACTIVE=false`
- [ ] Webhook created, `payment.captured`, delivery log checked
- [ ] **≥5 real companions approved and live in one city**
- [ ] The five verifications in §8 all pass
- [ ] Only then: `PASS_SALES_ENABLED=true`

---

## 8. What must be verified after the keys land

Everything else is already tested — 445 unit tests, clean typecheck, clean build, and
the whole flow driven in a browser against real Neon. **These five cannot be proven
without live credentials.** Budget fifteen minutes.

1. **One real payment, end to end.** Buy the ₹199 pass with a real card, then refund it
   from the Razorpay dashboard. This is the only way to prove the live/test key split and
   HMAC signature verification. **Signature verification fails silently and closed** —
   checkout appears to work and the pass is never granted.
2. **The webhook actually arrives.** Razorpay → Webhooks → the delivery log shows a 200
   for that payment. A webhook pointed at a preview URL, or registered for the wrong
   event, produces **zero symptoms** until a customer pays and gets nothing.
3. **One real OTP email lands** in an inbox that is not yours, and not in spam.
4. **Google sign-in on the real domain** — the redirect URI must match to the character.
5. **`/admin` opens for you** and redirects a signed-out browser.

Then, before `PASS_SALES_ENABLED=true`: approve one real companion and confirm the
explore grid shows a real, ID-checked person with their own photo. **The pass is a
promise about that grid.**

---

## 9. Which documents to trust

Kept current:

- **`docs/LAUNCH.md`** — this file. The ordered path.
- [`../DEPLOY.md`](../DEPLOY.md) — the deep reference: costs, every env var, the licence boundary.
- [`PAYMENTS-ACTIVATION.md`](PAYMENTS-ACTIVATION.md) — why "5 products" is a myth, the lawyer's amendment table, provider comparison, rejection playbook.
- [`STATUS.md`](STATUS.md) — where the code is.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — the invariants, and the bug behind each one.
- [`OPERATIONS.md`](OPERATIONS.md) — running it once it is live.
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — symptom → cause → fix.
- [`SECURITY.md`](../SECURITY.md) — disclosure.

**Historical — useful for intent, wrong on specifics.** Do not follow their steps:
[`GO-LIVE.md`](GO-LIVE.md), [`LAUNCH-AUDIT.md`](LAUNCH-AUDIT.md),
[`FEATURE-AUDIT.md`](FEATURE-AUDIT.md), [`journey-spec.md`](journey-spec.md),
[`BACKEND.md`](BACKEND.md) (partly stale), [`CHAT-ROADMAP.md`](CHAT-ROADMAP.md) (not started).

---

## 10. Things that will bite you

Collected from the bugs this codebase actually had. Every one of these shipped once.

- **A green test suite proves nothing about money.** The unlock sheet quoted ₹199 while
  charging for the ₹999 tier, and every test passed. Click the real form.
- **`NEXT_PUBLIC_DATA_CLIENT=local` in production** would make the whole site a
  localStorage demo that forgets everything and takes no money.
- **A fallback that grants a paid benefit must not exist.** A `runDemoPay()` that fired
  when Razorpay was "unconfigured" once meant a 401 from a logged-out visitor granted a
  free pass.
- **The client never sends a price.** The server fixes the amount from the tier id. If you
  ever add a product, add it there — see [`ARCHITECTURE.md`](ARCHITECTURE.md#1-the-client-never-sends-a-price).
- **Do not pay companions out of money you collected** without an RBI Payment Aggregator
  licence (₹15 crore net worth). This is why credit packs and Plus were deleted rather
  than left dormant, and why `MARKETPLACE_PAYMENTS_ENABLED` is a licence boundary.
- **Two guards will fail your build on purpose.** `tests/trustClaims.test.ts` rejects
  safety claims the product cannot keep and refund promises the policy does not offer.
  If it fails, the fix is to stop making the claim — not to edit the test.
- **`grep -rn "UNLOCK_AMOUNT" components/`** — a component deriving its own price has
  bitten more than once. It should be handed one.

---

## 11. If you remember one thing

The blocker was never five products. It is five **people**, a business category that
says Services, and two policy documents that describe the product you actually built.

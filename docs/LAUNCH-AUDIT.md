# Companio — Launch Audit + ₹5,000 Plan (2026-06-25)

Senior multi-discipline review: security, correctness, UX/journey, and
best-in-class standards research. Live site run at :3003, all routes 200.

## Verdict
A beautifully crafted **demo shell with strong trust/safety instincts on top of
a well-built but DORMANT backend**. The backend security (payments, IDOR,
mass-assignment) is above typical pre-launch quality. What blocks launch is:
(1) a few real security/logic holes, (2) **honesty problems in money + legal
copy that currently render to users**, and (3) no live wiring. Most gaps are
**engineering + legal config, not money** — so ₹5,000 is enough for the infra.

---

## BLOCKERS (must fix before any real user)

| # | Issue | Evidence | Fix owner |
|---|---|---|---|
| B1 | **Free cash bookings** — `usedCredit:false` creates a confirmed meetup, `pricePaid:0`, no payment ever required | api/bookings/route.ts:75; BookingWizard.tsx:106 | ME |
| B2 | **Legal placeholders render to users** — `[[CIN]]`, `[[Grievance Officer]]` print on Privacy/Terms; DPDPA requires a real officer | lib/company.ts:15-24; privacy:61; terms:13,76 | YOU give values, ME wire |
| B3 | **No real auth** — any email+password logs in; OTP only checks 6 digits filled | LoginForm.tsx:113; StepVerify.tsx:109; auth.ts:55 | ME |
| B4 | **Feed + Lounge** — dead "social layer" still live & crawlable, shows a different fake product | Nav.tsx:19; /feed /lounge | ME (gate/remove) |
| B5 | **Money lies in copy** — "₹ held in escrow" (no escrow, renders with no number), spin wheel paints an unwinnable `plus_month` jackpot vs true 85% nothing, "Plus ₹299/mo cancel-anytime" subscription that doesn't exist | BookingWizard.tsx:124; SpinWheel.tsx:10; PlusCard.tsx:71 | ME |
| B6 | **No contact/support route** — nowhere to complain; compounds B2 | (no /contact) | ME |

## SECURITY (after blockers)
- **MED** rate-limit key = leftmost `X-Forwarded-For` → spoofable; in-memory default is per-instance on Vercel. Use platform client IP; require Upstash in prod. `rateLimit.ts:154`
- **MED** CSP is `Report-Only` + `unsafe-inline/eval` → no XSS containment. Enforce after observation. `middleware.ts:24,65`
- **LOW** inbound messages accept `from:'them'`; reports accept self/unvalidated targets; user-authored notifications stored verbatim (render as text only).
- **SOLID (verified):** server-authoritative pricing, raw-body HMAC on webhook + timing-safe compares, idempotent atomic settlement, atomic credit spend, IDOR guards on every mutation, zod on every write, admin gate re-checked in every action, secrets gitignored.

## CORRECTNESS BUGS
- **H1** spin discount burned at create-order, never released on abandonment → user loses weekly win. create-order:92.
- **H2** `settlePurchase` marks future bookings `completed` at payment → lets reviews before the meetup; payout written too early. payments.ts:65.
- **M1** `/admin` (and protected routes) **500 instead of redirect/401** when `NEXTAUTH_SECRET` unset (getServerSession throws in prod). Wrap in try/catch. admin.ts:13; session.ts:10.
- **M3** wallet credit gap on migration — decrement returns 402 if no wallet row yet; upsert the row first. bookings/route.ts:54.
- **M4** `dateISO` parsed at UTC midnight → surge/cron off by IST offset; validate `YYYY-MM-DD`. booking.ts:35.
- **L** paid booking still PATCH-cancellable with no refund/payout reversal; delete `.comp2-revert-backup/` dead dir.
- Note: the 56 `set-state-in-effect` lint warnings are the correct SSR-hydration pattern — do NOT "fix".

## THE BIG ENGINEERING TASK
`dataClient` has **0 importers**; 36 components read localStorage synchronously.
Going live = repo-wide async migration + real auth + DB sessions. Not a flag flip.

---

## What a site of THIS level needs (standards research)

**User mgmt:** lifecycle state machine; email+phone verify; **next-auth JWT→DB
sessions** (so ban/revoke works — a safety requirement); tiered KYC (companion
ID+face+background BEFORE bookable; user phone+payment); suspend≠delete+appeal;
force 2FA for companions+admins.

**Data control (DPDPA, core obligations enforceable May 2027):** named Grievance
Officer; access/correct/erase/export flows; **72h breach notification** (penalty
up to ₹200cr) → breach-log table+runbook; 3-yr retention auto-purge; column
encryption for KYC/phone/location (Aadhaar: verify-then-discard); consent-gated
analytics.

**Admin/T&S:** moderation queue (have skeleton); **atomic suspend = login block +
cancel bookings + freeze payout + refund**; immutable audit log; RBAC (support/
T&S/super-admin, not one boolean); photo moderation (Sightengine ~$29/mo);
text filter for off-platform contact; manual KYC lane; dispute workflow with
**payout hold until dispute window closes**.

**Safety (real-world meetups):** selfie verify + shield; **background check gated
before bookable** (IDfy/AuthBridge ₹200–2000/case, 3–7 days); in-app **SOS→112**;
**share-my-meetup** live location; **number masking** (Exotel ~₹1/min); check-in
timer; per-booking PIN. You have Report+SafetyAckModal — partial.

**Payments (India marketplace):** **Razorpay Route + Linked Accounts** (NOT manual
payouts — pooling funds yourself = unlicensed PA under RBI); companion PAN+bank
KYC before payout; GST TCS 0.5% + TDS 194-O 0.1% + 18% GST on commission;
refunds as Route reversals; **on-hold transfers released after meetup**.

**Ops:** **Neon Launch ($19/mo) for 7-day PITR** — the free 6h window will sink a
payments app, fix first; Sentry+PostHog (installed, add keys); BetterStack
uptime (free) + `/api/health`; Vercel Firewall (free DDoS); protect `main`.

---

## THE ₹5,000 PLAN

Reframe: the gaps are **engineering (ME, ₹0)** + **legal config (YOU fill)** +
**fixed infra (₹5k fits)** + **usage COGS (from the 30% commission, not this budget)**.

### Fixed infra — month 1 (fits ₹5,000)
| Item | Cost | Why |
|---|---|---|
| Neon Launch (7-day PITR) | ~₹1,650/mo | #1 ops fix — free 6h backup will sink a payments app |
| Vercel Pro | ~₹1,700/mo | commercial ToS + headroom + Firewall |
| Domain `.in` (1 yr) | ~₹1,000 | one-time/yr (code expects trycompanio.in) |
| MSG91 OTP credit | ~₹500 | real phone verification |
| Buffer (masking/moderation/KYC usage, low launch volume) | ~₹150 | — |
| **Month 1 total** | **~₹5,000** | ✅ |

### Steady-state (domain amortized) ≈ ₹3,750/mo + usage — comfortably under ₹5k.

### Usage-based COGS — funded by revenue, NOT the ₹5k (be honest)
- **Companion background checks ₹200–2,000 each** — the single biggest cost, and
  essential for this product. Per-companion, gated before bookable. Start with a
  small vetted pilot; fund from commission. NOT a fixed monthly line.
- eKYC ~₹3–7/verification; number masking ~₹1/min; photo moderation Sightengine
  $29/mo (or start free with AWS Rekognition first-pass).
- Razorpay ~2%/txn + Route per-transfer fee — from payments.

### Revenue context
1,000 buyers × ~₹500 × 30% ≈ **₹1.5L/mo**. Fixed infra (~₹5k) = ~3% of revenue.
Background-check COGS scales with companion count, paid from that ₹1.5L.

---

## Engineering order (ME, mostly ₹0)
1. Cheap blockers now: fill company.ts (need YOUR values), fix admin 500, CRIT free-booking, spin burn, completed-at-payment, rate-limit key, money-copy honesty, gate feed/lounge, add /contact, modal focus, mobile safety nav.
2. Big task: localStorage→dataClient migration + real auth + DB sessions.
3. Money-real: Razorpay Route + on-hold payouts + companion KYC gate.
4. Safety: SOS/112, share-meetup, number masking, check-in.
5. DPDPA: grievance, breach-log, retention purge, export/delete.
6. Admin: RBAC, audit log, atomic ban, moderation queue.

Verify gates after each: `npx tsc --noEmit` · `npx vitest run` · prod build.

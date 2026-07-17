# Payment gateway activation

Everything needed to get Companio approved by a payment gateway, why the obvious
answer is the wrong one, and what to do if Razorpay says no.

Written 2026-07-17. Prices and fees change — re-check the fee links before quoting
any number in this file back to anyone.

---

## 1. The "minimum 5 products" thing

**It does not apply to Companio.**

The rule is real, but it belongs to the **e-commerce storefront** checklist, where it
sits beside "Store Name", "Store Logo" and "Store Description". Its purpose is to stop
shell companies: a shop claiming to sell goods, with two SKUs and no catalogue, is a
laundering risk. Five live listings is the crude threshold that filters those out.

It does **not** appear in Razorpay's own activation documentation. It appears in
integrator guides aimed at people running online stores — the widely-cited one is
[Smartbiz by Amazon's KYC guide](https://help.smartbiz.in/hc/en-us/articles/22911027545617-Guide-to-completing-Payment-KYC-with-Razorpay).
Razorpay's [Account Activation Support](https://razorpay.com/docs/payments/account-activation-support/?preferred-country=IN)
page lists documents only: no product-count minimum, no website structure rules.

Companio does not sell SKUs. It sells **one digital access pass at four durations**
(`lib/money.ts` → `PASS_TIERS`). If your dashboard is showing a "5 products" checklist,
the cause is almost certainly that **the business category on the account is set to
E-commerce**. Fix the category and the checklist changes.

> **Action:** open Razorpay Dashboard → Account & Settings → Business Settings and
> check the category. Companio is a **Services** business — sub-category
> "Dating / Matrimony / Social" or "Other services", **not** "E-commerce / Marketplace".
> Get this right before re-submitting; the category drives the entire review path,
> the checklist you see, and the MDR you pay.

### Why not just add five profiles to satisfy it

Because it would be fabricating people to pass a check that does not apply.

Companio's entire product claim is that the people on it are real and vetted. Seeding
five invented humans — with invented photos, bios and payout handles — onto a platform
that says "every companion ID-checked" is misrepresentation to a payment aggregator
during KYC. Caught after approval, that is account freeze with settlement funds held,
not a warning email. It is also a re-run of a mistake this codebase already corrected:
22 seeded companions and 5 fake bookings were deliberately deleted (see
`docs/STATUS.md` and the STILL-FAKE inventory, now empty).

The catalogue a reviewer needs to see is `/pricing`. That page is real, and it works.

---

## 2. What was actually wrong, and what got fixed

| # | Problem | Status |
|---|---------|--------|
| 1 | No delivery/shipping policy page. A missing policy page is a documented rejection cause, and every gateway checks for it — including for digital goods. | **Fixed** — `app/delivery/page.tsx`, linked in the footer's Legal column. |
| 2 | `/pricing` was not reachable from the footer, so the catalogue was hard to find. | **Fixed** — `components/layout/Footer.tsx`, Explore column. |
| 3 | Grievance Officer name and phone were `[[placeholders]]`. | **Fixed** — `lib/company.ts`, from the Grievance Redressal Policy §2. |
| 4 | The site published `support@`, `privacy@` and `grievance@trycompanio.com`. No executed policy names any of them; all nine contact references say `trycompanio@gmail.com`. An unmonitored grievance inbox fails DPDPA and the gateway checklist. | **Fixed** — `lib/company.ts` now publishes the address the policies name. |
| 5 | The site promised a 7-day, no-questions-asked refund in fifteen places, backed by a real route and dashboard button. The executed Refund Policy §2 offers no cooling-off window. | **Fixed** — see §4. |
| 6 | The sign-up checkbox bound members to "Terms & Community Guidelines", the link went to `/terms`, and **the Community Guidelines were published nowhere**. The Terms make them part of the agreement, and every suspension is decided under them. A rule a member cannot read is a rule that binds nobody. | **Fixed** — `app/community-guidelines/page.tsx`, linked from the sign-up box, the footer, `/terms` and the sitemap. |
| 7 | `InfoPage` wrapped every body item in `<p>`, so a `<ul>` inside one produced invalid HTML and a React hydration error (#418) on a page that looked fine. | **Fixed** — `components/layout/InfoPage.tsx` uses `<p>` for prose and `<div>` for rich nodes. |
| 8 | Companion inventory is empty. | **Open — needs recruitment.** See §5. This is the real blocker. |

Verified: `tsc` clean, 445/445 tests pass (2 new), production build succeeds.
`scripts/crawl-links.js` reports no href pointing at a missing route, and
`scripts/error-sweep.js` reports no console error on any page beyond the expected
signed-out 401s and the Vercel analytics 404s that only occur off-Vercel. A browser
pass over 21 pages finds no surviving refund promise, no `[[placeholder]]`, and no
dead `@trycompanio.com` address in the *rendered* text; 13 InfoPage routes hydrate
without a React error; the footer prints "Grievance Officer, Prashant Yadav ·
trycompanio@gmail.com · +91 90399 56337"; the dashboard Account tab renders its four
cards with no refund control; and `/api/user/refund` returns 404 on GET and POST.

The one route that still 404s is `/companion/ananya`, hard-coded in both sweep
scripts. That is the empty-inventory problem in §5, not a broken link.

---

## 3. What is still needed from a human

Nothing in this section can be invented, generated or worked around in code.

### 3.1 Two inboxes that must actually be monitored

`trycompanio@gmail.com` is now published as the support, privacy **and** grievance
address, because that is the address the executed policies give. Two obligations
follow, and they are not optional:

- **Someone reads it.** DPDPA 2023 and the IT Rules 2021 require the Grievance Officer
  to be reachable. The Grievance Redressal Policy §4 commits to acknowledging within
  **24 hours** and resolving within **15 days**, and the Refund Policy §6 commits to
  looking into billing disputes within **7 business days**. These are published
  promises, now on the live site.
- **The phone is answered.** `+91 90399 56337` is published in the footer of every page.

If the domain mailboxes are set up later, change `COMPANY.supportEmail`,
`COMPANY.privacyEmail` and `COMPANY.grievanceOfficer.email` in `lib/company.ts` — but
re-issue the policy PDFs in the same week, because the site and the signed documents
may not disagree about where to write.

### 3.2 Name matching — the single biggest cause of KYC delay

Roughly 40% of Indian payment-gateway KYC delays are name mismatches
([source](https://creativenexus.in/blog/razorpay-kyc-process-step-by-step-guide-for-2026/)).
All of these must match **character for character**:

- `COMPANY.legalName` in `lib/company.ts` → currently `TRYCOMPANIOLABS LLP`
- The LLP incorporation certificate
- The GST certificate's trade name (if GST-registered)
- The bank account name for settlements
- The name on the website footer (rendered from `legalName`, so it follows automatically)

`Ltd.` vs `Limited`, a missing full stop, or a trade name that differs from the
registered name will each bounce the application.

### 3.3 Documents to have scanned and ready

Per [Razorpay's documents checklist](https://razorpay.com/blog/documents-required-for-payment-gateway),
for an **LLP**:

- LLP PAN card
- LLP incorporation certificate / LLP agreement
- Designated partners' PAN + Aadhaar
- Bank account proof — cancelled cheque or bank statement, name matching the LLP exactly
- GST certificate, if registered
- Address proof for the registered office

Scans must be legible. Blurry scans and expired documents are named rejection causes.

### 3.4 Environment / infrastructure

| Item | Where | Note |
|------|-------|------|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys | Test keys work before activation; live keys only appear after KYC clears. |
| `RAZORPAY_WEBHOOK_SECRET` | Dashboard → Settings → Webhooks | Point at `/api/razorpay/webhook`. Signature verification is already implemented. |
| Vercel **Pro** | vercel.com billing | Mandatory — the Hobby tier's terms forbid commercial use. Taking payments on Hobby risks the deployment, not just the account. |
| Upstash Redis | upstash.com | Rate limiting is ineffective without it. |
| Rotate `NEXTAUTH_SECRET`, `CRON_SECRET` | Vercel env vars | Previously leaked to git history. Rotate before live keys exist. |

Note the test-checkout gate: `ALLOW_TEST_CHECKOUT` **and** `PASS_SALES_ENABLED` must
both be on, and **any** Razorpay key present disables it. That is intentional — a test
path that can run in production is a free-money bug.

---

## 4. The policies vs. the product

The six executed policies were drafted from a general dating/social-app template. Most
of it fits. Four things did not, and they described features Companio does not have.

**The site was changed to match the signed documents on refunds.** The documents govern:
a page and a contract that disagree about money is a dispute nobody wins. So the 7-day
no-questions refund is gone — `app/api/user/refund/route.ts` deleted, the dashboard
button removed from `components/dashboard/AccountPanel.tsx`, and the promise stripped
from fifteen places. `tests/trustClaims.test.ts` now fails the build if it returns.

**The remaining three cannot be fixed in code, because the product genuinely does not
work the way the documents describe.** They need the lawyer to amend the text.

### Send this list to the lawyer

| Document | Clause | Says | Reality |
|----------|--------|------|---------|
| Refund Policy | **§1 Auto-renewal** | "Paid subscriptions renew automatically at the end of each billing cycle, at the current price, unless you cancel first." | **There is no auto-renewal and no billing cycle.** A pass is a single payment. No mandate is stored against any card or UPI. Nothing to cancel — a timed pass expires. Strike the clause. |
| Refund Policy | **§4 Cancelling** | "Cancel anytime from your account settings… Cancelling your subscription is as easy as subscribing." | Nothing to cancel; there is no subscription. Strike or reduce to "a pass expires on its own; there is nothing to cancel". |
| Refund Policy | **§2, §5** | "boosts or spent wallet credit"; a whole section on "Wallet and in-app credit". | **Boosts do not exist and cannot be bought. Wallet credit cannot be topped up with money** — `lib/server/pricing.ts` refuses `credits` and `plus` outright, because selling them would make Companio a payment aggregator under RBI rules. The wallet holds *included meetings*, not money. Strike the boost references; rewrite §5 to describe non-monetary meeting credits, or strike it. |
| Terms of Service | **§4 Subscriptions and pricing** | "Paid plans renew automatically unless you cancel before renewal… we will give you at least 30 days' notice before the new price applies to you." | Same as above — no renewal, no plans. `/terms` on the live site says a pass "is not a subscription. It does not renew and we never auto-debit you." Align §4 to that. |
| Terms of Service | **§2** | "subscriptions, boosts, wallet credit, or gifts purchased through the app" | Only the pass is purchasable. **Gifts do not exist.** Reduce the list to the pass. |
| Community Guidelines | **§3(k)** | "Money on Companio is only ever for platform features, such as subscriptions, boosts, or gifts bought through the app" | Same list, same problem. The published page states the rule with the one product that exists; the document should match. |

Until these are amended, do not upload those two PDFs anywhere a reviewer will read
them. They advertise recurring billing, and **recurring billing is a second, slower
approval gate**: e-mandate and subscription products need their own underwriting on top
of standard KYC, under RBI's e-mandate framework. A one-time payment product — which is
what Companio actually is — takes the fast path. Do not let a template clause volunteer
you for the slow one.

The `checklist to see before launch.docx` flags the same thing in its own words —
items 13, 14, 15 and 17 all say *"If not launching, we will have to remove all
references from the policies."* Wallet-as-money, gifts and boosts are exactly that case.

### Checklist items already satisfied

From the same document, verified in this codebase: age gate (18+), ID upload + selfie,
admin verification queue with approve/reject, verified badge shown only after approval,
reporting with reason and evidence, warn/suspend/ban, banned-user login block, account
deletion with grace period, cookie consent with reject-analytics, approximate location
only, SOS + time-limited live share, admin moderation dashboard, audit logs, HTTPS/TLS,
input validation, admin access controls, OTP delivery, support channel, and export/delete
for data requests. **Auto-renewal disclosure (items 6, 7) is not implemented and must
not be — there is no auto-renewal to disclose.**

---

## 5. The real blocker: there is nothing to sell yet

This is the part no code change fixes, and it is the reason the "add 5 people" instinct
arose in the first place.

A reviewer opens the site, clicks "Find a companion", and finds an **empty marketplace**.
That reads as an inactive website, which is a rejection cause in its own right — and it
is a *fair* one. The site genuinely has no inventory.

The honest fix is the slow one: **recruit real companions before applying.** Five real,
ID-checked, consenting people with real photos and real payout details. `/become-a-companion`
and the admin approval queue already work end-to-end; the photo pipeline blurs and strips
EXIF at ingest. The machinery is built and tested. It just needs humans in it.

Sequence that works:

1. Recruit and approve ≥5 real companions in one launch city.
2. Set the business category to **Services**, not E-commerce (§1). This is the step
   that makes the "5 products" checklist stop applying.
3. Get the Refund Policy and Terms amended (§4), so the documents you hand a reviewer
   describe the product they are looking at.
4. Submit KYC with matching names (§3.2).
5. Point the reviewer at `/pricing` as the catalogue.

Steps 2 and 3 cost nothing and can happen today. Step 1 is the long pole.

Sequence that gets the account frozen: seed fake profiles, get approved, then have a
reviewer or a customer discover the people are not real.

### Also worth auditing before a reviewer sees it

The footer claims "**Every companion ID-checked**" and the trust badges assert "ID
checked". With zero companions those are vacuously true, but they become false the
moment an unverified one is approved. Fake safety claims were removed once already
(24/7 SOS support, ID-check promises). Re-read these against reality before launch.

---

## 6. If not Razorpay

All figures are indicative standard rates for domestic cards/UPI as of mid-2026 and are
negotiable at volume. **Verify current pricing on each provider's own page** before
relying on any number here.

### The constraint that rules out most alternatives

Companio's pass model works because **Companio keeps 100% of the pass price and owes a
companion nothing** for it. See the RBI Payment Aggregator note in `lib/server/pricing.ts`.

The moment money is collected from a member and paid onward to a companion, Companio is
**aggregating** — which requires an **RBI Payment Aggregator licence** (₹15 crore net
worth, multi-year process). This is why meetup credit packs and the Plus membership were
deleted rather than left dormant, and why `lib/server/pricing.ts` refuses `credits` and
`plus` outright.

**Any gateway you pick inherits this constraint.** Switching provider does not create a
licence. If you need to pay companions from collected money, the route is a provider's
**marketplace/route/split-settlement product**, where *they* hold the PA licence and
settle on your behalf:

- Razorpay **Route**
- Cashfree **Easy Split**
- PayU **Split Settlements**

These need separate approval and stricter underwriting. Do not assume you get them.

### Provider comparison

| Provider | Standard rate | Settlement | Notes for this use case |
|----------|--------------|------------|------------------------|
| **Razorpay** | ~2% cards/UPI | T+2 | Best docs, already integrated (`lib/razorpayClient.ts`, `/api/razorpay/*`). Route exists for splits. Staying is the low-effort path. |
| **Cashfree** | ~1.75–1.95% | T+1 (faster tiers exist) | Closest substitute. Cheaper, quicker settlement. Easy Split for marketplaces. Onboarding often gentler for services. Realistic plan B. |
| **PhonePe PG** | ~0% UPI, ~2% cards | T+1 | Excellent if the traffic is UPI-heavy — which, for a ₹199 Indian consumer product, it will be. Weaker docs, smaller ecosystem. Worth pricing out. |
| **PayU** | ~2% | T+2 | Long-established, split settlements available. Onboarding is slower and more paperwork-heavy. |
| **Instamojo** | ~2–5% | T+3 | Easiest approval, worst rates. Fine to prove the model; too expensive to scale on. |
| **CCAvenue** | ~2% + setup fee | T+2–3 | Widest payment-method coverage. Dated integration, annual fees. |
| **Easebuzz** | ~1.75%+ | T+1 | Competitive, good for subscriptions. Smaller support org. |
| **Stripe India** | — | — | **Not viable.** Stripe stopped onboarding new Indian entities for domestic payments. Do not plan around it. |
| **Paytm PG** | ~1.99% | T+1 | Solid, strong wallet share. Onboarding quality is inconsistent. |

### If a rejection happens

A rejection is not a ban. In order:

1. **Read the actual reason.** It arrives by email and names a specific field. Do not guess.
2. **Fix that one thing and re-submit.** Most rejections are one document or one name mismatch.
3. **Escalate to a human.** Dashboard support, then your account manager if one exists.
   Category disputes ("we are a service, not a store") are resolved by a person, not a form.
4. **Apply to a second provider in parallel.** Applications are independent and free.
   Cashfree while Razorpay is in review costs nothing but time.

Do not open a second Razorpay account to dodge a rejection. Same PAN, same directors —
they link them, and it turns a fixable rejection into a flagged one.

---

## 7. One-line summary

The blocker was never five products. It is five **people**, a business category that
says Services, and two policy documents that describe the product you actually built.

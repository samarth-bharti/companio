# Changing things yourself

**"The lawyer said something different. The CEO changed his mind. Now what?"**

One row per answer that might come back different from what is in the code today.
Find your row, open the file, change the value, run the checks at the bottom, commit.

You do not need to understand the codebase to use this page. You need to be able to
open a file and change a line between quotes.

---

## The golden rule

**Almost every fact about the company lives in exactly one file: `lib/company.ts`.**

Change it there and it updates the footer of every page, the Terms, the Privacy
Policy, the Refund Policy, the Delivery Policy, the Community Guidelines and the
receipt emails, all at once. **Never** type a company fact anywhere else — a test will
fail you for it, and it is the reason the receipt email spent weeks giving customers a
dead address after every page had stopped.

---

## 1. Contact details and the Grievance Officer

**File: `lib/company.ts`**

| If they say… | Change this | To |
|---|---|---|
| "The Grievance Officer is someone else now" | `grievanceOfficer.name` | The new full name |
| "Use a different phone number" | `grievanceOfficer.phone` | The new number, format `'+91 90399 56337'` |
| "We have proper domain email now" | `supportEmail`, `privacyEmail`, `grievanceOfficer.email` | The new addresses |
| "The registered address is wrong" | `registeredAddress` | The address from the incorporation papers |
| "The LLPIN is wrong" | `llpin` | The correct one |
| "The legal name is different" | `legalName` | **Careful** — must match the GST certificate and bank account **exactly**. See §7. |

```ts
// lib/company.ts — this is the whole thing you need to touch
grievanceOfficer: {
  name: 'Prashant Yadav',          // ← change here
  email: 'trycompanio@gmail.com',  // ← and here
  phone: '+91 90399 56337',        // ← and here
},
```

> **If you switch to domain email** (`support@trycompanio.com` etc.), a test will fail
> on purpose. It is `tests/trustClaims.test.ts`, and it exists because those mailboxes
> were once published while nobody read them. Open it, find the rule matching
> `(support|privacy|grievance)@trycompanio\.com`, and delete that rule — but only once
> the mailboxes genuinely exist and someone is reading them. **Then re-issue the policy
> PDFs to match**, or the site and the signed documents disagree about where to write.

---

## 2. Prices and the pass tiers

**File: `lib/money.ts`**

Prices are in **paise**, not rupees. ₹199 is `19900`. Multiply rupees by 100.

```ts
export const PASS_TIERS: Record<PassTierId, PassTier> = {
  pass1m:   { id: 'pass1m',   amount: 19900,  days: 30,   label: '1 month'  },
  pass3m:   { id: 'pass3m',   amount: 49900,  days: 90,   label: '3 months' },
  pass12m:  { id: 'pass12m',  amount: 99900,  days: 365,  label: '12 months'},
  passlife: { id: 'passlife', amount: 199900, days: null, label: 'Lifetime' },
};
```

| If they say… | Do this |
|---|---|
| "Make the monthly pass ₹299" | Change `pass1m.amount` to `29900`. That is all — every page reads it. |
| "Make the 3-month pass last 100 days" | Change `pass3m.days` to `100` |
| "Add a 6-month tier" | **This one needs a developer.** Adding a tier means touching the id type, the order list and the server validation. Four numbers is safe; a new product is not. |
| "Drop the lifetime tier" | Remove it from `PASS_TIERS` **and** from `PASS_TIER_ORDER` |

**Never type a price into a page.** The server fixes the amount from the tier id and the
client never sends one — that is deliberate, and it is why a member once got quoted ₹199
while being charged for a ₹999 tier. To find anyone breaking the rule:

```bash
grep -rn "UNLOCK_AMOUNT" components/
```

`days: null` means lifetime. It is not "zero days".

---

## 3. The refund policy

Today: **a pass is non-refundable once active.** Refunds happen for non-delivery,
duplicate charges, and legal entitlement.

| If the lawyer says… | Do this |
|---|---|
| "Change the refund wording" | `app/refunds/page.tsx` — plain English, edit freely |
| "Put the 7-day refund back" | **This is a developer job, and a big one.** The button, the API route and the eligibility logic were deleted, not hidden. A test (`tests/trustClaims.test.ts`) will also fail the build on the promise until its rule is removed. Do not just re-add the sentence — a promise with no route behind it is worse than no promise. |
| "Change the refund processing time" | `app/refunds/page.tsx` — currently "5–7 business days". Must match the Refund Policy PDF §8. |
| "Change the billing response time" | `app/refunds/page.tsx` — currently "7 business days". Must match PDF §6. |

---

## 4. Policy page wording

All plain English. Edit the text between the quotes; leave the punctuation and brackets
alone.

| Document | File |
|---|---|
| Terms of Service | `app/terms/page.tsx` |
| Privacy Policy | `app/privacy/page.tsx` |
| Refund Policy | `app/refunds/page.tsx` |
| Delivery Policy | `app/delivery/page.tsx` |
| Community Guidelines | `app/community-guidelines/page.tsx` |
| Cookie Policy | `app/cookies/page.tsx` |

The shape is always the same:

```tsx
{
  heading: '1. Be real',
  body: [
    'One paragraph per entry in this list. Add another string for another paragraph.',
  ],
},
```

**If you add a new policy page**, four things must happen or it will be orphaned:

1. Create `app/your-page/page.tsx`
2. Link it in `components/layout/Footer.tsx`
3. Add it to `app/sitemap.ts`
4. Add it to `scripts/crawl-links.js` and `scripts/error-sweep.js`

Miss 3 and 4 and no check ever visits it again.

---

## 5. Turning things on and off

**These are not code. They are environment variables in Vercel → Settings →
Environment Variables.** Change them there, redeploy, done.

| If they say… | Set |
|---|---|
| "Start selling" | `PASS_SALES_ENABLED=true` — **only when real companions exist** |
| "Stop selling right now" | Delete `PASS_SALES_ENABLED`, or set it to anything but `true`. Takes effect on redeploy. |
| "Make me an admin" | Add the email to `ADMIN_EMAILS`, comma-separated. They then sign in normally — there is no password. |
| "Remove someone's admin" | Removing them from `ADMIN_EMAILS` is **not enough** — the role persists in the database once promoted. Demote them in `/admin/users`. |
| "We're GST-registered now" | `GST_ACTIVE=true` — **only when registration is real** |

**Never set these in production:**

- `ALLOW_TEST_CHECKOUT` — grants passes for free
- `MARKETPLACE_PAYMENTS_ENABLED` — arms paid meetups. This is a **licence boundary**, not
  a feature flag. Paying companions out of collected money without an RBI Payment
  Aggregator licence is the one that ends the company. Read [`../DEPLOY.md`](../DEPLOY.md) §7 first.

---

## 6. Razorpay

| If they say… | Do this |
|---|---|
| "Here are the live keys" | Vercel env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value as the first) |
| "The webhook isn't working" | Razorpay → Webhooks. URL must be `https://trycompanio.com/api/razorpay/webhook`, event must be **`payment.captured`**, and `RAZORPAY_WEBHOOK_SECRET` must match what you typed there. Check the delivery log for a 200. |
| "We're switching to Cashfree" | **Developer job.** `lib/razorpayClient.ts` and `app/api/razorpay/*` would need replacing. Provider comparison: [`PAYMENTS-ACTIVATION.md`](PAYMENTS-ACTIVATION.md) §6. |

---

## 7. The name-match trap

If the legal name changes **anywhere**, it must change **everywhere**, character for
character. Roughly 40% of Indian payment-gateway KYC delays are this one thing.

All four must be identical:

1. `COMPANY.legalName` in `lib/company.ts`
2. The LLP incorporation certificate
3. The GST trade name
4. The settlement bank account name

`Ltd.` vs `Limited`, a missing full stop, a different spacing — each one bounces it.

---

## 8. After any change, run these

```bash
npx tsc --noEmit    # must print nothing
npx vitest run      # must say 445 passed (or more)
npx next build      # must say Compiled successfully
```

If all three pass, the change is safe to commit.

```bash
git checkout main
git pull origin main
git checkout -b fix/whatever-you-changed
git add -A
git commit -m "fix: describe what changed"
git push -u origin fix/whatever-you-changed
```

Then open a pull request on GitHub.

### If a test fails

**A failing test is usually correct.** Two of them exist specifically to stop the site
promising things the product cannot keep:

- **`trustClaims.test.ts`** — fails if a page claims an ID check we do not run, promises a
  refund the policy does not offer, or publishes a dead contact address. **The fix is
  almost always to stop making the claim, not to edit the test.** Only change the test
  when the underlying fact has genuinely changed — e.g. the mailboxes now exist.
- **`money.test.ts`** — fails if prices drift between the server and the UI.

The error message names the file and the reason. Read it; it was written for this moment.

---

## 9. What you should not change alone

Get a developer for these. Each one has bitten this codebase before:

- **Adding a new pass tier or any new product** — the price must be fixed server-side
- **Re-adding the refund flow** — needs a route, not a sentence
- **Anything with `MARKETPLACE_PAYMENTS_ENABLED`** — licence boundary
- **Building auto-renewal** — needs RBI e-mandate approval, and would make Razorpay
  activation slower, not faster
- **`NEXT_PUBLIC_DATA_CLIENT`** — set it to `local` in production and the entire site
  becomes a localStorage demo that takes no money and forgets everything
- **`NEXTAUTH_SECRET`** — rotating it invalidates every live session and every unsent
  OTP. Fine today. Not fine with users.

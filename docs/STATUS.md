# Status & next steps

_Last updated: 2026-07-17, after the pass ladder + photo pipeline pass._

The single source of truth for **where the project is and what to do next**. Keep
it current — it is the first file to read when resuming.

- Deploying, keys, costs → [`../DEPLOY.md`](../DEPLOY.md)
- Why the code is shaped this way → [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Running it → [`OPERATIONS.md`](OPERATIONS.md)
- Something broken → [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)

## The one-line summary

**The product is ready. The business inputs are not.** The software does what it
says, the claims are ones it can keep, and a companion can now go from
application to a live profile with their own face without anyone touching a
database. What stands between this and a launch is a Grievance Officer with no
name, two leaked secrets, a Razorpay KYC that takes days, and **no companions**.

## Quality gates (verified 2026-07-17 by running them)

- `npx tsc --noEmit` → **0 errors**
- `npm test` → **443 passing** (32 files)
- `npm run build` → **success**
- Every public route → **200**; `/admin` → **307** signed-out
- Driven in a real browser against real Neon, not just unit-tested: the pass
  ladder at all four tiers, checkout → settle → 365 days granted, the paywall on
  a real companion, application → approve → live profile, admin search, suspend →
  audit → gone from the public API.

## What changed on 2026-07-17

The theme: **the tests were green and the product was still lying, in ways only
clicking it could reveal.**

1. **The pass replaced the one-time unlock.** ₹199/1mo, ₹499/3mo, ₹999/12mo,
   ₹1999 lifetime. Manual repurchase, no auto-debit. `nextPassExpiry()` makes
   lifetime absorbing and extends a timed pass from the later of now and its
   current expiry, so buying can never take time away.

2. **`GET /api/companions` was serving every companion's `payoutUpi`** — a UPI ID,
   which normally embeds a phone number — to anyone with `curl`, in the redacted
   payload too. `toCompanion` spread the whole Prisma row while the callers
   queried with no `select`. The serializer is an allowlist now.

3. **`firstName` survived redaction** while `name` was masked to `Ana···`. The
   mask was decoration; the client choosing to render `maskedName` was the only
   thing hiding it.

4. **The 22 fictional companions are gone** — from the code *and* the database, in
   a migration, along with the five "bookings" for meetups with people who do not
   exist (two of them marked `completed`).

5. **Photos work.** They could not before: the upload hashed the portrait and
   discarded it, `next.config.ts` allowed only `images.unsplash.com` so a real
   photo 400'd, and `blurredPhoto()` asked Unsplash to blur an image that was not
   theirs. Now `lib/server/photoStore.ts` blurs with sharp at ingest and stores
   both variants, and approval publishes the profile automatically.

6. **The unlock sheet quoted ₹199 while the ₹999 tier was selected.** Same class
   as the ₹159/₹159.20 bug that created `lib/money.ts`, five times larger.

7. **Fabricated social proof deleted.** `ActivityToast` rendered "Rohan just
   booked a Cubbon Park walk in Bengaluru" under a pulsing green dot, announced
   via `aria-live` as a live event, on the two screens where a member decides to
   spend money.

8. **Two false safety claims removed.** `/pricing` sold "24/7 SOS support — one
   tap gets a Companio safety rep on the phone" (there is no rep and no phone
   line). `/become-a-companion` told recruits members are "ID-checked" (only
   companions submit ID) — the most dangerous sentence on the site.

9. **`/api/user/unlocked` ignored expiry**, so a lapsed member's UI thought they
   were paid and never saw checkout again. The ladder could not renew.

10. **The favicon was the Next.js logo.** `app/favicon.ico` was the stock
    `create-next-app` file.

### The recurring bug classes — check these first, always

**A component importing `lib/appState` / `lib/journeyState` directly** instead of
going through `dataClient`, so nothing reaches the server in http mode:

```bash
grep -rn "from '@/lib/appState'\|from '@/lib/journeyState'" components app | grep -v "import type"
```

**A component deriving its own price** instead of being handed one:

```bash
grep -rn "UNLOCK_AMOUNT" components/
```

Both have bitten more than once.

## What is still not real

- **There are no companions.** The catalogue is empty because that is the true
  state of the business. This is the launch blocker; everything else is a
  formality beside it.
- **The Grievance Officer's name and phone are `[[placeholders]]`** in
  `lib/company.ts`. Legally required (DPDPA 2023 / IT Act). Cannot be invented.
  Nothing renders while they are unfilled, but the obligation stands.
- **`NEXTAUTH_SECRET` and `CRON_SECRET` leaked at `07c46b1`** in a public repo.
  **Rotate them.**
- **Rate limiting is decorative without Upstash.** In-memory means per-instance
  on serverless.
- **No companion is `verified`.** The column is operator-owned and true of
  nobody; the copy no longer pretends otherwise.
- **Companions are paid ₹0** for included meetups (`payoutPaise: 0`). An
  unanswered business question, not a bug.
- **8 marketing photos still hotlink Unsplash** (`activityScenes.ts`,
  `PeopleSection.tsx`). Legal under their licence; a credibility mismatch on a
  product about meeting real people. Not a blocker.
- **The sitemap reads the (empty) static list**, so real approved companions will
  not be indexed. Should read the database. Small.
- **Paid meetups need Razorpay Route** + companion KYC. Route is not self-serve —
  see [`../DEPLOY.md` §7](../DEPLOY.md#7-the-line-you-must-not-cross).

## Next, in order

1. **Merge the open PR.**
2. **Start Razorpay KYC** — it takes days, so it gates everything else.
3. **Fill the Grievance Officer details.** Legal.
4. **Rotate the two leaked secrets.**
5. **Vercel Pro** — Hobby forbids commercial use, so this is mandatory the day
   payments go live, not a scaling decision.
6. **Connect a Blob store + Upstash.**
7. **One real transaction** after the keys land. Signature verification fails
   silently and closed — see [`../DEPLOY.md` §12](../DEPLOY.md#12-what-must-be-verified-after-the-keys-land).
8. **Recruit companions.** Then, and only then, `PASS_SALES_ENABLED=true`.
   A city needs several: with one, she is the free preview and the pass sells
   nothing there.

Chat is half-designed and deliberately not started — see
[`CHAT-ROADMAP.md`](CHAT-ROADMAP.md).

# Architecture

How Companio is built, and — more usefully — **why it is built this way**. Most
of the odd-looking decisions here are scar tissue from a specific bug. Where that
is true, the bug is named, because "why is this weird?" is the question that gets
someone into trouble six months later.

Read [`STATUS.md`](STATUS.md) first for what is done. Read this before changing
anything in `lib/server/`.

---

## The stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16, App Router | Server Components by default; `'use client'` only where there is state |
| Language | TypeScript, strict | `npx tsc --noEmit` gates CI |
| UI | Tailwind v4, framer-motion | Design tokens in `app/globals.css` |
| DB | Postgres (Neon) via Prisma | `prisma/schema.prisma` is the source of truth |
| Auth | Auth.js (next-auth) v5 | Email OTP + Google. JWT sessions |
| Payments | Razorpay | Order → Checkout → verify + webhook → settle |
| Images | Vercel Blob + sharp | Portraits ingested and blurred by us |
| Tests | Vitest | 443 tests, no DB required (Prisma is mocked) |

## Directory shape

```
app/
  (routes)/           Pages. Server Components unless they need state.
  api/**/route.ts     The backend. Every route guards: session → env → rate limit → zod.
  admin/              Operator panel. Server Components + server actions, no API routes.
    actions/          The 33 mutations. Every one wrapped in adminAction().
components/           UI, grouped by feature (home, explore, booking, companion, admin…)
lib/
  money.ts            PRICES. Pure. Shared by client and server.
  data/               Static reference data (cities, areas). companions.ts is EMPTY by design.
  server/             Server-only. Never import from a client component.
  dataClient.ts       The seam: local (localStorage) vs http (real API).
prisma/
  schema.prisma       Models + the comments explaining each column's rules
  migrations/         Applied in order on production deploys only
tests/                Vitest. Mirrors lib/ and app/api/.
scripts/              Icon generation, deploy migration runner, ad-hoc probes.
```

---

## The rules that matter

These are the invariants. Breaking one is how this product hurts somebody or
loses money. Each has a test; several have a comment at the site explaining the
incident that created them.

### 1. The client never sends a price

The client names **what** it wants (`kind`, `passTier`, a discount **code** as a
string). The server reads the amount from `lib/money.ts` and writes it to the
`Purchase` row. `settlePurchase()` grants the benefit from **that row**, never
from anything the browser said.

This exists because a member was once quoted ₹159 and charged ₹159.20 — the UI
computed a discount in rupees while the server computed it in paise. And more
recently, the unlock sheet rendered a ₹199 headline while the ₹999 tier was
selected, because a child component derived its own price. **Nothing on a
checkout screen may derive a price independently.**

- Prices: `lib/money.ts` → `PASS_TIERS`
- Server: `app/api/razorpay/create-order/route.ts`
- Grant: `lib/server/payments.ts` → `settlePurchase()`
- Tests: `tests/money.test.ts`

### 2. The paywall is server-side, and fails closed

`viewerHasUnlocked()` (`lib/server/viewer.ts`) is the **single** place that
answers "has this person paid?". Every companion-serving route asks it, and
`applyPaywall()` redacts before the data leaves the server.

Three separate incidents shaped this:

- **The old paywall bounced you in a `useEffect`** after sending the whole
  profile. The network tab had everything.
- **`firstName` survived redaction** while `name` was masked to `Ana···` — so
  the mask was decoration and the client's choice of field was the only thing
  hiding it.
- **`toCompanion` spread the whole Prisma row** (`{...rest} as Companion`) while
  the callers queried with no `select`, so `GET /api/companions` served every
  companion's `payoutUpi` — a UPI ID, which normally embeds a phone number — to
  anyone with `curl`, in the *redacted* payload too.

So: **`lib/server/serialize.ts` is an allowlist.** A new column is private until
someone names it there, on purpose. A denylist against a growing table loses by
default.

- Tests: `tests/redact.test.ts`

### 3. A face we cannot destroy is a face we do not send

A pass buys the right to see a companion's photo. CSS blur withholds nothing —
the sharp bytes are in the network tab. So the blur happens **at ingest**, with
sharp, on our own storage.

`lib/server/photoStore.ts` → `renderVariants()` is pure and tested against real
image bytes, including an upscale-and-sharpen attack. `redactCompanion()` swaps
the blurred URL **into** the `photo` field, so a locked payload cannot contain
the real one. If there is no blurred variant, it serves `''` and the card paints
a placeholder.

The old approach appended `?blur=400` to an Unsplash URL and asked Unsplash to do
the destroying. That worked only while every portrait was stock imagery of a
stranger.

- Tests: `tests/photoStore.test.ts`

### 4. `unlocked` is not the same as "has a pass"

`User.unlocked` is set true by the first payment and **never set false again**.
The expiry lives in `User.unlockedUntil`, and `NULL` + `unlocked` means
**lifetime**.

So `unlocked && until > now` is wrong (it locks out every ₹1999 buyer) and
`unlocked` alone is wrong (it never expires). `passIsActive()` holds the rule;
`viewerHasUnlocked()` is the only thing that should read the pair.

This bit once: `/api/user/unlocked` returned the raw flag, so a lapsed member's
UI thought they were paid, and the one person who wanted to pay again was the one
person never shown checkout.

### 5. Money owed to a companion is a licence boundary

`lib/server/pricing.ts` refuses `booking`, `credits` and `plus` purchases unless
`MARKETPLACE_PAYMENTS_ENABLED=true`. **This is not a feature flag.**

Collecting a member's money and owing part of it to a companion is Payment
Aggregator activity under RBI rules (₹15 crore net worth to apply). A Razorpay
key does not make it legal. The legitimate route is **Razorpay Route** with
linked accounts, where Razorpay is the aggregator of record — which needs Route
enabled and KYC on every companion, and **does not exist in this codebase**.

Only `unlock` (the pass) is sellable, because Companio keeps 100% of it.

- Tests: `tests/paymentGate.test.ts`

### 6. Never claim what the code cannot do

`lib/trust.ts` holds the claims the product may make, and
**`tests/trustClaims.test.ts` fails the build if a retired claim reappears.**

The site once promised Aadhaar KYC, live selfie matching and third-party
background checks in fourteen places, including the Terms of Service. None
existed. `app/api/application/upload/route.ts` had always said so in its own
header.

Recent repeats: "24/7 SOS support — one tap gets a Companio safety rep on the
phone" (there is no rep and no phone line), and "ID-checked members" on
`/become-a-companion` (only *companions* submit ID).

**If a claim isn't true today, don't ship it.**

### 7. Settlement is idempotent

`verify` (client callback) and `webhook` (server-to-server) both fire for one
payment. `settlePurchase()` flips the Purchase to `paid` inside the transaction
**first**, so a replay returns early. The discount code's `usedCount` is
incremented *after* that anchor, so a replayed webhook cannot double-count it.

### 8. The data-client seam

`lib/dataClient.ts` switches between `local` (localStorage demo) and `http` (real
API) on `NEXT_PUBLIC_DATA_CLIENT`. **Production is `http`.**

> **The recurring bug class.** A component importing `lib/appState` or
> `lib/journeyState` **directly** instead of going through `dataClient`, so
> nothing reaches the server in http mode. Found in favourites (twice), the
> wallet (twice), notifications, and chat reactions.
>
> ```bash
> grep -rn "from '@/lib/appState'\|from '@/lib/journeyState'" components app | grep -v "import type"
> ```
>
> Anything that is not an `import type` is a bug until proven otherwise.

---

## Request lifecycle

Every API route follows the same order. Skipping a step is how a hole appears.

```
guard(async () => {           // catches, logs, returns 500 — never leaks a stack
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();          // 1. who
  if (!envValue('DATABASE_URL')) return 503;   // 2. can we even
  const rl = await rateLimit({...});           // 3. abuse
  if (!rl.ok) return json({...}, 429);
  const parsed = schema.safeParse(await readJsonBody(req));  // 4. shape
  if (!parsed.success) return badRequest(...);
  // 5. do the thing
})
```

`envValue()` (not `process.env.X`) — it treats `[[paste key]]`, `<...>`,
`changeme`, `todo`, `your_*` and `xxx` as **unset**, so a half-filled variable
fails closed instead of reaching an API with garbage. `tests/envDiscipline.test.ts`
is a tripwire against raw `process.env` for gating vars.

## The admin panel

No API routes. Server Components read with Prisma; mutations are **server
actions** in `app/admin/actions/`, each wrapped in `adminAction()`
(`lib/server/adminAction.ts`) which:

1. re-checks the admin gate **server-side** (a hidden button is not a closed door),
2. maps Prisma error codes (P2025/P2002/P2003) to readable text,
3. writes an `AdminAuditLog` row.

The gate itself (`lib/server/admin.ts`) accepts either a DB `role: admin` or an
`ADMIN_EMAILS` bootstrap match — and **suspended/banned accounts are never
admin**, regardless of the allowlist.

## Auth

Passwordless email OTP + Google. `lib/server/otp.ts` holds the invariants:

- The code is **never stored** — only `SHA-256(NEXTAUTH_SECRET:email:code)`.
  A database leak cannot be replayed into sessions.
- `randomInt` (CSPRNG), 10-minute TTL, 5 attempts, 5 sends/hour/address.
- Verification consumes with `consumedAt: null` in the WHERE clause, so two
  racing requests cannot both win.
- **In production, a missing `RESEND_API_KEY` is a hard refusal**, not a
  fallback. Outside production the code is printed on screen — with a
  belt-and-braces production re-check.

> Rotating `NEXTAUTH_SECRET` invalidates every live sign-in code and every
> session. That is fine, but do it deliberately.

## Where the money actually moves

```
UnlockSheet (tier + code as a string)
  → POST /api/razorpay/create-order      server prices it from PASS_TIERS
      writes Purchase{amount, passTier, status: created}
  → Razorpay Checkout (browser)
  → POST /api/razorpay/verify            HMAC(order|payment) with KEY_SECRET
       AND/OR
    POST /api/razorpay/webhook           HMAC(raw body) with WEBHOOK_SECRET
  → settlePurchase()                     idempotent; grants from the Purchase row
      unlock → User.unlocked + unlockedUntil (nextPassExpiry)
```

`test-checkout` is the same path without money, and **dies unconditionally the
moment `RAZORPAY_KEY_ID` exists**. That ordering matters: a test door that must
be manually locked is a test door that gets left open.

## Things that look wrong but are not

- **`lib/data/companions.ts` exports an empty array.** Deliberate. The catalogue
  is real people from real applications. Do not re-add fixtures — see the file's
  header and `tests/catalogue.test.ts`.
- **`Purchase.userId` is `SetNull`, not `Cascade`.** Erasing an account must not
  destroy the company's accounting trail; the privacy policy promises 8 years.
- **The spin wheel's wedges are equal and its odds are not.** The odds are
  published under the wheel, rendered from the same table the draw reads.
- **`suggestions`/`activities` empty on an approved companion.** The application
  form does not collect them; an operator fills them in.

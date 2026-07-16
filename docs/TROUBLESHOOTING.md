# Troubleshooting

Symptom → cause → fix. Most entries here are real bugs that have happened, not
hypotheticals.

Deeper background: [`ARCHITECTURE.md`](ARCHITECTURE.md). Running it:
[`OPERATIONS.md`](OPERATIONS.md).

---

## Payments

### "I paid and nothing happened"

Full runbook in [`OPERATIONS.md` §3](OPERATIONS.md#3-incident-i-paid-and-got-nothing).
Short version: check Razorpay → Webhooks → **delivery log**. A failed delivery is
silent on our side.

### Every payment silently fails to grant

Signature verification is wrong. Both `verify` and `webhook` **fail closed
without shouting** — by design, because the alternative is granting on an
unverified callback.

- `RAZORPAY_KEY_SECRET` must be the secret **for the key ID you are using**
  (test secret with test key, live with live).
- `RAZORPAY_WEBHOOK_SECRET` is a **different value** — the one you typed into the
  webhook form. Swapping these two is the classic mistake.

### `503 razorpay_not_configured`

`RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` is missing **or is a placeholder**.
`envValue()` reads `[[paste key]]`, `<...>`, `changeme`, `todo`, `your_*`, `xxx`
as unset. Check for a half-pasted value.

### `503 pass_sales_disabled`

`PASS_SALES_ENABLED` is not `true`. Deliberate: a pass buys access to the
companion catalogue, and there is nothing to sell until real companions exist.
Set it only when they do.

### `503 purchase_kind_disabled`

Someone tried to buy `booking`, `credits` or `plus`. These are gated behind
`MARKETPLACE_PAYMENTS_ENABLED` because they mean holding money owed to a
companion — RBI Payment Aggregator territory. **This is not a flag to flip to
make a feature work.** See [`ARCHITECTURE.md` §5](ARCHITECTURE.md#5-money-owed-to-a-companion-is-a-licence-boundary).

### `409 already_lifetime`

Correct. A lifetime holder has nothing left to buy, and `nextPassExpiry()` treats
lifetime as absorbing — charging them again would take money and grant nothing.

### The price on screen ≠ the price charged

This has happened twice. Both times a component derived its own price instead of
being handed one.

```bash
grep -rn "UNLOCK_AMOUNT" components/   # should return nothing that renders a price
```

Everything on a checkout screen takes `basePaise` from the sheet. `lib/money.ts`
is the only source. See `tests/money.test.ts` → "the quoted price is the charged
price, for every tier".

### Test checkout stopped working

Correct, if you added a Razorpay key. `testCheckoutEnabled()` returns false
**unconditionally** when `RAZORPAY_KEY_ID` exists — the key is the off switch, so
nobody has to remember to flip one.

---

## Photos

### A companion's card is blank / a broken image

1. Is there a photo at all?
   ```sql
   SELECT id, photo, "photoBlurred", suspended FROM companions WHERE id='...';
   ```
   `photo = ''` → the application had no stored portrait, so approval filed the
   profile hidden. Add one in `/admin/companions`.
2. Is the host allowed? `next/image` answers **400** for any host not in
   `next.config.ts` → `remotePatterns`. Portraits must be on our Blob store.
   A pasted URL is ingested there automatically — unless:
3. `BLOB_READ_WRITE_TOKEN` is missing, in which case admin **refuses to create
   the profile** rather than write a broken card. That is the intended failure.

### A locked card shows a placeholder instead of a blurred face

`photoBlurred` is null. Only rows that predate the photo pipeline should be like
this. Re-save the photo in `/admin/companions` — the edit path re-ingests and
re-blurs.

Never "fix" this by serving `photo` to locked viewers.

### Approving an application leaves the profile hidden

The application has no `photoUrl` — either it predates the pipeline, or the blob
store was down when they uploaded (the route saves the application anyway rather
than losing the applicant). The admin list shows `portrait: missing → stays
hidden` before you click.

---

## Auth

### Email sign-in says "temporarily unavailable"

Production with no `RESEND_API_KEY`. That is a **hard refusal on purpose** — the
alternative (printing the code on screen) would hand out sign-in codes. Outside
production, the code shows on the screen by design.

### Codes stopped working for everyone

`NEXTAUTH_SECRET` changed. It salts the OTP hash, so rotating it invalidates
every live code and every session. Expected; just do it deliberately.

### `CLIENT_FETCH_ERROR` in the console

The session callback returns `{}` rather than null when the user row is gone —
deliberate, because next-auth treats a null session response as a network error
and retries forever. If you see this, someone changed `lib/auth.ts`'s session
callback.

### Google button missing

Both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must resolve non-placeholder.
`/api/auth/capability` reports what the server thinks is configured — ask it.

### `/admin` redirects me

- Is your email in `ADMIN_EMAILS`?
- Have you **signed in once**? The bootstrap only promotes accounts that exist.
- Are you suspended/banned? Those are never admin, allowlist or not.

---

## Database

### `P3009` — migrate found failed migrations

A migration failed and blocks all later ones. Fix the SQL, confirm the failed one
truly changed nothing, then:

```bash
npx prisma migrate resolve --rolled-back <name>
npx prisma migrate deploy
```

### `Environment variable not found: DATABASE_URL` (CLI only)

The Prisma CLI reads `.env`, **not** `.env.local` — Next reads `.env.local`. Load
it explicitly; see [`OPERATIONS.md` §5](OPERATIONS.md#migrations).

### Random timeouts during migration

You are migrating through the pooled URL. Migrations need `DIRECT_URL`.

### `too many connections`

The app is on the direct URL instead of the pooled one. `DATABASE_URL` must have
`-pooler` in the host.

### Deleting a companion fails with a foreign key error

Every FK into `companions` is `RESTRICT`, on purpose: it stops you deleting
someone's booking history by accident. Delete the children first, and think about
whether you should — a booking against a *real* companion is real history.

---

## Frontend

### A change works in dev and does nothing in production

**The recurring bug class.** A component importing `lib/appState` /
`lib/journeyState` directly instead of going through `dataClient`, so it writes
to localStorage and never reaches the server in http mode.

```bash
grep -rn "from '@/lib/appState'\|from '@/lib/journeyState'" components app | grep -v "import type"
```

Anything not an `import type` is a bug until proven otherwise.

### The whole catalogue is free

You have **one companion in that city**. `freePreviewIds()` always leaves exactly
one unblurred profile per city — a wall of blur has nothing to sell — so with a
single companion, she *is* the free preview. Not a bug. Add more.

### A profile stays masked right after paying

The grid does not refetch on unlock; a reload fixes it. Known, cosmetic.

### Text clips on a phone

Check the column count before the font size. "Government ID" clipped because two
136px cards on a 360px screen left 104px of text column, and the word is 112px at
the headline's *minimum* size — it could not fit at any size the scale allows.
The fix was one column below `sm`, not a smaller font.

### The tab icon is the Next.js logo

`app/favicon.ico` is the stock file. Run `node scripts/gen-icons.mjs`.

---

## Tests / CI

### `No "envValue" export is defined on the "@/lib/env" mock`

A route you touched now calls `envValue()`, and that test's mock only exports
part of `lib/env`. Add it to the `vi.mock` factory.

### Tests pass but the product lies

The theme of this codebase. A green suite proves the code does what the code
says; it says nothing about whether the screen tells the truth.

- `tests/trustClaims.test.ts` fails the build if a retired safety claim returns.
- `tests/catalogue.test.ts` fails if fictional people come back.
- `tests/redact.test.ts` fails if a private column reaches the public payload.

If you are about to claim something on screen, ask whether a test can hold you to
it.

### The build OOMs

Known on memory-constrained machines:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=6144"; npm run build
```

### `colourspace: parameter space not set`

`sharp` and `@vercel/og` loaded in one process. They are split into
`scripts/gen-icons.mjs` and `scripts/gen-og.mjs` for exactly this reason. Do not
merge them.

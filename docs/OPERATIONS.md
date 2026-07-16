# Operations

Running Companio in production: what to do when something breaks, how to look
after the database, and when to spend money on scale.

Written to be followed at 2am by someone who did not write the code.

- Deploying and keys → [`../DEPLOY.md`](../DEPLOY.md)
- Why the code is shaped this way → [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Symptom → fix → [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)

---

## 1. The daily check (2 minutes)

| Look at | Where | Healthy |
|---|---|---|
| Site up | `https://trycompanio.com` | 200, catalogue renders |
| Errors | Sentry | no new unhandled issues |
| Payments | Razorpay Dashboard → Transactions | captured = settled (see §3) |
| Webhooks | Razorpay Dashboard → Webhooks | delivery log all 200 |
| Applications | `/admin/applications` | nothing waiting > 48h |
| Reports | `/admin/reports` | nothing `open` > 24h |
| DB | Neon Console | storage/compute inside plan |

**The one that silently loses money:** a webhook failing delivery. The member
paid, the pass never landed, and nothing on your side raises its voice. Check the
delivery log, not just the transaction list.

## 2. Incident: the site is down

1. **Vercel → Deployments.** Is the latest one failed? If so, **Promote the
   previous deployment** — that is the rollback, and it takes seconds. Do it
   first, diagnose after.
2. If the deploy is green but pages 500, check Sentry, then Vercel → Logs.
3. If it is the database (`P1001`, `P2024`, connection errors), see §5.

**Rolling back a bad deploy does not roll back its migration.** Migrations run
before the build (`scripts/migrate-on-deploy.mjs`). Every migration in this repo
is additive for exactly this reason — a rollback lands on a database with extra
nullable columns, which is harmless. **Keep it that way**: never write a
destructive migration without a plan for the promote-previous case.

## 3. Incident: "I paid and got nothing"

The most important one. Work it in this order.

1. **Razorpay Dashboard → find the payment by email/phone.** Captured?
   - Not captured → they were not charged. Nothing owed.
   - Captured → continue.
2. **Was the webhook delivered?** Dashboard → Webhooks → delivery log.
   - Non-200 → the settle never ran. Redeliver from the dashboard. It is
     idempotent; redelivering twice is safe.
3. **Check the database:**
   ```sql
   SELECT id, kind, "passTier", amount, status, "razorpayPaymentId", "invoiceNo"
   FROM purchases WHERE "razorpayOrderId" = 'order_XXX';
   ```
   - `status = 'created'` → settle never ran. Redeliver the webhook.
   - `status = 'paid'` but the member says no access → check the pass:
     ```sql
     SELECT unlocked, "unlockedUntil" FROM users WHERE email = '...';
     ```
     `unlocked = true` + `unlockedUntil` in the future (or NULL = lifetime) means
     they **do** have it and the problem is client-side (tell them to reload —
     the grid does not refetch on unlock).
4. **Signature verification failing?** Both `verify` and `webhook` fail **closed
   and silently by design** — checkout looks fine and nothing is granted. If
   *every* payment is doing this, the secret is wrong. Confirm
   `RAZORPAY_KEY_SECRET` matches the key ID's secret, and `RAZORPAY_WEBHOOK_SECRET`
   matches what you typed into the webhook form. They are different values;
   swapping them is the classic mistake.

**Never grant a pass by hand-editing `users.unlocked`.** It skips the Purchase
row, so the money exists with no record of what it bought and the invoice number
is never stamped. If you must, write the Purchase row and let
`settlePurchase()` do it.

## 4. Incident: a companion or member must be removed now

`/admin/companions` → search → **Suspend** (reversible) or **Ban** (hard).
Suspension takes them out of `/api/companions` immediately — verified: a
suspended companion vanishes from the public API on the next request.

For a member: `/admin/users` → **Suspend**, **Ban**, or **Block msgs**.

Both are audited (`AdminAuditLog`). A banned account **cannot be an admin** even
if their email is in `ADMIN_EMAILS`.

Safety report → `/admin/reports` → set status. If it involves a real-world
incident, suspend first and read afterwards.

## 5. The database

**Neon Postgres.** Two URLs, and the difference matters:

- `DATABASE_URL` — **pooled** (`-pooler` in the host). What the app uses. Serverless
  functions open a connection per invocation; without the pooler you exhaust
  Postgres' connection limit under trivial load.
- `DIRECT_URL` — **direct**. Migrations only. Running them through the pooler
  fails in ways that look like random timeouts.

### Backups

**Neon's history is not a backup you control.** Free tier keeps a short
point-in-time window (see the Console for the current retention — it has changed
more than once).

Take a real dump before anything risky, and on a schedule:

```bash
# Uses DIRECT_URL. Keep the output somewhere that is not Neon.
pg_dump "$DIRECT_URL" -Fc -f companio-$(date +%F).dump

# Restore into a fresh database:
pg_restore -d "$NEW_DIRECT_URL" --clean --if-exists companio-2026-07-17.dump
```

Do this **before every migration that is not purely additive**, and before any
manual SQL. The money tables (`purchases`, `companion_payouts`) are the ones you
cannot reconstruct.

### Migrations

- Written by hand in `prisma/migrations/<timestamp>_<name>/migration.sql`.
- Applied by `scripts/migrate-on-deploy.mjs` on **production deploys only**
  (`VERCEL_ENV=production`, or `RUN_MIGRATIONS=true`). Previews deliberately skip
  it — they used to migrate the production database.
- Locally, the Prisma CLI does **not** read `.env.local`. Load it explicitly:
  ```bash
  node -e "require('dotenv').config({path:'.env.local'});require('child_process').execSync('npx prisma migrate deploy',{stdio:'inherit',env:process.env})"
  ```

**If a migration fails halfway**, Prisma marks it failed and blocks every later
one (`P3009`). Fix the SQL, then:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma migrate deploy
```

Only mark it rolled-back if it truly changed nothing — check first. A failed
`DELETE` blocked by a foreign key changes nothing; a half-applied multi-statement
migration might not.

### Useful queries

```sql
-- Revenue, actually settled
SELECT COUNT(*), SUM(amount)/100.0 AS rupees FROM purchases WHERE status='paid';

-- Passes expiring in the next week (renewal is manual — this is your prompt list)
SELECT email, "unlockedUntil" FROM users
WHERE unlocked AND "unlockedUntil" BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Lifetime holders
SELECT COUNT(*) FROM users WHERE unlocked AND "unlockedUntil" IS NULL;

-- Companions live vs hidden
SELECT suspended, COUNT(*) FROM companions GROUP BY suspended;

-- Applications stuck waiting
SELECT name, city, "updatedAt" FROM companion_applications
WHERE status='submitted' ORDER BY "updatedAt";

-- Orphaned payments (buyer erased their account — expected, not a bug)
SELECT COUNT(*) FROM purchases WHERE "userId" IS NULL;
```

### The erasure rules

`Purchase.userId` and `CompanionPayout.bookingId` are `ON DELETE SET NULL`, not
cascade. Deleting a member severs them from their payments; it does not destroy
the payments. That is deliberate — the privacy policy promises tax records
survive ~8 years, and the cascade used to shrink the revenue figure every time
somebody left.

## 6. Scaling

In order of what actually bites, cheapest first.

### Rate limiting — do this before you have traffic

`lib/server/rateLimit.ts` falls back to an **in-memory Map** when Upstash is
absent. On Vercel that means per-instance, reset on every cold start — i.e.
effectively no limit on `/api/razorpay/create-order` (card testing) and
`/api/auth/otp` (email bombing).

Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. It is free at this
scale and it is the difference between a limiter and a decoration.

### Database connections

The pooled URL handles this. If you see `too many connections`, confirm the app
is on the `-pooler` host, not the direct one.

### Images

Portraits are ~150KB each on Vercel Blob, served through `next/image` with a
1-year `minimumCacheTTL` (`next.config.ts`) — deliberately long, because Vercel
bills image transformations. 1GB of Blob ≈ 6,000 portraits.

### The N+1 that will appear first

`/admin/bookings` and `/admin/payouts` join through relations. They are paged at
50, so they are fine. If you add a list that is not paged, it will be the first
thing to slow down — every admin list goes through `lib/server/adminList.ts`
(`ADMIN_PAGE_SIZE`, `parseQ`, `parsePage`) for this reason.

### When to leave Vercel Hobby

**Hobby forbids commercial use.** The moment you take a rupee, you need Pro.
This is a licence question, not a performance one.

## 7. Money operations

### Refunds

The 7-day promise is honoured **by hand**, on purpose:
`/api/user/refund` files a ticket; it does not move money.

1. `/admin/messages` (or wherever the ticket lands) → find the request.
2. Razorpay Dashboard → find the payment → **Refund**.
3. Remove their access:
   ```sql
   UPDATE users SET unlocked = false, "unlockedUntil" = NULL WHERE email = '...';
   ```
   (The Purchase row stays. The money happened.)

Razorpay does not refund its own fee. A refunded ₹199 costs you the ~2% either
way.

### Chargebacks

Watch the ratio. Razorpay suspends merchants over it, and a payment-aggregator
suspension pre-revenue ends the company. The refund promise exists partly so that
an unhappy member refunds instead of charging back.

### GST

`GST_ACTIVE=false` until registration is real. Setting it early stamps a tax
component onto invoices you are not registered to collect — which is worse than
not charging it. `settlePurchase()` stamps `gstPaise: 0` and a real `invoiceNo`
either way, so pre-registration receipts are correct.

## 8. Secrets

**`NEXTAUTH_SECRET` and `CRON_SECRET` were committed to a public repo at
`07c46b1`. Rotate both before launch if you have not.** Git history is public
forever; the commit being old does not help.

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 32      # CRON_SECRET
```

Rotating `NEXTAUTH_SECRET` signs everyone out and invalidates every live sign-in
code (it salts the OTP hash). Do it at a quiet hour, deliberately.

Nothing else in the repo is a secret: `envValue()` treats placeholders as unset,
and `tests/envPlaceholder.test.ts` guards the pattern list.

## 9. The cron

`vercel.json` schedules `/api/cron` at **03:00 UTC daily** (`0 3 * * *`). Vercel
injects `Authorization: Bearer <CRON_SECRET>`; the route rejects anything else.

It prunes expired OTP rows and flips past bookings to `completed` — which is what
releases reviews and final payouts, so a dead cron quietly freezes those.

If bookings stay `upcoming` forever:

1. Vercel → the project → **Cron Jobs** — is it firing? What did it return?
2. A 401 means `CRON_SECRET` in the environment does not match what Vercel is
   sending. Redeploy after changing it.
3. Cron jobs run on **Pro**, not Hobby — another reason §6's Hobby note matters.

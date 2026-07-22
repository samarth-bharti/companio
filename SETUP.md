# Companio Setup Checklist

## Current status
- Repository cloned at `/Users/apple/samarth/companio`
- `npm install` completed successfully
- `npm test` passed: 445 tests
- `npm run build` completed successfully
- `.env.example` updated to include `ADMIN_EMAILS`, `PASS_SALES_ENABLED`, and `BLOB_READ_WRITE_TOKEN`

## What still needs to be finished before public launch

### 1. External infrastructure
- Vercel project
  - Import the repo
  - Upgrade to Vercel Pro (commercial use required once payments are live)
  - Connect Vercel Blob storage for companion photos
  - Add environment variables in Vercel settings
- Neon Postgres
  - Create a Neon project
  - Copy pooled connection string into `DATABASE_URL`
  - Copy direct connection string into `DIRECT_URL`
- Payments
  - Create Razorpay account and complete business KYC
  - Generate Razorpay test/live keys
  - Create a webhook to `https://<your-domain>/api/razorpay/webhook`
  - Set `RAZORPAY_WEBHOOK_SECRET` in Vercel
- Email
  - Create a Resend account and verify the sending domain
  - Set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel
- Optional but recommended
  - Create Upstash Redis and set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
  - Monitor errors with Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`

### 2. Essential environment variables
- `DATABASE_URL` (Neon pooled)
- `DIRECT_URL` (Neon direct)
- `NEXTAUTH_SECRET` (fresh random secret)
- `NEXTAUTH_URL` (production URL, e.g. `https://trycompanio.com`)
- `NEXT_PUBLIC_SITE_URL` (same public URL)
- `NEXT_PUBLIC_DATA_CLIENT=http`
- `ADMIN_EMAILS` (comma-separated emails for admin bootstrap)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` or `RESEND_API_KEY` for auth
- `RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `BLOB_READ_WRITE_TOKEN` (injected by Vercel Blob)
- `EMAIL_FROM`
- `CRON_SECRET` (for `/api/cron`)

### 3. Launch gating flags
- `PASS_SALES_ENABLED=false` until the catalogue has real companions
- `ALLOW_TEST_CHECKOUT=false` in production
- `MARKETPLACE_PAYMENTS_ENABLED` must remain unset until RBI/Route licensing is confirmed
- `GST_ACTIVE` must remain unset until GST registration is real

### 4. Local development flow
- Copy `.env.example` to `.env.local`
- Fill local values for any envs you want to test
- Use `NEXT_PUBLIC_DATA_CLIENT=local` for demo mode without a database
- Start locally with `npm run dev`

### 5. Production readiness checks
- `npm run build` passes
- `npm test` passes
- `npm run lint` currently reports warnings and should be reviewed before final release
- A deployed site must be able to sign in and reach protected API routes
- Admin access depends on `ADMIN_EMAILS`
- Email sign-in in production requires `RESEND_API_KEY`

## Key launch notes
- `NEXTAUTH_SECRET` and `CRON_SECRET` must be freshly generated and never committed to Git
- `ADMIN_EMAILS` is required to bootstrap `/admin` on a fresh database
- `NEXT_PUBLIC_DATA_CLIENT=http` is required for production
- `BLOB_READ_WRITE_TOKEN` is required for companion photo uploads
- `PASS_SALES_ENABLED=true` should only be enabled after real companions are approved

## Recommended next actions
1. Generate fresh secrets:
   - `openssl rand -base64 32` → `NEXTAUTH_SECRET`
   - `openssl rand -hex 32` → `CRON_SECRET`
2. Create Vercel project and set environment variables
3. Connect Vercel Blob and verify `BLOB_READ_WRITE_TOKEN` is available
4. Create and seed the Neon database
5. Deploy to Vercel with `NEXT_PUBLIC_DATA_CLIENT=http` and smoke-test login
6. Once keys are ready, validate Razorpay checkout and webhook flow
7. Keep `PASS_SALES_ENABLED=false` until real companions exist

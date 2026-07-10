# Security Policy

We take the security of Companio and the safety of its users seriously.
This document explains how to report a vulnerability and summarises the
protections built into the platform.

## Reporting a vulnerability

Please report security issues privately — **do not open a public GitHub issue.**

- Email **security@trycompanio.com** with a description, steps to reproduce, and
  the impact you observed.
- Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  ("Report a vulnerability" under the Security tab) if you prefer.

We aim to acknowledge reports within **3 business days** and to provide a
remediation timeline after triage. We will credit reporters who wish to be
named once a fix has shipped. Please give us a reasonable window to fix an
issue before any public disclosure.

### In scope

- The web application and its API routes (`app/api/**`).
- Authentication, payment, and data-handling logic.

### Out of scope

- Findings that require a compromised device or physical access.
- Denial-of-service via volumetric traffic.
- Reports against third-party services we depend on (report those upstream).
- Issues in dormant, unconfigured integrations (e.g. behaviour that only
  appears once you supply your own API keys).

## Security posture

The backend is designed so that money-gated and trust-sensitive state can only
change on the server, never from the client:

- **Payment authority is server-side.** The client names *what* it buys; the
  server fixes the price from a single source of truth (`lib/server/pricing.ts`)
  and records a `Purchase` row. Benefits (credits, unlock, Plus, booking
  completion) are granted only inside `settlePurchase()` after HMAC
  verification — there are no client-callable "give me credits" endpoints.
- **Idempotent settlement.** A payment is applied exactly once, so the verify
  callback and the webhook firing for the same payment is safe.
- **Webhook signature verification** uses a constant-time compare over the raw
  request body.
- **Ownership scoping (IDOR protection).** User-scoped reads and writes are
  filtered by the session user id; cross-user access returns `404`.
- **Input validation** with zod on every write; malformed bodies return `400`.
- **Security headers + CSP** and per-bucket rate limiting are applied in
  `proxy.ts` (renamed from `middleware.ts` for Next 16). Note the CSP is
  currently sent as `Content-Security-Policy-Report-Only`.
- **Environment validation** at boot (`lib/env.ts`) fails fast on malformed
  configuration; every integration is optional and dormant until keyed.
- **Open-redirect protection** on `next` parameters (`lib/safeRedirect.ts`).
- **Privacy:** users can export and delete their data (`/api/user/export`,
  `/api/user/delete`), and analytics only fire after explicit consent (DPDP/GDPR).
- **Identity documents are never stored.** `/api/application/upload` reads the
  Aadhaar/PAN image and the selfie, checks their magic bytes, computes a SHA-256
  for duplicate detection, persists **only** that hash plus a masked number
  (`XXXX XXXX 2346`), and discards the bytes. Nothing is written to object
  storage. Holding scans of identity documents is a DPDPA liability we decline.
- **Moderation is enforced, not just recorded.** `suspended` / `bannedAt` /
  `messageBlocked` are read by `lib/server/visibility.ts` on every public
  companion read, every booking, every message send, and by the session resolver
  — a banned account is rejected on its next request, not merely flagged.
- **Marketplace payouts are gated off.** `MARKETPLACE_PAYMENTS_ENABLED` must be
  explicitly set before any purchase kind that would leave Companio holding funds
  owed to a companion can be charged (RBI Payment Aggregator rules).

### Known posture gaps

- CSP is `Content-Security-Policy-Report-Only` and permits `unsafe-inline` /
  `unsafe-eval`. It observes rather than enforces.
- Rate limiting falls back to an in-memory `Map` when Upstash is not configured.
  On a multi-instance serverless deploy each instance keeps its own counter, so
  the effective limit is multiplied by the number of warm instances. Configure
  `UPSTASH_REDIS_REST_URL` / `_TOKEN` in production.

## Supported versions

This project is pre-1.0 and under active development. Security fixes are applied
to the `main` branch.

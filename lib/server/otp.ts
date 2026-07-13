// lib/server/otp.ts
//
// Passwordless email sign-in codes. This is the real thing: the code is minted
// with a CSPRNG, stored only as a salted hash, checked on the server, consumed
// on first use, and rate-limited on both send and verify.
//
// THREE PROPERTIES THIS FILE EXISTS TO GUARANTEE
//
//  1. A database leak cannot be replayed. We persist SHA-256(secret ‖ email ‖
//     code), never the code. The secret is NEXTAUTH_SECRET, which lives in the
//     environment and not in the dump.
//
//  2. The 10-minute window cannot be brute-forced. A 6-digit code is one of a
//     million, and a million guesses is minutes of work for a script. So each
//     row counts its wrong guesses and dies at MAX_ATTEMPTS, and the caller
//     rate-limits by IP on top of that.
//
//  3. A code is worth exactly one session. `consumedAt` is set inside the same
//     transaction that reads the row, so two racing requests cannot both win.
//
// DELIVERY IS NOT VERIFICATION. When RESEND_API_KEY is absent the code still
// exists, is still hashed, and is still checked — we simply have no way to
// deliver it. Outside production we print it to the server log and tell the
// client we did, so a developer can sign in for real. In production a missing
// key is a hard failure: we will not pretend to have sent an email.

import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { envValue } from '@/lib/env';
import { sendEmail } from '@/lib/server/email';
import { otpEmail } from '@/lib/server/emailTemplates';

/** How long a code stays valid. Matches the "expires in 10 minutes" email copy. */
export const OTP_TTL_MS = 10 * 60 * 1000;

/** Wrong guesses tolerated per code before it is burned. */
export const MAX_ATTEMPTS = 5;

/** Codes a single address may request per hour. */
export const MAX_SENDS_PER_HOUR = 5;

export type SendOutcome =
  | { ok: true; delivery: 'email' }
  /**
   * Dev/staging only: the code was written to the server log, not emailed.
   *
   * `code` rides along so the sign-in screen can simply show it. That is only
   * safe because this branch is unreachable in production — an unconfigured
   * RESEND_API_KEY is refused outright there (see sendSignInCode), so there is no
   * deployment where a real user's code could be handed to whoever asked for it.
   * Without this, testing sign-in means reading the server's terminal, which
   * nobody but the person running `next dev` can do.
   */
  | { ok: true; delivery: 'console'; code: string }
  | { ok: false; reason: 'email_unconfigured' | 'too_many_requests' | 'send_failed' };

export type VerifyOutcome =
  | { ok: true }
  | { ok: false; reason: 'no_code' | 'expired' | 'too_many_attempts' | 'mismatch' };

/** Lowercase + trim, so `Sam@X.com ` and `sam@x.com` are one identity. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Salted hash of a code. The salt is NEXTAUTH_SECRET — always set wherever
 * sessions work. If it is missing the app cannot mint a session anyway, so
 * failing loudly here is better than silently hashing with an empty pepper.
 */
function hashCode(email: string, code: string): string {
  const secret = envValue('NEXTAUTH_SECRET');
  if (!secret) throw new Error('NEXTAUTH_SECRET is required to hash sign-in codes');
  return createHash('sha256').update(`${secret}:${email}:${code}`).digest('hex');
}

/** A uniformly random 6-digit code, leading zeros preserved. */
function mintCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** Constant-time compare of two hex digests of equal length. */
function hashesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

/**
 * Mint a code for `email`, invalidate any earlier live codes for that address,
 * and deliver it. Never reveals whether the address has an account — the caller
 * must return the same response either way.
 */
export async function sendSignInCode(email: string): Promise<SendOutcome> {
  const addr = normaliseEmail(email);

  // Per-address throttle, independent of the caller's IP throttle. Without this
  // one address can be mail-bombed from a botnet of distinct IPs.
  const sentLastHour = await prisma.emailOtp.count({
    where: { email: addr, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (sentLastHour >= MAX_SENDS_PER_HOUR) return { ok: false, reason: 'too_many_requests' };

  const emailConfigured = Boolean(envValue('RESEND_API_KEY'));
  if (!emailConfigured && process.env.NODE_ENV === 'production') {
    // Refusing is the honest move. The alternative — accept the request, send
    // nothing, show "check your inbox" — is precisely the theatre this file
    // replaced.
    return { ok: false, reason: 'email_unconfigured' };
  }

  const code = mintCode();
  const codeHash = hashCode(addr, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Burn older live codes: only the newest code for an address can ever work.
  await prisma.$transaction([
    prisma.emailOtp.updateMany({
      where: { email: addr, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.emailOtp.create({ data: { email: addr, codeHash, expiresAt } }),
  ]);

  if (!emailConfigured) {
    console.info(
      `\n┌─ Companio sign-in code ─────────────────────────\n` +
        `│  ${addr}\n│  ${code}   (valid ${OTP_TTL_MS / 60000} minutes)\n` +
        `│  RESEND_API_KEY is unset, so this was not emailed.\n` +
        `└─────────────────────────────────────────────────\n`,
    );
    // Belt and braces: production cannot reach here (it returns
    // email_unconfigured above), but never let a code leave the server if it
    // somehow did.
    if (process.env.NODE_ENV === 'production') return { ok: true, delivery: 'email' };
    return { ok: true, delivery: 'console', code };
  }

  const { subject, html, text } = otpEmail({ code });
  const res = await sendEmail({ to: addr, subject, html, text });
  if (!res.sent) {
    console.warn('[otp] delivery failed:', res.reason);
    return { ok: false, reason: 'send_failed' };
  }
  return { ok: true, delivery: 'email' };
}

/**
 * Check `code` against the newest live code for `email` and consume it on
 * success. Wrong guesses are counted against the row, so a caller cannot iterate
 * the keyspace; the row is dead after MAX_ATTEMPTS regardless of what the IP
 * throttle allows.
 */
export async function verifySignInCode(email: string, code: string): Promise<VerifyOutcome> {
  const addr = normaliseEmail(email);
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: 'mismatch' };

  const row = await prisma.emailOtp.findFirst({
    where: { email: addr, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return { ok: false, reason: 'no_code' };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' };

  if (!hashesMatch(row.codeHash, hashCode(addr, code))) {
    await prisma.emailOtp.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: 'mismatch' };
  }

  // Consume conditionally: `consumedAt: null` in the WHERE means the second of
  // two racing requests updates zero rows and loses.
  const claimed = await prisma.emailOtp.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count === 0) return { ok: false, reason: 'no_code' };

  return { ok: true };
}

/** Delete consumed/expired rows. Called by the cron sweep. */
export async function pruneExpiredCodes(): Promise<number> {
  const { count } = await prisma.emailOtp.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        { consumedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });
  return count;
}

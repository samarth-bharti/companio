// app/api/auth/otp/route.ts
//
// POST /api/auth/otp  { email }  → { ok: true, delivery: 'email' | 'console' }
//
// Mints and delivers a six-digit sign-in code. Verification does NOT happen
// here — the client posts the code to next-auth's `email-otp` credentials
// provider, which is the only thing that can mint a session.
//
// ACCOUNT ENUMERATION: this route never tells the caller whether an address has
// an account. It cannot, because it does not look. Sign-in and sign-up are the
// same act on a passwordless product: the code is minted for whatever address
// was typed, and the User row is upserted later, only if the code comes back.
//
// Two throttles, deliberately different:
//   • by IP    — here, cheap, stops a single host hammering the endpoint.
//   • by email — in sendSignInCode(), stops a botnet mail-bombing one inbox.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { envValue } from '@/lib/env';
import { clientKey, rateLimit } from '@/lib/server/rateLimit';
import { sendSignInCode } from '@/lib/server/otp';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const body = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(req: Request) {
  if (!envValue('DATABASE_URL') || !envValue('NEXTAUTH_SECRET')) {
    return NextResponse.json({ error: 'auth_unconfigured' }, { status: 503 });
  }

  const rl = await rateLimit({ key: clientKey(req, 'otp-send'), limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });

  const result = await sendSignInCode(parsed.data.email);

  if (!result.ok) {
    const status = result.reason === 'too_many_requests' ? 429 : 503;
    return NextResponse.json({ error: result.reason }, { status });
  }

  // `delivery` describes our configuration, not the user, so it leaks nothing.
  //
  // When it is 'console' the code rides along and the screen shows it: no email
  // is going anywhere, and the alternative is that only the person watching the
  // `next dev` terminal can sign in. sendSignInCode() refuses outright in
  // production when email is unconfigured, so this branch cannot exist on a
  // deployment where the code belongs to a real user.
  return NextResponse.json(
    result.delivery === 'console'
      ? { ok: true, delivery: 'console', code: result.code }
      : { ok: true, delivery: 'email' },
  );
}

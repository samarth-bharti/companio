// app/api/auth/capability/route.ts
//
// GET /api/auth/capability → { configured, google, emailOtp }
//
// "Which sign-in methods can this deployment actually complete?"
//
// The obvious source is next-auth's own /api/auth/providers, but it throws a
// 500 in production when NEXTAUTH_SECRET is unset — exactly the misconfiguration
// the client needs to detect. Asking it would mean a failing request (and a
// Sentry alert) on every page load of a half-configured build.
//
// So we answer it directly. The client uses this to render the sign-in methods
// that exist and to say so plainly when none do. It must never guess.
//
// Only booleans leave this route. Never the values.

import { NextResponse } from 'next/server';
import { envValue } from '@/lib/env';

export const dynamic = 'force-dynamic';

export function GET() {
  // envValue() treats a `[[fill me in]]` placeholder as absent. A half-filled
  // .env must never make the client believe real sign-in is available.
  const hasSession = !!(envValue('NEXTAUTH_SECRET') && envValue('DATABASE_URL'));

  const google = hasSession && !!(envValue('GOOGLE_CLIENT_ID') && envValue('GOOGLE_CLIENT_SECRET'));

  // Outside production a missing RESEND_API_KEY is survivable: sendSignInCode()
  // prints the code to the server log, and the code is still verified for real.
  // In production it is not: we will not offer a method whose email never sends.
  const emailOtp =
    hasSession && (!!envValue('RESEND_API_KEY') || process.env.NODE_ENV !== 'production');

  return NextResponse.json({ configured: google || emailOtp, google, emailOtp });
}

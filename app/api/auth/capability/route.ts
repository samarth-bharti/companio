// app/api/auth/capability/route.ts
//
// GET /api/auth/capability → { configured: boolean }
//
// "Can this deployment create a real server session?"
//
// The obvious source for this is next-auth's own /api/auth/providers, but it
// throws a 500 in production when NEXTAUTH_SECRET is unset — which is exactly
// the demo configuration the client needs to detect. Asking it would mean a
// failing request (and a Sentry alert) on every page load of a preview build.
//
// So we answer it directly. Three vars must all be present for a Google sign-in
// to actually complete and persist a User row:
//   • GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — the provider is registered
//   • NEXTAUTH_SECRET                          — the JWT can be signed
//   • DATABASE_URL                             — upsertUser() has somewhere to write
//
// Only booleans leave this route. Never the values.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const configured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.NEXTAUTH_SECRET &&
    process.env.DATABASE_URL
  );
  return NextResponse.json({ configured });
}

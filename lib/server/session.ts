// lib/server/session.ts
//
// Server-only helper: resolve the signed-in user's id inside an API route.
// Returns null when there is no valid session — routes turn that into a 401.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string } | undefined)?.id ?? null;
  } catch {
    // next-auth throws in production when NEXTAUTH_SECRET is unset. Degrade to
    // "signed out" (→ 401) instead of a 500, so protected routes stay inert
    // until auth is configured rather than crashing.
    return null;
  }
}

// lib/server/session.ts
//
// Server-only helper: resolve the signed-in user's id inside an API route.
// Returns null when there is no valid session — routes turn that into a 401.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isActiveUser } from '@/lib/server/visibility';

/**
 * The raw session id, with NO moderation check. Only for endpoints that must
 * still work for a suspended/banned account — currently just the DPDPA data
 * rights routes (/api/user/export, /api/user/delete), which a banned user is
 * still legally entitled to use.
 */
export async function getRawSessionUserId(): Promise<string | null> {
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

/**
 * The signed-in user's id, or null if there is no session OR the account is
 * suspended/banned. A ban that only hides a row from the admin list is not a
 * ban — it has to actually stop the account from doing things, so every
 * authenticated route resolves its caller through here.
 */
export async function getSessionUserId(): Promise<string | null> {
  const id = await getRawSessionUserId();
  if (!id) return null;
  if (!process.env.DATABASE_URL) return id; // no DB to check against

  try {
    const { prisma } = await import('@/lib/prisma');
    const u = await prisma.user.findUnique({
      where: { id },
      select: { suspended: true, bannedAt: true },
    });
    return isActiveUser(u) ? id : null;
  } catch {
    // A DB blip must not silently hand out an unauthenticated session.
    return null;
  }
}

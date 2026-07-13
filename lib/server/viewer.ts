// lib/server/viewer.ts
//
// "Has the person making this request paid for the unlock?"
//
// One answer, one place. Every route and page that serves companion data has to
// ask it, and none of them may decide it for themselves — a paywall that each
// caller re-implements is a paywall with a hole in it.

import { envValue } from '@/lib/env';
import { getSessionUserId } from '@/lib/server/session';

/**
 * True only for a signed-in member whose `unlocked` flag was set by a settled
 * payment. A guest is never unlocked; neither is a signed-in member who has not
 * paid. Any failure answers false — the paywall fails closed.
 */
export async function viewerHasUnlocked(): Promise<boolean> {
  if (!envValue('DATABASE_URL')) return false;
  try {
    const userId = await getSessionUserId();
    if (!userId) return false;
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { unlocked: true },
    });
    return !!user?.unlocked;
  } catch {
    return false;
  }
}

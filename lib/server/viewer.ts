// lib/server/viewer.ts
//
// "Has the person making this request paid for the unlock?"
//
// One answer, one place. Every route and page that serves companion data has to
// ask it, and none of them may decide it for themselves — a paywall that each
// caller re-implements is a paywall with a hole in it.

import { envValue } from '@/lib/env';
import { passIsActive } from '@/lib/money';
import { getSessionUserId } from '@/lib/server/session';

/**
 * True only for a signed-in member holding a pass that is still live: `unlocked`
 * set by a settled payment, AND not past `unlockedUntil`. A guest is never
 * unlocked; neither is a member whose pass lapsed. Any failure answers false —
 * the paywall fails closed.
 *
 * `unlockedUntil === null` on an unlocked member means lifetime, which is why
 * this cannot be a plain `unlocked && until > now` — that would lock out every
 * ₹1999 buyer. passIsActive() holds that rule.
 */
export async function viewerHasUnlocked(): Promise<boolean> {
  if (!envValue('DATABASE_URL')) return false;
  try {
    const userId = await getSessionUserId();
    if (!userId) return false;
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { unlocked: true, unlockedUntil: true },
    });
    if (!user) return false;
    return passIsActive(user.unlocked, user.unlockedUntil, new Date());
  } catch {
    return false;
  }
}

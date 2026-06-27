// lib/server/companion.ts
//
// Server-only helpers that resolve the Companion profile a logged-in account
// owns (via User.companionId) and summarise that companion's earnings. Used by
// the companion dashboard so a companion sees ONLY their own numbers.

import type { PrismaClient } from '@prisma/client';

/** The Companion profile id this user owns, or null if they aren't a companion. */
export async function getCompanionIdForUser(
  prisma: PrismaClient,
  userId: string,
): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { companionId: true } });
  return u?.companionId ?? null;
}

export interface CompanionEarnings {
  pendingPaise: number;    // owed, not yet paid out
  paidPaise: number;       // already paid out
  totalPaise: number;      // lifetime earned (pending + paid)
  upcomingBookings: number;
  completedBookings: number;
}

/** Aggregate a companion's payout + booking counts from the source-of-truth rows. */
export async function getCompanionEarnings(
  prisma: PrismaClient,
  companionId: string,
): Promise<CompanionEarnings> {
  const [pending, paid, upcoming, completed] = await Promise.all([
    prisma.companionPayout.aggregate({ where: { companionId, status: 'pending' }, _sum: { amountPaise: true } }),
    prisma.companionPayout.aggregate({ where: { companionId, status: 'paid' }, _sum: { amountPaise: true } }),
    prisma.booking.count({ where: { companionId, status: 'upcoming' } }),
    prisma.booking.count({ where: { companionId, status: 'completed' } }),
  ]);
  const pendingPaise = pending._sum.amountPaise ?? 0;
  const paidPaise = paid._sum.amountPaise ?? 0;
  return {
    pendingPaise,
    paidPaise,
    totalPaise: pendingPaise + paidPaise,
    upcomingBookings: upcoming,
    completedBookings: completed,
  };
}

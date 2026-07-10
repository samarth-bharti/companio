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

export interface CompanionMeetup {
  id: string;
  activity: string;
  dateISO: string;
  time: string;
  place: string;
  status: string;
  /** First name only — a companion never needs the member's full identity. */
  memberFirstName: string;
}

export interface CompanionProfileSummary {
  id: string;
  name: string;
  firstName: string;
  city: string;
  area: string;
  bio: string;
  activities: string[];
  photo: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  premium: boolean;
  availableNow: boolean;
  availability: string;
  payoutUpi: string | null;
  suspended: boolean;
}

export interface CompanionDashboard {
  profile: CompanionProfileSummary;
  earnings: CompanionEarnings;
  upcoming: CompanionMeetup[];
}

/**
 * Everything the companion dashboard needs, in one round trip.
 *
 * Before this existed the dashboard was hardcoded: it greeted every companion as
 * "Priya S.", listed two invented booking requests, showed a bank account ending
 * 4521 that belonged to nobody, and — worst — displayed ₹7,485 of "earnings"
 * whenever the earnings fetch failed. A real companion could read that as money
 * they were owed.
 */
export async function getCompanionDashboard(
  prisma: PrismaClient,
  companionId: string,
): Promise<CompanionDashboard | null> {
  const companion = await prisma.companion.findUnique({
    where: { id: companionId },
    select: {
      id: true, name: true, firstName: true, city: true, area: true, bio: true,
      activities: true, photo: true, hourlyRate: true, rating: true, reviewCount: true,
      verified: true, premium: true, availableNow: true, availability: true,
      payoutUpi: true, suspended: true,
    },
  });
  if (!companion) return null;

  const [earnings, bookings] = await Promise.all([
    getCompanionEarnings(prisma, companionId),
    prisma.booking.findMany({
      where: { companionId, status: 'upcoming' },
      orderBy: { dateISO: 'asc' },
      take: 20,
      select: {
        id: true, activity: true, dateISO: true, time: true, place: true, status: true,
        user: { select: { firstName: true } },
      },
    }),
  ]);

  return {
    profile: companion,
    earnings,
    upcoming: bookings.map((b) => ({
      id: b.id,
      activity: b.activity,
      dateISO: b.dateISO,
      time: b.time,
      place: b.place,
      status: b.status,
      memberFirstName: b.user.firstName,
    })),
  };
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

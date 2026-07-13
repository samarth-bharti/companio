// lib/server/booking.ts
//
// SERVER-AUTHORITATIVE booking price. Like pricing.ts, the client may name the
// companion + hours, but never the amount. This resolves the real price from:
//   • the companion's own hourly rate (clamped to the allowed band),
//   • any active admin-defined surge window for the booking date,
//   • the user's best redeemable spin-wheel discount (validated against the DB),
// then splits it into platform commission + companion payout (Plus = lower cut).
//
// Returns a full breakdown so create-order can persist it and settlePurchase can
// trust it. Spin redemption is only *quoted* here; it is marked used at settle.

import type { PrismaClient } from '@prisma/client';
import {
  clampHourly,
  applySurge,
  applyDiscount,
  splitMoney,
  MEETING_AMOUNT,
} from './pricing';

export interface BookingQuote {
  hours: number;
  hourlyRate: number;       // paise/hour actually charged
  basePaise: number;        // hourlyRate × hours, pre-surge
  surgeMultiplier: number;
  spinDiscountPct: number;
  spinResultId: string | null; // the spin row to mark used on settle, if any
  pricePaid: number;        // final, after surge + discount (paise)
  commissionPaise: number;
  payoutPaise: number;
}

/** Highest active surge multiplier covering `dateISO`, or 1 when none/invalid. */
async function surgeFor(prisma: PrismaClient, dateISO: string): Promise<number> {
  const when = new Date(dateISO);
  if (isNaN(when.getTime())) return 1;
  const s = await prisma.surgePeriod.findFirst({
    where: { active: true, startsAt: { lte: when }, endsAt: { gte: when } },
    orderBy: { multiplier: 'desc' },
    select: { multiplier: true },
  });
  return s?.multiplier ?? 1;
}

/**
 * The best (largest) unused, unexpired spin discount for this user, or null.
 *
 * Keyed on `usedAt`, not `usedBookingId`. A win is now spendable on the unlock,
 * which is not a booking — the old predicate could only ever describe a win
 * spent on a booking, and bookings cannot be bought.
 */
export async function bestSpin(
  prisma: PrismaClient,
  userId: string,
): Promise<{ id: string; discountPct: number } | null> {
  return prisma.spinResult.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() }, discountPct: { gt: 0 } },
    orderBy: { discountPct: 'desc' },
    select: { id: true, discountPct: true },
  });
}

/** Does this user hold an active Companio Plus subscription right now? */
export async function userIsPlus(prisma: PrismaClient, userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, endsAt: true },
  });
  if (!sub || sub.plan !== 'plus') return false;
  return sub.endsAt == null || sub.endsAt > new Date();
}

/**
 * Compute the trusted booking price + money split. `applySpin: false` skips
 * spin redemption (e.g. for a plain quote that shouldn't consume a win).
 */
export async function quoteBooking(
  prisma: PrismaClient,
  opts: { companionId: string; userId: string; hours: number; dateISO: string; applySpin?: boolean },
): Promise<BookingQuote> {
  const companion = await prisma.companion.findUnique({
    where: { id: opts.companionId },
    select: { hourlyRate: true, premium: true },
  });

  const hours = Math.min(Math.max(Math.round(opts.hours || 1), 1), 8);
  const hourlyRate = companion
    ? clampHourly(companion.hourlyRate, companion.premium)
    : MEETING_AMOUNT;
  const basePaise = hourlyRate * hours;

  const surgeMultiplier = await surgeFor(prisma, opts.dateISO);
  const surged = applySurge(basePaise, surgeMultiplier);

  let spinDiscountPct = 0;
  let spinResultId: string | null = null;
  if (opts.applySpin !== false) {
    const spin = await bestSpin(prisma, opts.userId);
    if (spin) {
      spinDiscountPct = spin.discountPct;
      spinResultId = spin.id;
    }
  }

  const pricePaid = applyDiscount(surged, spinDiscountPct);
  const isPlus = await userIsPlus(prisma, opts.userId);
  const { commissionPaise, payoutPaise } = splitMoney(pricePaid, isPlus);

  return {
    hours,
    hourlyRate,
    basePaise,
    surgeMultiplier,
    spinDiscountPct,
    spinResultId,
    pricePaid,
    commissionPaise,
    payoutPaise,
  };
}

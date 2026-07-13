// lib/server/spin.ts
//
// Weekly spin-wheel prize logic. PURE + server-only: the prize table and the
// draw live here so the OUTCOME IS DECIDED ON THE SERVER, never the browser.
// (CEO's original "store the result client-side" plan let anyone open devtools
// and grant themselves a win — this closes that hole.)
//
// Prizes are DISCOUNTS ONLY — no free visits — per the revised launch plan. The
// vast majority of spins win nothing; only a few users get a real discount.

import type { SpinPrize } from '@prisma/client';

export interface PrizeWeight {
  prize: SpinPrize;
  weight: number;      // relative odds (need not sum to 100)
  discountPct: number; // 0 unless this prize is a booking discount
  label: string;       // user-facing result text
}

// Tune `weight` to control how often each prize lands. Deliberately stingy:
// ~85% win nothing, so discounts stay rare and cheap. (Weights are relative —
// change these numbers any time; nothing else needs to move.)
//
// NOTE: plus_month has been removed. The SpinPrize enum entry still exists in
// the DB schema (can't be dropped without a migration) but is never drawn, so
// users are never promised something we can't deliver. Re-add it only when a
// Subscription redemption path is implemented in settlePurchase.
//
// THE SAME RULE CAUGHT THESE TWO.
//
// They used to read "10% off your next meetup". A meetup cannot be bought: v1
// meetups are paid for with an included meeting (₹0), and `booking` purchases —
// the only thing a meetup discount could apply to — are refused outright until
// there is an RBI Payment Aggregator licence. So the wheel was handing out
// discounts on a transaction that legally cannot happen. Nobody could ever spend
// one, and nobody ever noticed, because nobody had.
//
// A win now discounts the ₹199 unlock, which is the one thing Companio sells.
export const SPIN_PRIZES: PrizeWeight[] = [
  { prize: 'none',       weight: 85, discountPct: 0,  label: 'No win this week — spin again next week!' },
  { prize: 'discount10', weight: 10, discountPct: 10, label: '10% off your ₹199 unlock' },
  { prize: 'discount20', weight: 4,  discountPct: 20, label: '20% off your ₹199 unlock' },
];

export const SPIN_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // one spin per 7 days
export const SPIN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;   // a win expires in 7 days

/** Weighted draw. `rnd` is a uniform float in [0,1) (supply a CSPRNG value). */
export function drawPrize(rnd: number): PrizeWeight {
  const total = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let t = Math.min(Math.max(rnd, 0), 0.9999999) * total;
  for (const p of SPIN_PRIZES) {
    if (t < p.weight) return p;
    t -= p.weight;
  }
  return SPIN_PRIZES[0]; // unreachable; satisfies the type
}

/** True when enough time has passed since the user's last spin. */
export function canSpin(lastSpinAt: Date | null, now: Date): boolean {
  if (!lastSpinAt) return true;
  return now.getTime() - lastSpinAt.getTime() >= SPIN_COOLDOWN_MS;
}

/** When the user becomes eligible again (null = eligible now). */
export function nextSpinAt(lastSpinAt: Date | null): Date | null {
  if (!lastSpinAt) return null;
  return new Date(lastSpinAt.getTime() + SPIN_COOLDOWN_MS);
}

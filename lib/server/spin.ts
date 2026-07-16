// lib/server/spin.ts
//
// Weekly spin-wheel prize logic. PURE + server-only: the prize table and the
// draw live here so the OUTCOME IS DECIDED ON THE SERVER, never the browser.
// (CEO's original "store the result client-side" plan let anyone open devtools
// and grant themselves a win — this closes that hole.)
//
// The vast majority of spins win nothing (90%). Most wins are small discounts on
// the pass; a free visit is drawn at 0.01% — one spin in ten thousand. Every one
// of those odds is published under the wheel, which is what separates real
// scarcity from a rigged wheel.

import type { SpinPrize } from '@prisma/client';

export interface PrizeWeight {
  prize: SpinPrize;
  weight: number;      // relative odds (need not sum to 100)
  discountPct: number; // 0 unless this prize is a booking discount
  label: string;       // user-facing result text
}

// Weights are out of SPIN_WEIGHT_TOTAL (10,000), so each weight reads directly
// as its odds in basis points and the fine print under the wheel can quote them
// without a second calculation. `spinOdds()` below derives the displayed
// percentages from THIS table — the disclosed odds cannot drift from the real
// ones, because they are the same numbers.
//
// Deliberately stingy: 90% of spins win nothing. That is the point — a pass sold
// at full price is the business, and a discount that lands often is just a lower
// list price with extra steps.
//
// The odds ARE published (components/spin/SpinWheel.tsx). A prize table this
// thin is honest scarcity when disclosed and a lie when hidden, and the wheel
// animation always lands on the real server-drawn result.
//
// NOTE: plus_month has been removed. The SpinPrize enum entry still exists in
// the DB schema but is never drawn, so users are never promised something we
// can't deliver. Re-add it only when a Subscription redemption path is
// implemented in settlePurchase.
//
// THE SAME RULE — never promise what cannot be delivered — SHAPED THE REST.
//
// The discounts used to read "10% off your next meetup". A meetup cannot be
// bought: meetups are paid for with an included meeting (₹0), and `booking`
// purchases are refused outright until there is an RBI Payment Aggregator
// licence. So the wheel was handing out discounts on a transaction that legally
// cannot happen. A win now discounts the pass, which is the one thing Companio
// sells.
//
// `free_visit` grants one extra included meeting. That is deliverable for the
// same reason the pass is: in the pass-only model no companion is owed money for
// a meet, so a free visit costs Companio nothing it cannot honour.
export const SPIN_PRIZES: PrizeWeight[] = [
  { prize: 'none',       weight: 9000, discountPct: 0,  label: 'No win this week — spin again next week!' },
  { prize: 'discount5',  weight: 500,  discountPct: 5,  label: '5% off your pass' },
  { prize: 'discount10', weight: 300,  discountPct: 10, label: '10% off your pass' },
  { prize: 'discount15', weight: 150,  discountPct: 15, label: '15% off your pass' },
  { prize: 'discount20', weight: 49,   discountPct: 20, label: '20% off your pass' },
  { prize: 'free_visit', weight: 1,    discountPct: 0,  label: 'A free visit — one extra included meeting' },
];

/** Weights are defined out of this total, so weight = odds in basis points. */
export const SPIN_WEIGHT_TOTAL = 10_000;

/** The prize a `free_visit` win grants, in wallet credits. */
export const FREE_VISIT_CREDITS = 1;

/**
 * The odds, as percentages, derived from the table above for display. Small
 * odds keep two decimals ("0.01%"); the rest print bare ("5%").
 */
export function spinOdds(): { label: string; pct: string }[] {
  return SPIN_PRIZES.map((p) => {
    const pct = (p.weight * 100) / SPIN_WEIGHT_TOTAL;
    return { label: p.label, pct: Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2)}%` };
  });
}

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

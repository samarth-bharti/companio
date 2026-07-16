// lib/money.ts
//
// Money math shared by the server (which decides the price) and the UI (which
// must show that exact price and no other).
//
// This exists because they drifted. The unlock sheet computed a spin discount in
// whole rupees — `Math.round(199 * 80 / 100)` = ₹159 — while the server computed
// it in paise — `Math.round(19900 * 80 / 100)` = 15920 = ₹159.20. The member was
// shown one number and charged another. Twenty paise is nothing; being able to
// quote a price you do not charge is not nothing.
//
// Everything here is paise, and pure. lib/server/pricing.ts re-exports these so
// there is exactly one implementation.

// ── The pass ────────────────────────────────────────────────────────────────
//
// Companio sells ONE thing: a pass that lifts the paywall on companion photos
// and contact details. The tiers differ only in how long that lasts. Companio
// keeps 100% of it and owes a companion nothing, which is the entire reason it
// can be sold at all — see the RBI Payment Aggregator note in
// lib/server/pricing.ts before adding anything else to this file.
//
// `days: null` means lifetime. Prices are paise.

export interface PassTier {
  id: PassTierId;
  amount: number;
  days: number | null;
  label: string;
}

export type PassTierId = 'pass1m' | 'pass3m' | 'pass12m' | 'passlife';

export const PASS_TIERS: Record<PassTierId, PassTier> = {
  pass1m: { id: 'pass1m', amount: 19900, days: 30, label: '1 month' },
  pass3m: { id: 'pass3m', amount: 49900, days: 90, label: '3 months' },
  pass12m: { id: 'pass12m', amount: 99900, days: 365, label: '12 months' },
  passlife: { id: 'passlife', amount: 199900, days: null, label: 'Lifetime' },
};

export const PASS_TIER_ORDER: readonly PassTierId[] = ['pass1m', 'pass3m', 'pass12m', 'passlife'];

export function isPassTierId(v: string | undefined): v is PassTierId {
  return !!v && Object.prototype.hasOwnProperty.call(PASS_TIERS, v);
}

/**
 * Effective cost per month, in paise — used to show honest per-month framing on
 * the pricing page. Lifetime has no per-month figure; it returns null rather
 * than an invented denominator.
 */
export function perMonthPaise(tier: PassTier): number | null {
  if (tier.days === null) return null;
  return Math.round(tier.amount / (tier.days / 30));
}

/**
 * The ₹199 entry price, in paise. Kept as a named export because it is the
 * cheapest tier and a lot of copy and tests refer to "the ₹199 unlock".
 */
export const UNLOCK_AMOUNT = PASS_TIERS.pass1m.amount;

// ── Commission split ─────────────────────────────────────────────────────────
// These live HERE, not in lib/server/pricing.ts, for the same reason everything
// else in this file does: the home page's "Transparency" section printed a split
// of 85/15 — headline, animated bar, counters and screen-reader label, all
// hard-coded — while the server took 30%. The one section of the site whose
// entire subject is not lying about money was the section lying about money.
// Basis points (1% = 100 bps) avoid floating-point drift.

/** Platform's cut of a booking, in basis points. */
export const COMMISSION_STD_BPS = 3000;  // 30% — standard members
export const COMMISSION_PLUS_BPS = 1000; // 10% — Companio Plus members

/** The companion's share, as a whole percentage. Derived — never typed twice. */
export const COMPANION_SHARE_PCT = (100 * (10_000 - COMMISSION_STD_BPS)) / 10_000;      // 70
export const COMPANION_SHARE_PLUS_PCT = (100 * (10_000 - COMMISSION_PLUS_BPS)) / 10_000; // 90
export const PLATFORM_SHARE_PCT = 100 - COMPANION_SHARE_PCT;                             // 30

// ── Pass expiry ─────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The new expiry after buying `tier`, given the pass the user already holds.
 *
 * `current` is their existing expiry: a Date, or null. Null is ambiguous on its
 * own — it means "lifetime" for someone already unlocked and "never had one" for
 * everyone else — so `hasLifetime` disambiguates rather than letting the caller
 * guess.
 *
 * Two rules, both of which exist to make sure buying can never take time away:
 *   - Lifetime is absorbing. Once held, no timed purchase downgrades it.
 *   - A timed pass extends from the LATER of now and the current expiry, so
 *     renewing early adds to what is left instead of truncating it.
 */
export function nextPassExpiry(
  tier: PassTier,
  opts: { now: Date; current: Date | null; hasLifetime: boolean },
): Date | null {
  if (opts.hasLifetime) return null;
  if (tier.days === null) return null;
  const base =
    opts.current && opts.current.getTime() > opts.now.getTime() ? opts.current : opts.now;
  return new Date(base.getTime() + tier.days * DAY_MS);
}

/** True when a pass is currently active. `until === null` + unlocked = lifetime. */
export function passIsActive(unlocked: boolean, until: Date | null, now: Date): boolean {
  if (!unlocked) return false;
  if (until === null) return true;
  return until.getTime() > now.getTime();
}

/** Subtract a 0–100% discount from an amount (clamped, never negative). */
export function applyDiscount(amountPaise: number, pct: number): number {
  const p = Math.min(Math.max(Math.round(pct), 0), 100);
  return Math.round((amountPaise * (100 - p)) / 100);
}

/**
 * Paise → a rupee string a member can be charged.
 *
 * Whole rupees print bare ("₹199"); anything else keeps both decimal places
 * ("₹159.20"), because that is the amount that will actually leave their account.
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? `₹${rupees}` : `₹${rupees.toFixed(2)}`;
}

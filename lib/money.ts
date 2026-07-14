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

/** ₹199 one-time full unlock, in paise. */
export const UNLOCK_AMOUNT = 19900;

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

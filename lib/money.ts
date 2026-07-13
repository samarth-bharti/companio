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

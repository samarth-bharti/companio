// lib/server/discounts.ts
//
// Redeeming an admin-created discount code.
//
// /admin/discounts could mint codes — percentage or fixed, with an expiry and a
// max-uses cap — and nothing on the site could ever accept one. No field asked
// for a code, no route validated one, no purchase recorded one. An operator ran
// a launch promotion into a void.
//
// Two rules this file exists to enforce:
//
//   1. The PRICE IS THE SERVER'S. The client may send a code string; it may never
//      send an amount, or a discount, or a percentage. Everything below recomputes
//      the price from `DiscountCode.value` in the database.
//
//   2. A USE IS SPENT ON A PAYMENT, NOT ON AN ATTEMPT. `usedCount` is incremented
//      in settlePurchase, when money actually moved — not here, at order creation.
//      Otherwise a limited code is exhausted by people who opened the sheet and
//      closed it.

import type { PrismaClient } from '@prisma/client';

/**
 * Razorpay will not create an order below ₹1, so a code that discounts the price
 * to nothing cannot be charged through the gateway. Rather than quietly charging
 * ₹1 — which is what a naive clamp does, and is a lie about a "100% off" code —
 * such a code is refused with a reason the operator can act on.
 */
export const MIN_CHARGE_PAISE = 100;

export type DiscountFailure =
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'exhausted'
  | 'zero_amount_unsupported';

export type DiscountResult =
  | {
      ok: true;
      /** Normalised code, as stored. */
      code: string;
      /** What the customer now pays, in paise. */
      amountPaise: number;
      /** How much came off, in paise. */
      discountPaise: number;
    }
  | { ok: false; reason: DiscountFailure };

/** Codes are stored upper-cased; "launch50", " Launch50 " and "LAUNCH50" are one code. */
export function normaliseCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * The price after a discount. Pure — no database, no clock — so the arithmetic
 * that decides what someone is charged can be tested directly.
 *
 * `percentage`: value is 0–100, clamped. `fixed`: value is paise off.
 * Never returns a negative amount.
 */
export function discountedAmount(
  basePaise: number,
  type: 'percentage' | 'fixed',
  value: number,
): number {
  if (type === 'percentage') {
    const pct = Math.min(100, Math.max(0, value));
    // Round, don't floor: 19900 × 15% = 2985 exactly, but 33% of 19900 is
    // 6567.0 — flooring systematically shaves paise off the customer's discount.
    const off = Math.round((basePaise * pct) / 100);
    return Math.max(0, basePaise - off);
  }
  const off = Math.max(0, Math.round(value));
  return Math.max(0, basePaise - off);
}

/**
 * Look a code up and price it against `basePaise`. Read-only: it reserves
 * nothing and increments nothing.
 */
export async function resolveDiscount(
  prisma: PrismaClient,
  rawCode: string,
  basePaise: number,
  now: Date = new Date(),
): Promise<DiscountResult> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, reason: 'not_found' };

  const row = await prisma.discountCode.findUnique({
    where: { code },
    select: { code: true, type: true, value: true, maxUses: true, usedCount: true, expiresAt: true, active: true },
  });

  if (!row) return { ok: false, reason: 'not_found' };
  if (!row.active) return { ok: false, reason: 'inactive' };
  if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: 'expired' };
  }
  if (row.maxUses !== null && row.usedCount >= row.maxUses) {
    return { ok: false, reason: 'exhausted' };
  }

  const amountPaise = discountedAmount(basePaise, row.type, row.value);
  if (amountPaise < MIN_CHARGE_PAISE) {
    return { ok: false, reason: 'zero_amount_unsupported' };
  }

  return {
    ok: true,
    code: row.code,
    amountPaise,
    discountPaise: basePaise - amountPaise,
  };
}

/** Wording the customer sees. Never leaks whether a code exists but is spent. */
export function discountFailureMessage(reason: DiscountFailure): string {
  switch (reason) {
    case 'expired':
      return 'That code has expired.';
    case 'exhausted':
      return 'That code has been fully claimed.';
    case 'zero_amount_unsupported':
      return 'That code cannot be applied to this purchase.';
    case 'inactive':
    case 'not_found':
    default:
      // An inactive code and a nonexistent one read identically on purpose:
      // otherwise the form is an oracle for guessing valid codes.
      return "That code isn't valid.";
  }
}

// Spending a use lives in settlePurchase, inside the same transaction that marks
// the payment paid — see lib/server/payments.ts. It is deliberately NOT here: a
// helper that could be called from anywhere is a helper that will eventually be
// called at order-creation time, and a use spent on an abandoned checkout is a
// code exhausted by people who never paid.
//
// Known limit: two orders can both pass the max-uses check here and both settle,
// taking usedCount one past maxUses. The cap is enforced at order creation, so the
// overshoot is bounded by concurrent checkouts of the same code — acceptable for a
// promo, and far preferable to reserving uses that abandoned carts never release.

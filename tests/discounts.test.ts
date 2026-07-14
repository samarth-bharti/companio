import { describe, it, expect } from 'vitest';
import {
  discountedAmount,
  normaliseCode,
  discountFailureMessage,
  MIN_CHARGE_PAISE,
} from '@/lib/server/discounts';
import { UNLOCK_AMOUNT } from '@/lib/money';

/**
 * The end-to-end charge cannot be exercised without Razorpay keys
 * (/api/razorpay/create-order answers 503 without them), so the arithmetic that
 * decides what a customer pays is pinned here instead.
 */

describe('normaliseCode', () => {
  it('upper-cases and trims, so " launch50 " and "LAUNCH50" are one code', () => {
    expect(normaliseCode(' launch50 ')).toBe('LAUNCH50');
    expect(normaliseCode('LAUNCH50')).toBe('LAUNCH50');
  });
});

describe('discountedAmount — percentage', () => {
  it('takes 10% off the ₹199 unlock', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'percentage', 10)).toBe(17910); // ₹179.10
  });

  it('rounds rather than floors, so the customer is not shaved paise', () => {
    // 33% of 19900 = 6567 exactly; 15% = 2985. Use a value that would truncate.
    expect(discountedAmount(19900, 'percentage', 33)).toBe(19900 - 6567);
    expect(discountedAmount(999, 'percentage', 33)).toBe(999 - Math.round(999 * 0.33));
  });

  it('clamps a percentage above 100 instead of producing a negative price', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'percentage', 150)).toBe(0);
  });

  it('clamps a negative percentage to zero — a discount can never add to the bill', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'percentage', -20)).toBe(UNLOCK_AMOUNT);
  });

  it('0% leaves the price untouched', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'percentage', 0)).toBe(UNLOCK_AMOUNT);
  });
});

describe('discountedAmount — fixed', () => {
  it('takes a flat ₹50 off', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'fixed', 5000)).toBe(14900);
  });

  it('never goes below zero when the code is worth more than the item', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'fixed', 50000)).toBe(0);
  });

  it('ignores a negative fixed value', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'fixed', -5000)).toBe(UNLOCK_AMOUNT);
  });
});

describe('the zero-amount rule', () => {
  it('a 100% code prices to zero, which is below the gateway minimum', () => {
    const amount = discountedAmount(UNLOCK_AMOUNT, 'percentage', 100);
    expect(amount).toBe(0);
    // resolveDiscount turns this into { ok: false, reason: 'zero_amount_unsupported' }
    // rather than silently charging ₹1, which is what a naive clamp would do.
    expect(amount).toBeLessThan(MIN_CHARGE_PAISE);
  });

  it('a code that leaves exactly ₹1 is still chargeable', () => {
    expect(discountedAmount(UNLOCK_AMOUNT, 'fixed', UNLOCK_AMOUNT - 100)).toBe(MIN_CHARGE_PAISE);
  });
});

describe('discountFailureMessage', () => {
  it('does not reveal whether an invalid code exists but is inactive', () => {
    // Otherwise the field is an oracle for guessing real codes.
    expect(discountFailureMessage('not_found')).toBe(discountFailureMessage('inactive'));
  });

  it('is specific where being specific is safe', () => {
    expect(discountFailureMessage('expired')).toMatch(/expired/i);
    expect(discountFailureMessage('exhausted')).toMatch(/claimed/i);
  });
});

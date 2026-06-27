import { describe, it, expect } from 'vitest';
import {
  splitMoney,
  applyDiscount,
  applySurge,
  clampHourly,
  gstComponent,
  HOURLY_MIN,
  HOURLY_MAX,
  HOURLY_MAX_PREMIUM,
} from '@/lib/server/pricing';

describe('splitMoney (commission)', () => {
  it('takes 30% from a standard user', () => {
    expect(splitMoney(100000, false)).toEqual({ pricePaid: 100000, commissionPaise: 30000, payoutPaise: 70000 });
  });
  it('takes only 10% from a Plus user', () => {
    expect(splitMoney(100000, true)).toEqual({ pricePaid: 100000, commissionPaise: 10000, payoutPaise: 90000 });
  });
  it('never loses a paisa (commission + payout == price)', () => {
    const s = splitMoney(49999, false);
    expect(s.commissionPaise + s.payoutPaise).toBe(49999);
  });
});

describe('applyDiscount', () => {
  it('applies a 20% discount', () => expect(applyDiscount(100000, 20)).toBe(80000));
  it('clamps out-of-range pct', () => {
    expect(applyDiscount(100000, 150)).toBe(0);
    expect(applyDiscount(100000, -5)).toBe(100000);
  });
});

describe('applySurge', () => {
  it('multiplies by the surge factor', () => expect(applySurge(100000, 1.5)).toBe(150000));
  it('ignores invalid multipliers', () => {
    expect(applySurge(100000, 0)).toBe(100000);
    expect(applySurge(100000, NaN)).toBe(100000);
  });
});

describe('clampHourly', () => {
  it('clamps below the floor', () => expect(clampHourly(1000)).toBe(HOURLY_MIN));
  it('clamps above the standard ceiling', () => expect(clampHourly(500000)).toBe(HOURLY_MAX));
  it('allows the premium ceiling for premium companions', () => expect(clampHourly(500000, true)).toBe(HOURLY_MAX_PREMIUM));
});

describe('gstComponent', () => {
  it('extracts the 18% GST embedded in a gross amount', () => {
    // ₹1,180 gross = ₹1,000 net + ₹180 GST
    expect(gstComponent(118000)).toBe(18000);
  });
});

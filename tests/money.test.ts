import { describe, it, expect } from 'vitest';
import {
  splitMoney,
  applyDiscount,
  applySurge,
  clampHourly,
  gstComponent,
  UNLOCK_AMOUNT,
  HOURLY_MIN,
  HOURLY_MAX,
  HOURLY_MAX_PREMIUM,
} from '@/lib/server/pricing';
import {
  PASS_TIERS,
  PASS_TIER_ORDER,
  isPassTierId,
  perMonthPaise,
  nextPassExpiry,
  passIsActive,
} from '@/lib/money';
import {
  UNLOCK_AMOUNT as SHARED_UNLOCK,
  applyDiscount as sharedDiscount,
  formatPaise,
} from '@/lib/money';

// The UI must quote the exact amount the server will bill. It did not: the
// unlock sheet discounted in whole rupees (₹199 → ₹159) while the server
// discounted in paise (19900 → 15920 = ₹159.20), so a member with a 20% spin win
// was offered one price and charged another. Both now import the same functions.
describe('the price shown is the price charged', () => {
  it('shares one implementation with the server', () => {
    expect(SHARED_UNLOCK).toBe(UNLOCK_AMOUNT);
    expect(sharedDiscount(UNLOCK_AMOUNT, 20)).toBe(applyDiscount(UNLOCK_AMOUNT, 20));
  });

  it('quotes a discounted unlock to the paise', () => {
    expect(applyDiscount(UNLOCK_AMOUNT, 20)).toBe(15920);
    expect(formatPaise(applyDiscount(UNLOCK_AMOUNT, 20))).toBe('₹159.20');
    expect(formatPaise(applyDiscount(UNLOCK_AMOUNT, 10))).toBe('₹179.10');
  });

  it('prints whole rupees bare', () => {
    expect(formatPaise(UNLOCK_AMOUNT)).toBe('₹199');
  });
});

describe('splitMoney (commission)', () => {
  it('takes 12% from a standard user', () => {
    expect(splitMoney(100000, false)).toEqual({ pricePaid: 100000, commissionPaise: 12000, payoutPaise: 88000 });
  });
  it('takes only 8% from a Plus user', () => {
    expect(splitMoney(100000, true)).toEqual({ pricePaid: 100000, commissionPaise: 8000, payoutPaise: 92000 });
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

// ── The pass ────────────────────────────────────────────────────────────────

describe('PASS_TIERS', () => {
  it('prices the ladder in paise', () => {
    expect(PASS_TIERS.pass1m.amount).toBe(19900);
    expect(PASS_TIERS.pass3m.amount).toBe(49900);
    expect(PASS_TIERS.pass12m.amount).toBe(99900);
    expect(PASS_TIERS.passlife.amount).toBe(199900);
  });
  it('keeps UNLOCK_AMOUNT as the entry tier, so old copy and callers stay true', () => {
    expect(UNLOCK_AMOUNT).toBe(PASS_TIERS.pass1m.amount);
  });
  it('marks lifetime with a null duration, not a big number', () => {
    expect(PASS_TIERS.passlife.days).toBeNull();
  });
  it('accepts only real tier ids', () => {
    expect(isPassTierId('pass3m')).toBe(true);
    expect(isPassTierId('pass2m')).toBe(false);
    expect(isPassTierId(undefined)).toBe(false);
  });
  it('gets cheaper per month as the term grows — the ladder has to be honest', () => {
    const m1 = perMonthPaise(PASS_TIERS.pass1m)!;
    const m3 = perMonthPaise(PASS_TIERS.pass3m)!;
    const m12 = perMonthPaise(PASS_TIERS.pass12m)!;
    expect(m3).toBeLessThan(m1);
    expect(m12).toBeLessThan(m3);
  });
  it('has no per-month figure for lifetime rather than an invented one', () => {
    expect(perMonthPaise(PASS_TIERS.passlife)).toBeNull();
  });
});

describe('nextPassExpiry', () => {
  const now = new Date('2026-07-17T00:00:00Z');
  const DAY = 86_400_000;

  it('dates a first pass from today', () => {
    const until = nextPassExpiry(PASS_TIERS.pass1m, { now, current: null, hasLifetime: false });
    expect(until!.getTime()).toBe(now.getTime() + 30 * DAY);
  });
  it('extends from the existing expiry when the pass is still live', () => {
    const current = new Date(now.getTime() + 10 * DAY);
    const until = nextPassExpiry(PASS_TIERS.pass1m, { now, current, hasLifetime: false });
    expect(until!.getTime()).toBe(current.getTime() + 30 * DAY);
  });
  it('dates from today when the old pass has already lapsed', () => {
    const current = new Date(now.getTime() - 10 * DAY);
    const until = nextPassExpiry(PASS_TIERS.pass1m, { now, current, hasLifetime: false });
    expect(until!.getTime()).toBe(now.getTime() + 30 * DAY);
  });
  it('returns null for a lifetime purchase', () => {
    expect(nextPassExpiry(PASS_TIERS.passlife, { now, current: null, hasLifetime: false })).toBeNull();
  });
  it('never downgrades a lifetime holder to a dated pass', () => {
    expect(nextPassExpiry(PASS_TIERS.pass1m, { now, current: null, hasLifetime: true })).toBeNull();
  });
});

describe('passIsActive', () => {
  const now = new Date('2026-07-17T00:00:00Z');
  it('is false for someone who never paid', () => expect(passIsActive(false, null, now)).toBe(false));
  it('is false for an unpaid user even with a future date somehow set', () => {
    expect(passIsActive(false, new Date(now.getTime() + 86_400_000), now)).toBe(false);
  });
  // The whole reason viewerHasUnlocked can't be a plain `until > now`.
  it('is true for a lifetime holder (unlocked, null expiry)', () => {
    expect(passIsActive(true, null, now)).toBe(true);
  });
  it('is true while the pass is live', () => {
    expect(passIsActive(true, new Date(now.getTime() + 1000), now)).toBe(true);
  });
  it('is false once the pass has lapsed', () => {
    expect(passIsActive(true, new Date(now.getTime() - 1000), now)).toBe(false);
  });
});

// ── The screen and the server must agree, per tier ───────────────────────────
//
// The unlock sheet showed a ₹199 headline while the radio said "12 months" and
// the button charged ₹999, because UnlockBenefits derived its own price from
// UNLOCK_AMOUNT (the entry tier) instead of the selected one. lib/money.ts exists
// because a member was once quoted ₹159 and charged ₹159.20; this was the same
// bug, five times larger. These pin the arithmetic both sides now share.
describe('the quoted price is the charged price, for every tier', () => {
  it('quotes each tier at its own amount, not the entry tier', () => {
    for (const id of PASS_TIER_ORDER) {
      const quoted = formatPaise(applyDiscount(PASS_TIERS[id].amount, 0));
      expect(quoted, `${id} quoted as the entry tier`).toBe(formatPaise(PASS_TIERS[id].amount));
    }
    // The specific regression: the 12-month tier must never render as ₹199.
    expect(formatPaise(PASS_TIERS.pass12m.amount)).toBe('₹999');
    expect(formatPaise(PASS_TIERS.pass12m.amount)).not.toBe(formatPaise(UNLOCK_AMOUNT));
  });

  it('applies a spin discount to the SELECTED tier, in paise', () => {
    // 10% off the ₹1999 lifetime is ₹1799.10 — the sheet must print the paise,
    // because that is what leaves the account.
    expect(formatPaise(applyDiscount(PASS_TIERS.passlife.amount, 10))).toBe('₹1799.10');
    expect(formatPaise(applyDiscount(PASS_TIERS.pass1m.amount, 20))).toBe('₹159.20');
  });
});

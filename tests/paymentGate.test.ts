import { describe, it, expect, afterEach } from 'vitest';
import { isPurchaseKindEnabled, marketplacePaymentsEnabled } from '@/lib/server/pricing';

// The single rule this file exists to protect: dropping a Razorpay key into the
// environment must NOT arm the purchase kinds that leave Companio holding money
// owed to a companion. Those need an RBI Payment Aggregator licence. Only the
// ₹199 unlock — where nobody else is owed anything — is sellable by default.

afterEach(() => {
  delete process.env.MARKETPLACE_PAYMENTS_ENABLED;
});

describe('marketplacePaymentsEnabled', () => {
  it('is off when the flag is unset', () => {
    expect(marketplacePaymentsEnabled()).toBe(false);
  });

  it('is off for any value other than the exact string "true"', () => {
    for (const v of ['1', 'yes', 'TRUE', 'on', '']) {
      process.env.MARKETPLACE_PAYMENTS_ENABLED = v;
      expect(marketplacePaymentsEnabled()).toBe(false);
    }
  });

  it('is on only for "true"', () => {
    process.env.MARKETPLACE_PAYMENTS_ENABLED = 'true';
    expect(marketplacePaymentsEnabled()).toBe(true);
  });
});

describe('isPurchaseKindEnabled', () => {
  it('always allows the unlock — no third-party money is held', () => {
    expect(isPurchaseKindEnabled('unlock')).toBe(true);
    process.env.MARKETPLACE_PAYMENTS_ENABLED = 'true';
    expect(isPurchaseKindEnabled('unlock')).toBe(true);
  });

  it.each(['booking', 'credits', 'plus'] as const)(
    'blocks %s until the licence gate is explicitly opened',
    (kind) => {
      expect(isPurchaseKindEnabled(kind)).toBe(false);
      process.env.MARKETPLACE_PAYMENTS_ENABLED = 'true';
      expect(isPurchaseKindEnabled(kind)).toBe(true);
    },
  );
});

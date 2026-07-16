import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { sessionMock, prismaMock, settleMock } = vi.hoisted(() => ({
  sessionMock: vi.fn<() => Promise<string | null>>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaMock: {} as any,
  settleMock: vi.fn(),
}));
vi.mock('@/lib/server/session', () => ({ getSessionUserId: sessionMock }));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/server/payments', () => ({ settlePurchase: settleMock }));

import { GET, POST, testCheckoutEnabled } from '@/app/api/test-checkout/route';

function jsonReq(body: unknown) {
  return new Request('http://test/api/test-checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const ORIGINAL = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue('u1');
  settleMock.mockResolvedValue({ settled: true, kind: 'unlock' });
  prismaMock.user = { findUnique: vi.fn().mockResolvedValue({ unlocked: false, unlockedUntil: null }) };
  prismaMock.purchase = { create: vi.fn().mockResolvedValue({ id: 'p1' }) };
  delete process.env.RAZORPAY_KEY_ID;
  process.env.ALLOW_TEST_CHECKOUT = 'true';
  // Supply-first gate. The default is OFF, so the happy-path tests below have to
  // arm it deliberately — the same way a real deployment does.
  process.env.PASS_SALES_ENABLED = 'true';
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('test checkout — the safety rules', () => {
  /**
   * The one that matters. A deployment that can take real money must never also
   * hand the same goods out for free, and this must not depend on anyone
   * remembering to unset a flag. Pasting in the Razorpay key IS the off switch.
   */
  it('is dead the moment a Razorpay key exists, even with the flag on', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_live_abc123';
    process.env.ALLOW_TEST_CHECKOUT = 'true';

    expect(testCheckoutEnabled()).toBe(false);
    const res = await POST(jsonReq({ kind: 'unlock' }));
    expect(res.status).toBe(403);
    expect(prismaMock.purchase.create).not.toHaveBeenCalled();
  });

  it('is off unless explicitly switched on', async () => {
    delete process.env.ALLOW_TEST_CHECKOUT;
    expect(testCheckoutEnabled()).toBe(false);
    expect((await POST(jsonReq({ kind: 'unlock' }))).status).toBe(403);
  });

  /**
   * A pass buys access to the companion catalogue. Until real companions exist
   * the catalogue is empty, so there is nothing to sell — and the free test door
   * must not grant what the paid door refuses.
   */
  it('refuses while pass sales are off, even with the test flag on', async () => {
    delete process.env.PASS_SALES_ENABLED;
    const res = await POST(jsonReq({ kind: 'unlock' }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: 'pass_sales_disabled' });
    expect(prismaMock.purchase.create).not.toHaveBeenCalled();
  });

  it('a truthy-looking PASS_SALES_ENABLED that is not "true" does not switch it on', async () => {
    process.env.PASS_SALES_ENABLED = '1';
    expect((await POST(jsonReq({ kind: 'unlock' }))).status).toBe(409);
    expect(prismaMock.purchase.create).not.toHaveBeenCalled();
  });

  it('a truthy-looking value that is not "true" does not switch it on', async () => {
    process.env.ALLOW_TEST_CHECKOUT = '1';
    expect(testCheckoutEnabled()).toBe(false);
  });

  it('needs a session — it cannot unlock a stranger', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await POST(jsonReq({ kind: 'unlock' }))).status).toBe(401);
    expect(prismaMock.purchase.create).not.toHaveBeenCalled();
  });

  // v1 sells exactly one thing. Anything else pools money owed to a companion,
  // which needs the payment-aggregator licence Companio does not hold. A test
  // door is not an excuse to pretend otherwise.
  it('refuses every kind but unlock', async () => {
    for (const kind of ['booking', 'credits', 'plus']) {
      const res = await POST(jsonReq({ kind }));
      expect(res.status, kind).toBe(400);
    }
    expect(prismaMock.purchase.create).not.toHaveBeenCalled();
  });
});

describe('test checkout — the happy path', () => {
  it('grants the unlock through settlePurchase, the same door a real payment uses', async () => {
    const res = await POST(jsonReq({ kind: 'unlock' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, kind: 'unlock', test: true });
    expect(settleMock).toHaveBeenCalledOnce();
  });

  it('records the purchase at the real price, marked as a test order', async () => {
    await POST(jsonReq({ kind: 'unlock' }));
    const { data } = prismaMock.purchase.create.mock.calls[0][0];
    expect(data.amount).toBe(19900);
    expect(data.kind).toBe('unlock');
    // Prefixed so nobody has to guess whether ₹199 actually arrived.
    expect(data.razorpayOrderId).toMatch(/^test_order_/);
  });

  it('does not write a second purchase for a member holding a live pass', async () => {
    // null expiry + unlocked = lifetime.
    prismaMock.user.findUnique.mockResolvedValue({ unlocked: true, unlockedUntil: null });
    const res = await POST(jsonReq({ kind: 'unlock' }));
    expect(await res.json()).toMatchObject({ alreadyUnlocked: true });
    expect(prismaMock.purchase.create).not.toHaveBeenCalled();
    expect(settleMock).not.toHaveBeenCalled();
  });

  /**
   * `unlocked` stays true forever once set, so it cannot be the thing that says
   * "you already have this". A lapsed pass must be buyable again — otherwise the
   * ladder silently becomes a one-time purchase for everyone who ever bought.
   */
  it('lets a member whose pass has lapsed buy again', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      unlocked: true,
      unlockedUntil: new Date(Date.now() - 86_400_000),
    });
    const res = await POST(jsonReq({ kind: 'unlock' }));
    expect(res.status).toBe(200);
    expect(prismaMock.purchase.create).toHaveBeenCalledOnce();
  });

  it('buys the tier it was asked for, at that tier\'s real price', async () => {
    const res = await POST(jsonReq({ kind: 'unlock', passTier: 'passlife' }));
    expect(res.status).toBe(200);
    expect(prismaMock.purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passTier: 'passlife', amount: 199900 }),
      }),
    );
  });

  it('falls back to the entry month when no tier is named', async () => {
    await POST(jsonReq({ kind: 'unlock' }));
    expect(prismaMock.purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passTier: 'pass1m', amount: 19900 }),
      }),
    );
  });

  it('refuses to invent a price for a tier that does not exist', async () => {
    await POST(jsonReq({ kind: 'unlock', passTier: 'pass99m' }));
    expect(prismaMock.purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passTier: 'pass1m', amount: 19900 }),
      }),
    );
  });

  it('GET reports whether it is enabled', async () => {
    expect(await GET().json()).toEqual({ enabled: true });
    process.env.RAZORPAY_KEY_ID = 'rzp_live_abc';
    expect(await GET().json()).toEqual({ enabled: false });
  });
});

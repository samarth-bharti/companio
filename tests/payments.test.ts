import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { safeEqual, hmac, settlePurchase } from '@/lib/server/payments';

describe('safeEqual', () => {
  it('is true for identical strings', () => expect(safeEqual('abc', 'abc')).toBe(true));
  it('is false for different strings of equal length', () => expect(safeEqual('abc', 'abd')).toBe(false));
  it('is false for length mismatch (no throw)', () => expect(safeEqual('ab', 'abc')).toBe(false));
});

describe('hmac', () => {
  it('matches a Node crypto reference digest', () => {
    const expected = crypto.createHmac('sha256', 'secret').update('order|pay').digest('hex');
    expect(hmac('order|pay', 'secret')).toBe(expected);
  });
});

describe('settlePurchase', () => {
  // Build a prisma whose $transaction runs the callback with a tx mock.
  function makePrisma(purchase: unknown) {
    const tx = {
      purchase: {
        findUnique: vi.fn().mockResolvedValue(purchase),
        update: vi.fn().mockResolvedValue({}),
      },
      booking: { update: vi.fn().mockResolvedValue({ id: 'b1', companionId: 'c1', payoutPaise: 0 }) },
      wallet: { upsert: vi.fn().mockResolvedValue({ id: 'w1' }) },
      creditLedger: { create: vi.fn().mockResolvedValue({}) },
      user: { update: vi.fn().mockResolvedValue({}) },
      subscription: { upsert: vi.fn().mockResolvedValue({}) },
      companionPayout: { upsert: vi.fn().mockResolvedValue({}) },
      spinResult: { update: vi.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: vi.fn((cb: (t: typeof tx) => unknown) => cb(tx)) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { prisma: prisma as any, tx };
  }

  it('returns no_purchase when no order matches', async () => {
    const { prisma, tx } = makePrisma(null);
    const res = await settlePurchase(prisma, { orderId: 'o1', paymentId: 'p1' });
    expect(res).toEqual({ settled: false, reason: 'no_purchase' });
    expect(tx.purchase.update).not.toHaveBeenCalled();
  });

  it('is idempotent for an already-paid purchase', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu1', kind: 'credits', status: 'paid', razorpayPaymentId: 'p1' });
    const res = await settlePurchase(prisma, { orderId: 'o1', paymentId: 'p1' });
    expect(res).toEqual({ settled: true, kind: 'credits', idempotent: true });
    expect(tx.purchase.update).not.toHaveBeenCalled();
    expect(tx.wallet.upsert).not.toHaveBeenCalled();
  });

  it('grants credits + writes a ledger row for a credits purchase', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu1', userId: 'u1', kind: 'credits', credits: 5, status: 'created', razorpayPaymentId: null });
    const res = await settlePurchase(prisma, { orderId: 'o1', paymentId: 'p1' });
    expect(res).toEqual({ settled: true, kind: 'credits' });
    expect(tx.purchase.update).toHaveBeenCalledOnce();
    expect(tx.wallet.upsert).toHaveBeenCalledOnce();
    expect(tx.creditLedger.create).toHaveBeenCalledOnce();
  });

  it('flips the unlock flag for an unlock purchase', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu1', userId: 'u1', kind: 'unlock', credits: 0, status: 'created', razorpayPaymentId: null });
    const res = await settlePurchase(prisma, { orderId: 'o1', paymentId: 'p1' });
    expect(res).toEqual({ settled: true, kind: 'unlock' });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { unlocked: true } });
    expect(tx.wallet.upsert).not.toHaveBeenCalled();
  });

  it('activates plus for a plus purchase', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu1', userId: 'u1', kind: 'plus', credits: 0, status: 'created', razorpayPaymentId: null });
    const res = await settlePurchase(prisma, { orderId: 'o1', paymentId: 'p1' });
    expect(res).toEqual({ settled: true, kind: 'plus' });
    expect(tx.subscription.upsert).toHaveBeenCalledOnce();
  });

  it('confirms (not completes) the linked booking for a booking purchase', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu1', userId: 'u1', kind: 'booking', bookingId: 'b1', credits: 0, status: 'created', razorpayPaymentId: null });
    const res = await settlePurchase(prisma, { orderId: 'o1', paymentId: 'p1' });
    expect(res).toEqual({ settled: true, kind: 'booking' });
    // Payment confirms the booking → 'upcoming', NOT 'completed': the meetup is
    // still in the future. The cron flips it to 'completed' after the date passes.
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { status: 'upcoming', razorpayPaymentId: 'p1' },
      select: { id: true, companionId: true, payoutPaise: true },
    });
    // payoutPaise is 0 here → no payout row, and no spin to burn.
    expect(tx.companionPayout.upsert).not.toHaveBeenCalled();
    expect(tx.spinResult.update).not.toHaveBeenCalled();
  });

  it('records a companion payout and burns the redeemed spin on a booking', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu1', userId: 'u1', kind: 'booking', bookingId: 'b1', spinResultId: 's1', credits: 0, status: 'created', razorpayPaymentId: null });
    tx.booking.update.mockResolvedValue({ id: 'b1', companionId: 'c1', payoutPaise: 35000 });
    await settlePurchase(prisma, { orderId: 'o1', paymentId: 'p1' });
    expect(tx.companionPayout.upsert).toHaveBeenCalledWith({
      where: { bookingId: 'b1' },
      update: {},
      create: { companionId: 'c1', bookingId: 'b1', amountPaise: 35000 },
    });
    // `usedAt` is what marks a win spent. It used to be `usedBookingId` alone,
    // which could only ever describe a win spent on a booking — and bookings
    // cannot be sold, so no win was spendable at all.
    expect(tx.spinResult.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({ usedBookingId: 'b1', usedAt: expect.any(Date), usedPurchaseId: 'pu1' }),
    });
  });

  it('burns the redeemed spin on an unlock — the only purchase a win can apply to', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu2', userId: 'u1', kind: 'unlock', bookingId: null, spinResultId: 's2', credits: 0, status: 'created', razorpayPaymentId: null });
    await settlePurchase(prisma, { orderId: 'o2', paymentId: 'p2' });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { unlocked: true } });
    expect(tx.spinResult.update).toHaveBeenCalledWith({
      where: { id: 's2' },
      data: expect.objectContaining({ usedAt: expect.any(Date), usedPurchaseId: 'pu2' }),
    });
  });

  it('settles an unlock with no spin win without touching spin state', async () => {
    const { prisma, tx } = makePrisma({ id: 'pu3', userId: 'u1', kind: 'unlock', bookingId: null, spinResultId: null, credits: 0, status: 'created', razorpayPaymentId: null });
    await settlePurchase(prisma, { orderId: 'o3', paymentId: 'p3' });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { unlocked: true } });
    expect(tx.spinResult.update).not.toHaveBeenCalled();
  });
});

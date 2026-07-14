import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eraseCompanion, eraseUser } from '@/lib/server/erase';

// A bare prisma.companion.delete() raised a P2003 FK error the moment anyone had
// booked that companion, and the admin panel surfaced it as an unhandled server
// action. eraseCompanion refuses instead, with a reason the operator can act on.

/* eslint-disable @typescript-eslint/no-explicit-any */
function makePrisma() {
  const tx: any = {
    creditLedger: { deleteMany: vi.fn() },
    wallet: { deleteMany: vi.fn() },
    purchase: { deleteMany: vi.fn() },
    booking: { deleteMany: vi.fn() },
    favorite: { deleteMany: vi.fn() },
    message: { deleteMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    subscription: { deleteMany: vi.fn() },
    companionApplication: { deleteMany: vi.fn() },
    companionPayout: { deleteMany: vi.fn() },
    user: { delete: vi.fn(), updateMany: vi.fn() },
    companion: { delete: vi.fn(), update: vi.fn() },
  };
  const prisma: any = {
    ...tx,
    booking: { ...tx.booking, count: vi.fn() },
    // eraseUser reads the login's companionId before opening the transaction.
    // Default: an ordinary member who owns no companion profile.
    user: { ...tx.user, findUnique: vi.fn().mockResolvedValue({ companionId: null }) },
    $transaction: vi.fn(async (fn: any) => fn(tx)),
  };
  return { prisma, tx };
}

describe('eraseCompanion', () => {
  let prisma: any, tx: any;
  beforeEach(() => { ({ prisma, tx } = makePrisma()); });

  it('refuses to delete a companion who has bookings', async () => {
    prisma.booking.count.mockResolvedValue(3);
    const result = await eraseCompanion(prisma, 'ananya');
    expect(result).toEqual({ ok: false, reason: 'has_bookings', bookings: 3 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.companion.delete).not.toHaveBeenCalled();
  });

  it('deletes a companion with no bookings, clearing child rows first', async () => {
    prisma.booking.count.mockResolvedValue(0);
    const result = await eraseCompanion(prisma, 'ananya');
    expect(result).toEqual({ ok: true });
    expect(tx.message.deleteMany).toHaveBeenCalledWith({ where: { companionId: 'ananya' } });
    expect(tx.favorite.deleteMany).toHaveBeenCalledWith({ where: { companionId: 'ananya' } });
    expect(tx.companionPayout.deleteMany).toHaveBeenCalledWith({ where: { companionId: 'ananya' } });
    expect(tx.companion.delete).toHaveBeenCalledWith({ where: { id: 'ananya' } });
  });

  it('demotes the account that owned the profile', async () => {
    prisma.booking.count.mockResolvedValue(0);
    await eraseCompanion(prisma, 'ananya');
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { companionId: 'ananya' },
      data: { companionId: null, role: 'user' },
    });
  });
});

describe('eraseUser', () => {
  it('removes the user last, after every child row', async () => {
    const { prisma, tx } = makePrisma();
    await eraseUser(prisma, 'u1');
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    for (const table of ['wallet', 'booking', 'favorite', 'message', 'notification', 'subscription', 'companionApplication']) {
      expect(tx[table].deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    }
    expect(tx.creditLedger.deleteMany).toHaveBeenCalledWith({ where: { wallet: { userId: 'u1' } } });
  });

  it('does NOT delete the payment record', async () => {
    // The privacy policy promises payment and tax records survive erasure, and
    // the company needs its own accounting trail. purchases.userId is SET NULL by
    // the database instead: the payment stays, the person is severed from it.
    const { prisma, tx } = makePrisma();
    await eraseUser(prisma, 'u1');
    expect(tx.purchase.deleteMany).not.toHaveBeenCalled();
  });

  it('suspends the marketplace profile when a companion erases their login', async () => {
    // Otherwise their photo, bio and name stay published on /explore and remain
    // bookable — with nobody able to sign in to the account behind them.
    const { prisma, tx } = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ companionId: 'ananya' });
    await eraseUser(prisma, 'u1');
    expect(tx.companion.update).toHaveBeenCalledWith({
      where: { id: 'ananya' },
      data: { suspended: true },
    });
  });

  it('touches no companion profile for an ordinary member', async () => {
    const { prisma, tx } = makePrisma();
    await eraseUser(prisma, 'u1');
    expect(tx.companion.update).not.toHaveBeenCalled();
  });
});

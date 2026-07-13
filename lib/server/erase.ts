// lib/server/erase.ts
//
// Cascade-safe deletion of a User or a Companion.
//
// Prisma only cascades where the schema says onDelete: Cascade. Several
// relations deliberately don't (Booking→Companion, Message→Companion,
// Favorite→Companion), because losing a companion should never silently erase
// a member's booking history. The consequence is that a bare
// `prisma.companion.delete()` raises P2003 the moment anyone has ever booked
// them — which is exactly what the admin panel used to do, surfacing a raw
// unhandled server-action error to the operator.
//
// These helpers do the ordering explicitly, in one transaction, and are shared
// by the admin panel and the DPDPA erasure endpoint so the two can't drift.

import type { PrismaClient } from '@prisma/client';
import { TX } from '@/lib/server/tx';

/**
 * Permanently delete a user and everything they own. Used by both
 * /api/user/delete (the member's own DPDPA right to erasure) and the admin
 * panel's Delete button.
 */
export async function eraseUser(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // CreditLedger is a child of Wallet, which is a child of User. Wallet
    // cascades from User, but we must go bottom-up to stay explicit.
    await tx.creditLedger.deleteMany({ where: { wallet: { userId } } });
    await tx.wallet.deleteMany({ where: { userId } });
    await tx.purchase.deleteMany({ where: { userId } });

    // No cascade on these — they would raise FK errors if User went first.
    // Booking must precede nothing else here: CompanionPayout cascades from it.
    await tx.booking.deleteMany({ where: { userId } });
    await tx.favorite.deleteMany({ where: { userId } });
    await tx.message.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.subscription.deleteMany({ where: { userId } });
    await tx.companionApplication.deleteMany({ where: { userId } });

    await tx.user.delete({ where: { id: userId } });
  }, TX);
}

export type CompanionEraseResult =
  | { ok: true }
  | { ok: false; reason: 'has_bookings'; bookings: number };

/**
 * Permanently delete a companion profile.
 *
 * REFUSES when the companion has any booking. A booking is a financial and
 * safety record — a member met this person. Deleting it to make a row
 * disappear from a list would destroy the audit trail an admin might later
 * need in a dispute. Ban the companion instead: `bannedAt` hides them
 * everywhere (see lib/server/visibility.ts) while keeping the history.
 */
export async function eraseCompanion(
  prisma: PrismaClient,
  companionId: string,
): Promise<CompanionEraseResult> {
  const bookings = await prisma.booking.count({ where: { companionId } });
  if (bookings > 0) return { ok: false, reason: 'has_bookings', bookings };

  await prisma.$transaction(async (tx) => {
    // Detach the login that owns this profile, if any, and demote it.
    await tx.user.updateMany({
      where: { companionId },
      data: { companionId: null, role: 'user' },
    });
    await tx.message.deleteMany({ where: { companionId } });
    await tx.favorite.deleteMany({ where: { companionId } });
    await tx.companionPayout.deleteMany({ where: { companionId } });
    await tx.companion.delete({ where: { id: companionId } });
  }, TX);

  return { ok: true };
}

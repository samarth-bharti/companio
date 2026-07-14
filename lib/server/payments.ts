// lib/server/payments.ts
//
// Razorpay payment settlement — shared by /api/razorpay/verify (client callback)
// and /api/razorpay/webhook (server-to-server). Settlement is IDEMPOTENT: a
// Purchase already marked `paid` with a payment id is never applied twice, so
// verify + webhook firing for the same payment is safe.
//
// The benefit granted (credits / unlock / plus / booking-complete) comes from
// the server-written Purchase row, NEVER from the client — this is the single
// trusted place money-gated state is flipped.

import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { gstComponent, type PurchaseKind } from './pricing';
import { TX } from '@/lib/server/tx';

/** Constant-time string compare that also tolerates length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** HMAC-SHA256 hex digest of `payload` keyed by `secret`. */
export function hmac(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

type SettleResult =
  | { settled: false; reason: 'no_purchase' }
  | { settled: true; kind?: PurchaseKind; idempotent?: boolean };

/**
 * Apply the benefit tied to a paid Razorpay order, exactly once. The Purchase
 * row (written by create-order with a server-decided amount + credits) is the
 * source of truth for what to grant.
 */
export async function settlePurchase(
  prisma: PrismaClient,
  opts: { orderId: string; paymentId: string },
): Promise<SettleResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { razorpayOrderId: opts.orderId },
    });
    if (!purchase) return { settled: false, reason: 'no_purchase' };
    if (purchase.status === 'paid' && purchase.razorpayPaymentId) {
      return { settled: true, kind: purchase.kind, idempotent: true };
    }

    // Anchor idempotency: flip to paid inside the same transaction first.
    // Stamp a unique invoice number; the GST component is only non-zero once
    // GST registration is live (GST_ACTIVE=true), so pre-registration receipts
    // correctly show ₹0 tax.
    const year = new Date().getFullYear();
    const invoiceNo = `CMPN-${year}-${purchase.id.slice(-10).toUpperCase()}`;
    const gstPaise = process.env.GST_ACTIVE === 'true' ? gstComponent(purchase.amount) : 0;
    await tx.purchase.update({
      where: { id: purchase.id },
      data: { status: 'paid', razorpayPaymentId: opts.paymentId, invoiceNo, gstPaise },
    });

    // Spend the discount code HERE, not when the order was created.
    //
    // A use belongs to a payment, not to an attempt: incrementing at order time
    // would let anyone exhaust a limited code by opening the unlock sheet and
    // walking away. This sits after the idempotency anchor above, so a replayed
    // webhook (verify + webhook both fire for one payment) returns early and
    // cannot count the same code twice.
    if (purchase.discountCode) {
      await tx.discountCode.updateMany({
        where: { code: purchase.discountCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // The buyer erased their account between paying and this settling. The
    // payment is real and stays on the books (purchases.userId is SET NULL on
    // erasure, not cascaded away), but there is nobody left to grant an unlock, a
    // subscription or credits to — and their bookings are already gone, so the
    // booking branch below would raise P2025 on a row that no longer exists.
    // Record the money, grant nothing.
    const buyerId = purchase.userId;
    if (!buyerId) return { settled: true, kind: purchase.kind };

    switch (purchase.kind) {
      case 'booking':
        if (purchase.bookingId) {
          // Payment confirms the booking → 'upcoming'. It is NOT 'completed'
          // here: the meetup is still in the future. The cron flips it to
          // 'completed' only after the date passes, so reviews + final payout
          // release can't happen before the meetup actually occurs.
          const bk = await tx.booking.update({
            where: { id: purchase.bookingId },
            data: { status: 'upcoming', razorpayPaymentId: opts.paymentId },
            select: { id: true, companionId: true, payoutPaise: true },
          });
          // Record what the companion is owed (one payout row per booking).
          if (bk.payoutPaise > 0) {
            await tx.companionPayout.upsert({
              where: { bookingId: bk.id },
              update: {},
              create: { companionId: bk.companionId, bookingId: bk.id, amountPaise: bk.payoutPaise },
            });
          }
          // Burn the redeemed spin win so it can never be reused. It was already
          // reserved (usedAt) at create-order; this records what it went on.
          if (purchase.spinResultId) {
            await tx.spinResult.update({
              where: { id: purchase.spinResultId },
              data: { usedBookingId: bk.id, usedAt: new Date(), usedPurchaseId: purchase.id },
            });
          }
        }
        break;
      case 'credits': {
        const w = await tx.wallet.upsert({
          where: { userId: buyerId },
          update: { credits: { increment: purchase.credits } },
          create: { userId: buyerId, credits: 2 + purchase.credits },
        });
        await tx.creditLedger.create({
          data: { walletId: w.id, delta: purchase.credits, kind: 'topup', note: `purchase ${purchase.id}` },
        });
        break;
      }
      case 'unlock':
        await tx.user.update({ where: { id: buyerId }, data: { unlocked: true } });
        // A spin win discounts the unlock, so the unlock is where it gets burnt.
        // The old code only ever burnt a win on a booking — which is the reason
        // no win was ever spendable at all.
        if (purchase.spinResultId) {
          await tx.spinResult.update({
            where: { id: purchase.spinResultId },
            data: { usedAt: new Date(), usedPurchaseId: purchase.id },
          });
        }
        break;
      case 'plus':
        await tx.subscription.upsert({
          where: { userId: buyerId },
          update: { plan: 'plus', endsAt: null },
          create: { userId: buyerId, plan: 'plus' },
        });
        break;
    }

    return { settled: true, kind: purchase.kind };
  }, TX);
}

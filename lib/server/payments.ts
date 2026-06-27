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
          // Burn the redeemed spin win so it can never be reused.
          if (purchase.spinResultId) {
            await tx.spinResult.update({
              where: { id: purchase.spinResultId },
              data: { usedBookingId: bk.id },
            });
          }
        }
        break;
      case 'credits': {
        const w = await tx.wallet.upsert({
          where: { userId: purchase.userId },
          update: { credits: { increment: purchase.credits } },
          create: { userId: purchase.userId, credits: 2 + purchase.credits },
        });
        await tx.creditLedger.create({
          data: { walletId: w.id, delta: purchase.credits, kind: 'topup', note: `purchase ${purchase.id}` },
        });
        break;
      }
      case 'unlock':
        await tx.user.update({ where: { id: purchase.userId }, data: { unlocked: true } });
        break;
      case 'plus':
        await tx.subscription.upsert({
          where: { userId: purchase.userId },
          update: { plan: 'plus', endsAt: null },
          create: { userId: purchase.userId, plan: 'plus' },
        });
        break;
    }

    return { settled: true, kind: purchase.kind };
  });
}

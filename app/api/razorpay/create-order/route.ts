// app/api/razorpay/create-order/route.ts
//
// POST /api/razorpay/create-order { kind, packId?, bookingId? }
// The client names WHAT it is buying; the SERVER fixes the price from
// lib/server/pricing.ts (the client never sends an amount). A Purchase row
// records the server-decided benefit so settlePurchase() can grant it after
// HMAC verification. For kind=booking the order id is also stamped on the booking.
//
// Returns 503 until RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are provided.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { orderCreateBody } from '@/lib/server/validation';
import {
  CREDIT_PACKS,
  isPackId,
  UNLOCK_AMOUNT,
  PLUS_AMOUNT,
} from '@/lib/server/pricing';
import { quoteBooking } from '@/lib/server/booking';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    // Throttle order creation per client IP — payment endpoints are a prime
    // abuse target (card testing, order spam).
    const rl = await rateLimit({ key: clientKey(req, 'create-order'), limit: 20, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return json({ error: 'razorpay_not_configured' }, 503);

    const parsed = orderCreateBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { kind, packId, bookingId } = parsed.data;

    const { prisma } = await import('@/lib/prisma');

    // Resolve the server-side price + benefit. The client cannot influence these.
    let amount: number;
    let credits = 0;
    let spinResultId: string | null = null;
    if (kind === 'unlock') {
      amount = UNLOCK_AMOUNT;
    } else if (kind === 'plus') {
      amount = PLUS_AMOUNT;
    } else if (kind === 'credits') {
      if (!isPackId(packId)) return badRequest('invalid_pack');
      amount = CREDIT_PACKS[packId].amount;
      credits = CREDIT_PACKS[packId].credits;
    } else {
      // kind === 'booking' — booking must exist AND belong to this user, else a
      // paid order would be orphaned with nothing to settle. Price comes from the
      // companion's hourly rate × hours, with surge + the user's best spin win.
      if (!bookingId) return badRequest('missing_booking');
      const owned = await prisma.booking.findFirst({
        where: { id: bookingId, userId },
        select: { id: true, companionId: true, hours: true, dateISO: true },
      });
      if (!owned) return json({ error: 'booking_not_found' }, 404);

      const quote = await quoteBooking(prisma, {
        companionId: owned.companionId,
        userId,
        hours: owned.hours,
        dateISO: owned.dateISO,
      });
      amount = quote.pricePaid;
      spinResultId = quote.spinResultId;

      // Stamp the trusted breakdown on the booking now; settle reads it back.
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          pricePaid: quote.pricePaid,
          commissionPaise: quote.commissionPaise,
          payoutPaise: quote.payoutPaise,
          surgeMultiplier: quote.surgeMultiplier,
          spinDiscountPct: quote.spinDiscountPct,
        },
      });

      // Reserve the spin NOW so two concurrent create-order calls can't both
      // claim the same win and both get a discounted price. If the reservation
      // fails (count=0) the spin was already claimed; re-quote without it.
      if (spinResultId) {
        const reserved = await prisma.spinResult.updateMany({
          where: { id: spinResultId, usedBookingId: null },
          data: { usedBookingId: bookingId },
        });
        if (reserved.count === 0) {
          // Concurrent claim — recalculate price without the spin discount.
          const noSpin = await quoteBooking(prisma, {
            companionId: owned.companionId,
            userId,
            hours: owned.hours,
            dateISO: owned.dateISO,
            applySpin: false,
          });
          amount = noSpin.pricePaid;
          spinResultId = null;
          // Re-stamp the booking with the spin-free breakdown.
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              pricePaid: noSpin.pricePaid,
              commissionPaise: noSpin.commissionPaise,
              payoutPaise: noSpin.payoutPaise,
              surgeMultiplier: noSpin.surgeMultiplier,
              spinDiscountPct: 0,
            },
          });
        }
        // else: reserved successfully — settle will confirm usedBookingId is set.
      }
    }

    const Razorpay = (await import('razorpay')).default;
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({ amount, currency: 'INR', notes: { kind, userId } });

    // Persist the server-decided benefit — settlePurchase reads this, not the client.
    await prisma.purchase.create({
      data: {
        userId,
        kind,
        amount,
        credits,
        bookingId: kind === 'booking' ? bookingId : null,
        spinResultId,
        razorpayOrderId: order.id,
      },
    });

    if (kind === 'booking' && bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { razorpayOrderId: order.id },
      });
    }

    return json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  });
}

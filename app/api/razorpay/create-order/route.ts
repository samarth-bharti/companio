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
  isPurchaseKindEnabled,
  applyDiscount,
  UNLOCK_AMOUNT,
  PLUS_AMOUNT,
} from '@/lib/server/pricing';
import { quoteBooking, bestSpin } from '@/lib/server/booking';
import { resolveDiscount, discountFailureMessage } from '@/lib/server/discounts';
import { envValue } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    // Throttle order creation per client IP — payment endpoints are a prime
    // abuse target (card testing, order spam).
    const rl = await rateLimit({ key: clientKey(req, 'create-order'), limit: 20, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    // envValue() so a placeholder key reads as unset and we answer an honest
    // 503, rather than handing garbage credentials to Razorpay and throwing.
    const keyId = envValue('RAZORPAY_KEY_ID');
    const keySecret = envValue('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'razorpay_not_configured' }, 503);

    const parsed = orderCreateBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { kind, packId, bookingId, discountCode } = parsed.data;

    // Refuse any kind that would leave us holding a companion's money without
    // an RBI Payment Aggregator licence. 503, so the client shows "temporarily
    // unavailable" rather than falling back to a free grant.
    if (!isPurchaseKindEnabled(kind)) {
      return json({ error: 'purchase_kind_disabled', kind }, 503);
    }

    const { prisma } = await import('@/lib/prisma');

    // Resolve the server-side price + benefit. The client cannot influence these.
    let amount: number;
    let credits = 0;
    let spinResultId: string | null = null;
    let appliedCode: string | null = null;
    if (kind === 'unlock') {
      // A spin win discounts the unlock — the only thing v1 sells, and so the
      // only thing a win can be spent on. The wheel used to award "% off your
      // next meetup", which nobody could ever redeem.
      //
      // Reserved here, at the moment the price is fixed, because the Razorpay
      // order is created for exactly this amount: if the win were claimed after
      // the order, a second order could claim it too and both would be charged
      // the discounted price.
      amount = UNLOCK_AMOUNT;
      const spin = await bestSpin(prisma, userId);
      if (spin) {
        const reserved = await prisma.spinResult.updateMany({
          where: { id: spin.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        if (reserved.count === 1) {
          amount = applyDiscount(UNLOCK_AMOUNT, spin.discountPct);
          spinResultId = spin.id;
        }
        // reserved.count === 0 ⇒ a concurrent order already took it. Full price.
      }

      // A discount code, if one was typed. Applied to the price AFTER a spin win,
      // so the two stack rather than one silently overwriting the other.
      //
      // Nothing is spent here: `usedCount` is incremented in settlePurchase, when
      // money has actually moved. An abandoned checkout must not burn a use of a
      // limited code.
      if (discountCode) {
        const verdict = await resolveDiscount(prisma, discountCode, amount);
        if (!verdict.ok) {
          // The order is NOT created with a bad code silently ignored — that
          // would charge full price to someone who believes they have a discount.
          return json(
            { error: 'discount_invalid', reason: verdict.reason, message: discountFailureMessage(verdict.reason) },
            400,
          );
        }
        amount = verdict.amountPaise;
        appliedCode = verdict.code;
      }
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
          where: { id: spinResultId, usedAt: null },
          data: { usedBookingId: bookingId, usedAt: new Date() },
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
        // Recorded, not spent. settlePurchase reads it back and increments the
        // code's usedCount only once the payment is real.
        discountCode: appliedCode,
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

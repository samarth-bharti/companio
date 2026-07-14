// app/api/bookings/[id]/route.ts
//
// POST /api/bookings/:id → patch a booking (status, review, reschedule fields).
// Scoped to the owner via updateMany(where:{id,userId}) so one user can never
// mutate another user's booking (IDOR guard). 404 if no row matched.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { bookingPatchBody } from '@/lib/server/validation';
import { meetupStart } from '@/lib/meetupTime';
import { recomputeCompanionReviews } from '@/lib/server/reviews';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { id } = await params;
    const parsed = bookingPatchBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { review, ...rest } = parsed.data;
    const { prisma } = await import('@/lib/prisma');

    // Reviews are only accepted on bookings that are completed AND have a
    // payment record (Razorpay payment or a credit spend). This prevents
    // unverified reviews on unpaid or future bookings.
    if (review !== undefined) {
      const bk = await prisma.booking.findFirst({
        where: { id, userId },
        select: { status: true, razorpayPaymentId: true, usedCredit: true },
      });
      if (!bk) return json({ error: 'not_found' }, 404);
      const paid = bk.razorpayPaymentId !== null || bk.usedCredit;
      if (bk.status !== 'completed' || !paid) {
        return json({ error: 'review_not_eligible' }, 403);
      }
    }

    // Cancelling or rescheduling: a completed meetup is immutable, and a paid
    // cash booking can't be cancelled here because no refund/payout-reversal
    // flow exists yet — that arrives with Razorpay Route. Block both rather than
    // silently leaving the companion's payout stranded or the money unrefunded.
    const wantsCancel = rest.status === 'cancelled';
    const wantsReschedule =
      rest.activity !== undefined || rest.dateISO !== undefined ||
      rest.time !== undefined || rest.place !== undefined;
    if (wantsCancel || wantsReschedule) {
      const bk = await prisma.booking.findFirst({
        where: { id, userId },
        select: {
          status: true,
          razorpayPaymentId: true,
          usedCredit: true,
          dateISO: true,
          time: true,
          activity: true,
        },
      });
      if (!bk) return json({ error: 'not_found' }, 404);
      if (bk.status === 'completed') {
        return json({ error: 'booking_completed' }, 409);
      }
      if (wantsCancel && bk.razorpayPaymentId !== null) {
        return json({ error: 'refund_not_supported' }, 409);
      }

      // Give the included meeting back when the member cancels in good time.
      //
      // /refunds publishes the rule: "If you cancel more than 24 hours before a
      // meetup, the credit returns to your wallet instantly. Inside 24 hours, the
      // meetup counts as used, companions reserve that time for you."
      //
      // The route did not implement it. It flipped `status` and nothing else, so
      // a member who cancelled a week early silently forfeited one of the two
      // meetings they had paid ₹199 for — the product taking money for a service
      // its own refund policy says it will return. The 24-hour cutoff is measured
      // from the real start of the meetup (date + slot, IST), not from midnight.
      if (wantsCancel && bk.usedCredit && bk.status !== 'cancelled') {
        const startsAt = meetupStart(bk.dateISO, bk.time).getTime();
        const refundable = startsAt - Date.now() > 24 * 60 * 60 * 1000;

        if (refundable) {
          // One transaction: the status change and the credit return either both
          // land or neither does. A cancelled booking whose credit never came
          // back is exactly the state this must never leave behind.
          await prisma.$transaction(async (tx) => {
            await tx.booking.updateMany({
              where: { id, userId },
              data: { ...rest, ...(review !== undefined ? { review } : {}) },
            });
            const wallet = await tx.wallet.update({
              where: { userId },
              data: { credits: { increment: 1 }, used: { decrement: 1 } },
              select: { id: true },
            });
            await tx.creditLedger.create({
              data: {
                walletId: wallet.id,
                delta: 1,
                kind: 'refund',
                note: `Cancelled more than 24h before the meetup (${bk.activity})`,
              },
            });
          });
          return json({ ok: true, creditReturned: true });
        }
      }
    }

    const res = await prisma.booking.updateMany({
      where: { id, userId },
      data: { ...rest, ...(review !== undefined ? { review } : {}) },
    });
    if (res.count === 0) return json({ error: 'not_found' }, 404);

    // A review that only ever lives on the booking row is a review nobody can
    // read. Companion.rating / reviewCount / reviewsList existed and nothing
    // wrote to them, so every companion stayed at rating 0 with an empty review
    // list forever, no matter how many five-star meetups they had. The member
    // was asked to rate, thanked, and their answer went into a drawer.
    //
    // Recompute the companion's aggregate from the bookings that actually carry
    // a review. Derived, not incremented: an edited or removed review then heals
    // the average instead of skewing it permanently.
    if (review !== undefined) {
      const bk = await prisma.booking.findFirst({
        where: { id, userId },
        select: { companionId: true },
      });
      if (bk) await recomputeCompanionReviews(prisma, bk.companionId);
    }

    return json({ ok: true, creditReturned: false });
  });
}

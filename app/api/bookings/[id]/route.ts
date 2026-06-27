// app/api/bookings/[id]/route.ts
//
// POST /api/bookings/:id → patch a booking (status, review, reschedule fields).
// Scoped to the owner via updateMany(where:{id,userId}) so one user can never
// mutate another user's booking (IDOR guard). 404 if no row matched.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { bookingPatchBody } from '@/lib/server/validation';

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
        select: { status: true, razorpayPaymentId: true },
      });
      if (!bk) return json({ error: 'not_found' }, 404);
      if (bk.status === 'completed') {
        return json({ error: 'booking_completed' }, 409);
      }
      if (wantsCancel && bk.razorpayPaymentId !== null) {
        return json({ error: 'refund_not_supported' }, 409);
      }
    }

    const res = await prisma.booking.updateMany({
      where: { id, userId },
      data: { ...rest, ...(review !== undefined ? { review } : {}) },
    });
    if (res.count === 0) return json({ error: 'not_found' }, 404);
    return json({ ok: true });
  });
}

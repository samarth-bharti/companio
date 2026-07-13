// app/api/companion/bookings/[id]/decline/route.ts
//
// POST /api/companion/bookings/:id/decline  { reason? }
//
// A companion refuses a booking. Until now they could not: `BookingStatus` had
// no state for it, and the dashboard's Accept/Decline buttons — which wrote a
// local notification and changed nothing — were removed rather than wired up.
// The state exists now, so the buttons can come back.
//
// WHAT THIS MUST GET RIGHT
//
//  • Authorisation is by ownership of the *companion profile*, not by user id.
//    Only the account whose `User.companionId` matches the booking's companion
//    may decline it.
//  • Declining returns what the member paid. A credit booking gives the credit
//    back, with a ledger row, in the same transaction that flips the status —
//    otherwise a crash between the two silently eats a meetup.
//  • A cash booking that settled through Razorpay is refused here. Reversing it
//    needs a real refund and a payout reversal, and neither exists yet. Better a
//    409 the companion can read than a booking marked declined with the member's
//    money still in our account.
//  • Only an `upcoming` booking can be declined. Completed is history; already
//    cancelled or declined is idempotent-by-refusal.

import { z } from 'zod';
import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { getCompanionIdForUser } from '@/lib/server/companion';
import { clientKey, rateLimit } from '@/lib/server/rateLimit';
import { TX } from '@/lib/server/tx';

export const dynamic = 'force-dynamic';

const declineBody = z.object({
  reason: z.string().trim().max(280).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const rl = await rateLimit({ key: clientKey(req, 'decline'), limit: 20, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited' }, 429);

    const { id } = await params;
    const parsed = declineBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    const { prisma } = await import('@/lib/prisma');
    const companionId = await getCompanionIdForUser(prisma, userId);
    if (!companionId) return json({ error: 'not_a_companion' }, 403);

    const booking = await prisma.booking.findFirst({
      where: { id, companionId },
      select: {
        id: true,
        status: true,
        usedCredit: true,
        razorpayPaymentId: true,
        userId: true,
        dateISO: true,
        activity: true,
      },
    });
    if (!booking) return json({ error: 'not_found' }, 404);
    if (booking.status !== 'upcoming') return json({ error: 'not_declinable' }, 409);
    if (booking.razorpayPaymentId !== null) return json({ error: 'refund_not_supported' }, 409);

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'declined',
          refundedAt: new Date(),
          refundReason: parsed.data.reason?.trim() || 'Declined by companion',
        },
      });

      // Give the meetup back. `used` is decremented too, so the member's
      // "2 included meetings" reads correctly on the dashboard. CreditLedger is
      // keyed by walletId, not userId, so the wallet is resolved first.
      if (booking.usedCredit) {
        const wallet = await tx.wallet.update({
          where: { userId: booking.userId },
          data: { credits: { increment: 1 }, used: { decrement: 1 } },
          select: { id: true },
        });
        await tx.creditLedger.create({
          data: {
            walletId: wallet.id,
            delta: 1,
            kind: 'refund',
            note: `Booking declined by companion (${booking.activity})`,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: booking.userId,
          title: 'Your booking was declined',
          body: booking.usedCredit
            ? `Your ${booking.activity} on ${booking.dateISO} could not go ahead. Your included meetup has been returned to your wallet.`
            : `Your ${booking.activity} on ${booking.dateISO} could not go ahead.`,
          ts: BigInt(Date.now()),
        },
      });
    }, TX);

    return json({ ok: true });
  });
}

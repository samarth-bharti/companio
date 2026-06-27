// app/api/bookings/route.ts
//
// GET  /api/bookings → Booking[]  (the signed-in user's bookings, newest first)
// POST /api/bookings → create a booking, returns the created Booking

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard, parsePagination } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { bookingCreateBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { take, skip } = parsePagination(req);
    const { prisma } = await import('@/lib/prisma');
    const { toBooking } = await import('@/lib/server/serialize');
    const rows = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return json(rows.map(toBooking));
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const rl = await rateLimit({ key: clientKey(req, 'booking-create'), limit: 20, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);
    const parsed = bookingCreateBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    const { usedCredit, ...fields } = parsed.data;
    const { prisma } = await import('@/lib/prisma');
    const { toBooking } = await import('@/lib/server/serialize');

    // pricePaid is always 0 at create time — the server stamps it later:
    //   credit path  → stays 0 (no cash changes hands)
    //   Razorpay path → set by create-order once the payment quote is computed
    const bookingData = { userId, ...fields, usedCredit, pricePaid: 0 };

    let booking: Awaited<ReturnType<typeof prisma.booking.create>>;

    if (usedCredit) {
      // Atomic: decrement wallet and create booking in the same transaction so
      // the credit cannot be double-spent across concurrent requests.
      const result = await prisma.$transaction(async (tx) => {
        // Ensure a wallet row exists before the conditional decrement — a
        // freshly-migrated user has no row yet, so the default 2 free credits
        // must be materialised here or the decrement would wrongly 402.
        await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId }, // schema default seeds the starter credits
        });
        const dec = await tx.wallet.updateMany({
          where: { userId, credits: { gt: 0 } },
          data: { credits: { decrement: 1 }, used: { increment: 1 } },
        });
        if (dec.count === 0) return null; // no credits — abort

        // Write ledger entry for the spend.
        const w = await tx.wallet.findUnique({ where: { userId }, select: { id: true } });
        if (w) {
          await tx.creditLedger.create({
            data: { walletId: w.id, delta: -1, kind: 'spend', note: 'booking credit' },
          });
        }

        return tx.booking.create({ data: bookingData });
      });

      if (result === null) {
        return json({ error: 'insufficient_credits' }, 402);
      }
      booking = result;
    } else {
      // Cash booking: created UNCONFIRMED (pending_payment). It only becomes a
      // real, confirmed meetup once Razorpay settlement promotes it to
      // 'upcoming' (settlePurchase). Until then it is never shown as confirmed
      // and the cron never auto-completes it — closes the free-booking hole.
      booking = await prisma.booking.create({
        data: { ...bookingData, status: 'pending_payment' },
      });
    }

    // Fire the confirmation email (dormant without RESEND_API_KEY, never throws).
    const { notifyBookingCreated } = await import('@/lib/server/notify');
    await notifyBookingCreated(prisma, userId, booking);

    return json(toBooking(booking));
  });
}

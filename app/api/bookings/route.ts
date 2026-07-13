// app/api/bookings/route.ts
//
// GET  /api/bookings → Booking[]  (the signed-in user's bookings, newest first)
// POST /api/bookings → create a booking, returns the created Booking

import { randomInt } from 'node:crypto';
import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard, parsePagination } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { bookingCreateBody } from '@/lib/server/validation';
import { TX } from '@/lib/server/tx';

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
    const { VISIBLE_COMPANION } = await import('@/lib/server/visibility');
    const { isAdult } = await import('@/lib/server/age');

    // Companio is 18+, and a booking is the moment two strangers agree to meet
    // in person. A null date of birth is not an adult date of birth: refuse and
    // make the client collect it. Checked before the credit is spent.
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true },
    });
    if (!isAdult(me?.dateOfBirth)) {
      return json(
        {
          error: 'age_verification_required',
          detail: 'Confirm your date of birth before booking. Companio is for adults aged 18 and over.',
        },
        403,
      );
    }

    // A suspended companion must not take new bookings. Checked before the
    // credit is spent, so a rejected booking never costs the user anything.
    const bookable = await prisma.companion.findFirst({
      where: { id: fields.companionId, ...VISIBLE_COMPANION },
      select: { id: true },
    });
    if (!bookable) return json({ error: 'companion_unavailable' }, 404);

    // pricePaid is always 0 at create time — the server stamps it later:
    //   credit path  → stays 0 (no cash changes hands)
    //   Razorpay path → set by create-order once the payment quote is computed
    // The code both people read out when they meet. Generated server-side with a
    // CSPRNG — a guessable code is an impostor's way in, and Math.random() is
    // guessable.
    const meetupCode = String(randomInt(0, 10_000)).padStart(4, '0');
    const bookingData = { userId, ...fields, usedCredit, pricePaid: 0, meetupCode };

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
      }, TX);

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

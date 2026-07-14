// app/api/user/refund/route.ts
//
// POST /api/user/refund — the refund policy's "one tap from your dashboard".
//
// The refund policy promises: "Didn't find anyone you'd like to meet? Full refund
// within 7 days of unlocking, no questions asked. One tap from your dashboard."
// There was no tap, and no route. This is it.
//
// It does NOT move money. It cannot: a Razorpay refund needs the live secret key,
// and this deployment has none, so a route that claimed to have refunded you would
// be lying at the exact moment it mattered most. What it does instead is decide
// eligibility server-side — from the purchase row, not from anything the client
// says — and file the request where an operator will actually see it
// (/admin/messages). The member is told plainly that a human is settling it.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { hasDatabase } from '@/lib/env';
import { formatPaise } from '@/lib/money';

export const dynamic = 'force-dynamic';

/** The window the refund policy commits to, in milliseconds. */
const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  // Does this member have anything refundable right now? The Account panel asks
  // before it renders the button, so nobody is offered a refund they cannot have.
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    if (!hasDatabase()) return json({ eligible: false });

    const { prisma } = await import('@/lib/prisma');
    const purchase = await latestUnlock(prisma, userId);
    if (!purchase) return json({ eligible: false });

    const elapsed = Date.now() - purchase.createdAt.getTime();
    if (elapsed > REFUND_WINDOW_MS) return json({ eligible: false, reason: 'window_closed' });

    const daysLeft = Math.max(1, Math.ceil((REFUND_WINDOW_MS - elapsed) / (24 * 60 * 60 * 1000)));
    return json({ eligible: true, amountPaise: purchase.amount, daysLeft });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    if (!hasDatabase()) return json({ error: 'db_not_configured' }, 503);

    const rl = await rateLimit({ key: clientKey(req, 'refund-request'), limit: 5, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const { prisma } = await import('@/lib/prisma');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });
    if (!user?.email) {
      return json({ ok: false, message: 'Your account has no email address on it, so we cannot reply. Write to us instead.' });
    }

    const purchase = await latestUnlock(prisma, userId);
    if (!purchase) {
      return json({ ok: false, message: 'There is no paid unlock on this account to refund.' });
    }
    if (Date.now() - purchase.createdAt.getTime() > REFUND_WINDOW_MS) {
      return json({
        ok: false,
        message: 'The 7-day refund window on this purchase has closed. Write to us and we will still take a look.',
      });
    }

    // One open request per purchase. A member tapping twice must not create a
    // second row for an operator to refund twice.
    const existing = await prisma.contactMessage.findFirst({
      where: { email: user.email, topic: 'refund', handledAt: null, message: { contains: purchase.id } },
      select: { id: true },
    });
    if (existing) {
      return json({ ok: true, alreadyRequested: true });
    }

    await prisma.contactMessage.create({
      data: {
        name: user.firstName,
        email: user.email,
        topic: 'refund',
        message:
          `Refund requested for the ₹199 unlock.\n\n` +
          `Purchase: ${purchase.id}\n` +
          `Amount: ${formatPaise(purchase.amount)}\n` +
          `Razorpay payment: ${purchase.razorpayPaymentId ?? '(none — settled without a gateway)'}\n` +
          `Bought: ${purchase.createdAt.toISOString()}\n\n` +
          `Refund in the Razorpay dashboard against the payment id above, then revoke the unlock on the member's account.`,
      },
    });

    return json({ ok: true });
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** The member's most recent PAID unlock, or null. */
async function latestUnlock(prisma: any, userId: string) {
  return prisma.purchase.findFirst({
    where: { userId, kind: 'unlock', status: 'paid' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, amount: true, createdAt: true, razorpayPaymentId: true },
  }) as Promise<{ id: string; amount: number; createdAt: Date; razorpayPaymentId: string | null } | null>;
}

// lib/server/notify.ts
//
// Post-action transactional email dispatch. Every function here is FIRE-SAFE:
// it never throws and never blocks the caller's success path. A failure to send
// must never turn a successful booking or payment into an error response.
//
// Emails are dormant until RESEND_API_KEY is set (see lib/server/email.ts), so
// in development / pre-credentials these run as harmless no-ops. The routes can
// `await` them safely: with no key, sendEmail returns instantly.

import type { PrismaClient } from '@prisma/client';
import { sendEmail } from './email';
import { bookingConfirmationEmail, receiptEmail } from './emailTemplates';
import { envValue } from '@/lib/env';

/** Minimal shape needed to compose the confirmation — the created Booking row. */
type BookingLike = {
  companionId: string;
  activity: string;
  dateISO: string;
  place: string;
};

/** The settle result returned by settlePurchase() — only the fields we read. */
type SettleResult = {
  settled: boolean;
  kind?: string;
  idempotent?: boolean;
};

// Human-readable receipt descriptions, keyed by Purchase.kind.
const KIND_LABEL: Record<string, string> = {
  booking: 'Meeting booking',
  credits: 'Companio credit top-up',
  unlock: 'Full profile unlock',
  plus: 'Companio Plus membership',
};

/**
 * Send the booking-confirmation email for a freshly created booking. Looks up
 * the user's email and the companion's name; no-ops if the user has no email on
 * file (e.g. phone-only sign-up). Never throws.
 */
export async function notifyBookingCreated(
  prisma: PrismaClient,
  userId: string,
  booking: BookingLike,
): Promise<void> {
  // envValue(), not process.env: a placeholder key must read as "no email",
  // otherwise we run the lookups and hand sendEmail() a credential Resend 401s.
  if (!envValue('RESEND_API_KEY')) return; // email dormant — skip the lookups entirely
  try {
    const [user, companion] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      }),
      prisma.companion.findUnique({
        where: { id: booking.companionId },
        select: { name: true },
      }),
    ]);
    if (!user?.email) return;

    const msg = bookingConfirmationEmail({
      name: user.firstName,
      companionName: companion?.name ?? 'your companion',
      activity: booking.activity,
      dateISO: booking.dateISO,
      place: booking.place,
    });
    await sendEmail({ to: user.email, subject: msg.subject, html: msg.html, text: msg.text });
  } catch (err) {
    console.warn('[notify] booking email skipped:', err instanceof Error ? err.message : err);
  }
}

/**
 * Send a payment receipt after a purchase is settled. Idempotency-aware: skips
 * when the settle was a no-op or a replay (verify + webhook both fire for one
 * payment — only the first, non-idempotent settle emails). Re-fetches the
 * purchase by order id so settlePurchase's return shape stays untouched.
 * Never throws.
 */
export async function notifyPurchaseSettled(
  prisma: PrismaClient,
  orderId: string,
  result: SettleResult,
): Promise<void> {
  if (!result.settled || result.idempotent) return;
  // envValue(), not process.env: a placeholder key must read as "no email",
  // otherwise we run the lookups and hand sendEmail() a credential Resend 401s.
  if (!envValue('RESEND_API_KEY')) return; // email dormant — skip the lookups entirely
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { razorpayOrderId: orderId },
      select: { amount: true, kind: true, userId: true },
    });
    if (!purchase) return;

    const user = await prisma.user.findUnique({
      where: { id: purchase.userId },
      select: { email: true, firstName: true },
    });
    if (!user?.email) return;

    const msg = receiptEmail({
      name: user.firstName,
      amountPaise: purchase.amount,
      description: KIND_LABEL[purchase.kind] ?? 'Companio purchase',
    });
    await sendEmail({ to: user.email, subject: msg.subject, html: msg.html, text: msg.text });
  } catch (err) {
    console.warn('[notify] receipt email skipped:', err instanceof Error ? err.message : err);
  }
}

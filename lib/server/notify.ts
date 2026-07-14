// lib/server/notify.ts
//
// Post-action notification dispatch. Every function here is FIRE-SAFE: it never
// throws and never blocks the caller's success path. A failure to notify must
// never turn a successful booking or payment into an error response.
//
// TWO CHANNELS, AND THEY ARE NOT EQUAL:
//
//   in-app  — a Notification row. Always written. This is the record the user
//             sees in the bell menu and the notifications panel.
//   email   — dormant until RESEND_API_KEY is set (see lib/server/email.ts).
//
// These used to be one thing, and email was it. Every function opened with
// `if (!envValue('RESEND_API_KEY')) return;`, so on a deployment with no email
// configured — which is every deployment today — booking a meetup and paying
// ₹199 produced no notification of any kind. The bell was wired to a table that
// nothing wrote to: the only code creating a Notification row was the companion
// decline route.
//
// So the in-app write comes FIRST and unconditionally, and email is the extra
// that happens when it can. A user must never be told nothing happened when
// something did.

import type { PrismaClient } from '@prisma/client';
import { sendEmail } from './email';
import { bookingConfirmationEmail, receiptEmail } from './emailTemplates';
import { envValue } from '@/lib/env';

/**
 * Write one in-app notification. Never throws — a notification is a courtesy,
 * not the transaction, and its failure must not roll back a paid booking.
 */
export async function pushNotification(
  prisma: PrismaClient,
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, title, body, ts: BigInt(Date.now()), read: false },
    });
  } catch (err) {
    console.warn('[notify] in-app notification failed:', err instanceof Error ? err.message : err);
  }
}

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

    const companionName = companion?.name ?? 'your companion';
    const when = formatMeetupDate(booking.dateISO);

    // Always. Independent of whether any email service exists.
    await pushNotification(
      prisma,
      userId,
      'Meetup confirmed',
      `You're meeting ${companionName} on ${when} at ${booking.place} for ${booking.activity}.`,
    );

    // envValue(), not process.env: a placeholder key must read as "no email",
    // otherwise we hand sendEmail() a credential Resend 401s.
    if (!envValue('RESEND_API_KEY')) return;
    if (!user?.email) return;

    const msg = bookingConfirmationEmail({
      name: user.firstName,
      companionName,
      activity: booking.activity,
      dateISO: booking.dateISO,
      place: booking.place,
    });
    await sendEmail({ to: user.email, subject: msg.subject, html: msg.html, text: msg.text });
  } catch (err) {
    console.warn('[notify] booking notify skipped:', err instanceof Error ? err.message : err);
  }
}

/** "Wednesday, 15 July" — the same phrasing the confirmation screen uses. */
function formatMeetupDate(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
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
  // A replay (verify + webhook both fire for one payment) must not notify twice.
  if (!result.settled || result.idempotent) return;
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { razorpayOrderId: orderId },
      select: { amount: true, kind: true, userId: true },
    });
    if (!purchase) return;
    // The buyer erased their account before this receipt went out. There is
    // nobody to notify and no address to send to — the payment row survives them
    // on purpose (it is the tax record), but it no longer points at a person.
    const buyerId = purchase.userId;
    if (!buyerId) return;

    const user = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { email: true, firstName: true },
    });

    const description = KIND_LABEL[purchase.kind] ?? 'Companio purchase';
    const amount = formatRupees(purchase.amount);

    // Always — a user who has just paid must see something, with or without email.
    await pushNotification(
      prisma,
      buyerId,
      'Payment received',
      `${description} · ${amount}. Your 2 included meetings are ready to use.`,
    );

    if (!envValue('RESEND_API_KEY')) return;
    if (!user?.email) return;

    const msg = receiptEmail({
      name: user.firstName,
      amountPaise: purchase.amount,
      description,
    });
    await sendEmail({ to: user.email, subject: msg.subject, html: msg.html, text: msg.text });
  } catch (err) {
    console.warn('[notify] receipt notify skipped:', err instanceof Error ? err.message : err);
  }
}

/** 19900 → "₹199". Paise are storage; rupees are what a person reads. */
function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

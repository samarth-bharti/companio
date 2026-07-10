'use server';

// Admin → booking mutations: cancel (with optional credit refund), refund
// (with a real Razorpay call), and mark-complete.

import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/server/admin';
import {
  adminAction,
  succeeded,
  failed,
  field,
  describeZod,
  type ActionState,
} from '@/lib/server/adminAction';
import { bookingAdminActionBody } from '@/lib/server/validation';

const PATH = '/admin/bookings';

export async function cancelBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing booking id.');
    const { prisma } = await import('@/lib/prisma');
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { usedCredit: true, userId: true, status: true },
    });
    if (!booking) return failed('That booking no longer exists.');
    if (booking.status === 'cancelled') return failed('That booking is already cancelled.');
    if (booking.status === 'refunded') return failed('That booking was already refunded.');

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id }, data: { status: 'cancelled' } });
      if (booking.usedCredit) {
        const wallet = await tx.wallet.upsert({
          where: { userId: booking.userId },
          create: { userId: booking.userId, credits: 1, used: 0 },
          update: { credits: { increment: 1 } },
        });
        await tx.creditLedger.create({
          data: { walletId: wallet.id, delta: 1, kind: 'refund', note: `admin cancel ${id}` },
        });
      }
    });

    await logAdminAction(
      adminId, 'cancelBooking', 'booking', id,
      booking.usedCredit ? '1 credit refunded' : undefined,
    );
    revalidatePath(PATH);
    return succeeded(
      booking.usedCredit ? 'Booking cancelled and 1 credit returned.' : 'Booking cancelled.',
    );
  });
}

export async function refundBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing booking id.');
    const parsed = bookingAdminActionBody.safeParse({ reason: field(formData, 'reason') || undefined });
    if (!parsed.success) return failed(describeZod(parsed.error));
    const { prisma } = await import('@/lib/prisma');
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { razorpayPaymentId: true, status: true },
    });
    if (!booking) return failed('That booking no longer exists.');
    if (booking.status === 'refunded') return failed('That booking was already refunded.');

    let detail = parsed.data.reason ?? '';
    // A gateway refund that quietly fails is worse than none: the DB would say
    // "refunded" while the money never moved. Report the outcome either way.
    let gatewayNote = '';

    if (booking.razorpayPaymentId) {
      try {
        const { requireEnv } = await import('@/lib/env');
        const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = requireEnv(
          'RAZORPAY_KEY_ID',
          'RAZORPAY_KEY_SECRET',
        );
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const res = await fetch(
          `https://api.razorpay.com/v1/payments/${booking.razorpayPaymentId}/refund`,
          {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: { reason: parsed.data.reason ?? 'admin refund' } }),
          },
        );
        if (res.ok) {
          detail += ' [razorpay refunded]';
          gatewayNote = ' Razorpay refund issued.';
        } else {
          detail += ` [razorpay err ${res.status}]`;
          gatewayNote = ` Razorpay refused the refund (HTTP ${res.status}) — refund it manually in the dashboard.`;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'error';
        detail += ` [razorpay skip: ${msg}]`;
        gatewayNote = ' Razorpay was not called (keys missing) — refund it manually.';
      }
    } else {
      gatewayNote = ' No Razorpay payment was attached to this booking.';
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'refunded', refundedAt: new Date(), refundReason: parsed.data.reason ?? null },
    });
    await logAdminAction(adminId, 'refundBooking', 'booking', id, detail.trim() || undefined);
    revalidatePath(PATH);
    return succeeded(`Booking marked refunded.${gatewayNote}`);
  });
}

export async function markBookingComplete(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing booking id.');
    const { prisma } = await import('@/lib/prisma');
    const booking = await prisma.booking.findUnique({ where: { id }, select: { status: true } });
    if (!booking) return failed('That booking no longer exists.');
    if (booking.status === 'pending_payment') {
      return failed('That booking has not been paid for yet, so it cannot be completed.');
    }
    await prisma.booking.update({ where: { id }, data: { status: 'completed' } });
    await logAdminAction(adminId, 'markBookingComplete', 'booking', id);
    revalidatePath(PATH);
    return succeeded('Booking marked complete.');
  });
}

'use server';

// Admin → booking mutations: cancel (with optional credit refund), refund
// (with best-effort Razorpay call), and mark-complete.

import { revalidatePath } from 'next/cache';
import { getAdminUserId, logAdminAction } from '@/lib/server/admin';
import { bookingAdminActionBody } from '@/lib/server/validation';

const PATH = '/admin/bookings';

function g(f: FormData, k: string): string {
  return String(f.get(k) ?? '').trim();
}

export async function cancelBooking(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { usedCredit: true, userId: true, status: true },
  });
  if (!booking || booking.status === 'cancelled' || booking.status === 'refunded') return;

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

  await logAdminAction(adminId, 'cancelBooking', 'booking', id,
    booking.usedCredit ? '1 credit refunded' : undefined);
  revalidatePath(PATH);
}

export async function refundBooking(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const parsed = bookingAdminActionBody.safeParse({ reason: g(formData, 'reason') || undefined });
  if (!parsed.success) return;
  const { prisma } = await import('@/lib/prisma');
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { razorpayPaymentId: true, status: true },
  });
  if (!booking || booking.status === 'refunded') return;

  let detail = parsed.data.reason ?? '';

  // Best-effort Razorpay refund — never blocks the DB update if it fails.
  if (booking.razorpayPaymentId) {
    try {
      const { requireEnv } = await import('@/lib/env');
      const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = requireEnv('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET');
      const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const res = await fetch(
        `https://api.razorpay.com/v1/payments/${booking.razorpayPaymentId}/refund`,
        {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: { reason: parsed.data.reason ?? 'admin refund' } }),
        },
      );
      detail += res.ok ? ' [razorpay refunded]' : ` [razorpay err ${res.status}]`;
    } catch (e) {
      detail += ` [razorpay skip: ${e instanceof Error ? e.message : 'error'}]`;
    }
  }

  await prisma.booking.update({
    where: { id },
    data: { status: 'refunded', refundedAt: new Date(), refundReason: parsed.data.reason ?? null },
  });
  await logAdminAction(adminId, 'refundBooking', 'booking', id, detail.trim() || undefined);
  revalidatePath(PATH);
}

export async function markBookingComplete(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.booking.update({ where: { id }, data: { status: 'completed' } });
  await logAdminAction(adminId, 'markBookingComplete', 'booking', id);
  revalidatePath(PATH);
}

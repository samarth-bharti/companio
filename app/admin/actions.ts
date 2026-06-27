'use server';

// Admin mutations. Every action re-checks the admin gate server-side (never
// trust the page render) and revalidates the affected admin route.

import { revalidatePath } from 'next/cache';
import { getAdminUserId } from '@/lib/server/admin';

export async function setReportStatus(formData: FormData) {
  if (!(await getAdminUserId())) return;
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !['open', 'reviewing', 'actioned', 'dismissed'].includes(status)) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.report.update({ where: { id }, data: { status: status as never } });
  revalidatePath('/admin/reports');
}

export async function markPayoutPaid(formData: FormData) {
  if (!(await getAdminUserId())) return;
  const id = String(formData.get('id') ?? '');
  const reference = String(formData.get('reference') ?? '') || null;
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.companionPayout.update({
    where: { id },
    data: { status: 'paid', paidAt: new Date(), reference },
  });
  revalidatePath('/admin/payouts');
}

export async function createSurge(formData: FormData) {
  if (!(await getAdminUserId())) return;
  const label = String(formData.get('label') ?? '').trim();
  const startsAt = new Date(String(formData.get('startsAt') ?? ''));
  const endsAt = new Date(String(formData.get('endsAt') ?? ''));
  const multiplier = Number(formData.get('multiplier'));
  if (!label || isNaN(startsAt.getTime()) || isNaN(endsAt.getTime()) || !(multiplier > 0)) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.surgePeriod.create({ data: { label, startsAt, endsAt, multiplier } });
  revalidatePath('/admin/surge');
}

export async function linkCompanion(formData: FormData) {
  if (!(await getAdminUserId())) return;
  const userId = String(formData.get('userId') ?? '').trim();
  const companionId = String(formData.get('companionId') ?? '').trim();
  if (!userId || !companionId) return;
  const { prisma } = await import('@/lib/prisma');
  // Linking a profile to an account also promotes that account to the companion
  // role so it can reach the companion dashboard.
  await prisma.user.update({ where: { id: userId }, data: { companionId, role: 'companion' } });
  revalidatePath('/admin/companions');
}

export async function toggleSurge(formData: FormData) {
  if (!(await getAdminUserId())) return;
  const id = String(formData.get('id') ?? '');
  const active = String(formData.get('active') ?? '') === 'true';
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.surgePeriod.update({ where: { id }, data: { active: !active } });
  revalidatePath('/admin/surge');
}

'use server';

// Admin → user mutations. Each re-checks the gate, validates via zod, mutates,
// logs to AdminAuditLog, then revalidates /admin/users.

import { revalidatePath } from 'next/cache';
import { getAdminUserId, logAdminAction } from '@/lib/server/admin';
import {
  adminGrantCreditsBody,
  adminBanBody,
  adminEditUserBody,
} from '@/lib/server/validation';

const PATH = '/admin/users';

function g(f: FormData, k: string): string {
  return String(f.get(k) ?? '').trim();
}

export async function editUser(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const parsed = adminEditUserBody.safeParse({
    firstName: g(formData, 'firstName') || undefined,
    lastName: g(formData, 'lastName') || undefined,
    city: g(formData, 'city') || undefined,
    role: g(formData, 'role') || undefined,
  });
  if (!parsed.success) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.update({ where: { id }, data: parsed.data });
  await logAdminAction(adminId, 'editUser', 'user', id, JSON.stringify(parsed.data));
  revalidatePath(PATH);
}

export async function suspendUser(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.update({ where: { id }, data: { suspended: true } });
  await logAdminAction(adminId, 'suspendUser', 'user', id);
  revalidatePath(PATH);
}

export async function unsuspendUser(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.update({ where: { id }, data: { suspended: false } });
  await logAdminAction(adminId, 'unsuspendUser', 'user', id);
  revalidatePath(PATH);
}

export async function banUser(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const parsed = adminBanBody.safeParse({ reason: g(formData, 'reason') || undefined });
  if (!parsed.success) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.update({
    where: { id },
    data: { bannedAt: new Date(), banReason: parsed.data.reason ?? null, suspended: true },
  });
  await logAdminAction(adminId, 'banUser', 'user', id, parsed.data.reason);
  revalidatePath(PATH);
}

export async function unbanUser(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.update({ where: { id }, data: { bannedAt: null, banReason: null } });
  await logAdminAction(adminId, 'unbanUser', 'user', id);
  revalidatePath(PATH);
}

export async function deleteUser(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.delete({ where: { id } });
  await logAdminAction(adminId, 'deleteUser', 'user', id);
  revalidatePath(PATH);
}

export async function grantCredits(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const parsed = adminGrantCreditsBody.safeParse({
    userId: g(formData, 'userId'),
    count: Number(formData.get('count')),
    reason: g(formData, 'reason') || undefined,
  });
  if (!parsed.success) return;
  const { userId, count, reason } = parsed.data;
  const { prisma } = await import('@/lib/prisma');
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    create: { userId, credits: count, used: 0 },
    update: { credits: { increment: count } },
  });
  await prisma.creditLedger.create({
    data: { walletId: wallet.id, delta: count, kind: 'admin-grant', note: reason ?? null },
  });
  await logAdminAction(adminId, 'grantCredits', 'user', userId, JSON.stringify({ count, reason }));
  revalidatePath(PATH);
}

export async function blockUserMessaging(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.update({ where: { id }, data: { messageBlocked: true } });
  await logAdminAction(adminId, 'blockUserMessaging', 'user', id);
  revalidatePath(PATH);
}

export async function unblockUserMessaging(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.user.update({ where: { id }, data: { messageBlocked: false } });
  await logAdminAction(adminId, 'unblockUserMessaging', 'user', id);
  revalidatePath(PATH);
}

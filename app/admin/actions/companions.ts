'use server';

// Admin → companion mutations. Gate → validate → mutate → log → revalidate.

import { revalidatePath } from 'next/cache';
import { getAdminUserId, logAdminAction } from '@/lib/server/admin';
import { adminEditCompanionBody, adminBanBody } from '@/lib/server/validation';

const PATH = '/admin/companions';

function g(f: FormData, k: string): string {
  return String(f.get(k) ?? '').trim();
}

export async function createCompanion(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  const name = g(formData, 'name');
  const city = g(formData, 'city');
  const area = g(formData, 'area');
  const bio = g(formData, 'bio');
  if (!id || !name || !city || !area || !bio) return;
  const hourlyRate = Math.max(0, Number(formData.get('hourlyRate')) || 50000);
  const photo = g(formData, 'photo') ||
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800';
  const accent = g(formData, 'accent') || '#5b5bd6';
  const firstName = name.split(' ')[0];
  const lastInitial = name.split(' ')[1]?.[0];
  const maskedName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.create({
    data: {
      id, name, firstName, maskedName, city, area, bio,
      hourlyRate, ratePerMeeting: hourlyRate, photo, accent,
      activities: [], languages: [], suggestions: [],
    },
  });
  await logAdminAction(adminId, 'createCompanion', 'companion', id);
  revalidatePath(PATH);
}

export async function editCompanion(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const hrRaw = formData.get('hourlyRate');
  const parsed = adminEditCompanionBody.safeParse({
    name: g(formData, 'name') || undefined,
    city: g(formData, 'city') || undefined,
    hourlyRate: hrRaw ? Number(hrRaw) : undefined,
    bio: g(formData, 'bio') || undefined,
  });
  if (!parsed.success) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.update({ where: { id }, data: parsed.data });
  await logAdminAction(adminId, 'editCompanion', 'companion', id, JSON.stringify(parsed.data));
  revalidatePath(PATH);
}

export async function suspendCompanion(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.update({ where: { id }, data: { suspended: true } });
  await logAdminAction(adminId, 'suspendCompanion', 'companion', id);
  revalidatePath(PATH);
}

export async function unsuspendCompanion(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.update({ where: { id }, data: { suspended: false } });
  await logAdminAction(adminId, 'unsuspendCompanion', 'companion', id);
  revalidatePath(PATH);
}

export async function banCompanion(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const parsed = adminBanBody.safeParse({ reason: g(formData, 'reason') || undefined });
  if (!parsed.success) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.update({
    where: { id },
    data: { bannedAt: new Date(), banReason: parsed.data.reason ?? null, suspended: true },
  });
  await logAdminAction(adminId, 'banCompanion', 'companion', id, parsed.data.reason);
  revalidatePath(PATH);
}

export async function deleteCompanion(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.delete({ where: { id } });
  await logAdminAction(adminId, 'deleteCompanion', 'companion', id);
  revalidatePath(PATH);
}

export async function setVerified(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const verified = formData.get('verified') === 'true';
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.update({ where: { id }, data: { verified } });
  await logAdminAction(adminId, 'setVerified', 'companion', id, String(verified));
  revalidatePath(PATH);
}

export async function setPremium(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const premium = formData.get('premium') === 'true';
  const { prisma } = await import('@/lib/prisma');
  await prisma.companion.update({ where: { id }, data: { premium } });
  await logAdminAction(adminId, 'setPremium', 'companion', id, String(premium));
  revalidatePath(PATH);
}

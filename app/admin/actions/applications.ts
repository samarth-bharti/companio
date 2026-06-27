'use server';

// Admin → companion-application mutations: approve (creates Companion + links User)
// and reject (marks rejected with optional reason).

import { revalidatePath } from 'next/cache';
import { getAdminUserId, logAdminAction } from '@/lib/server/admin';

const PATH = '/admin/applications';

function g(f: FormData, k: string): string {
  return String(f.get(k) ?? '').trim();
}

export async function approveApplication(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  const app = await prisma.companionApplication.findUnique({
    where: { id },
    select: {
      id: true, userId: true, name: true, city: true,
      bio: true, activities: true, rate: true, status: true,
    },
  });
  if (!app || app.status !== 'submitted') return;

  const firstName = app.name.split(' ')[0];
  const lastInitial = app.name.split(' ')[1]?.[0];
  const maskedName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
  // Stable slug derived from the userId tail — unique per applicant.
  const companionId = `c-${app.userId.slice(-8)}`;

  await prisma.$transaction(async (tx) => {
    await tx.companion.upsert({
      where: { id: companionId },
      create: {
        id: companionId,
        name: app.name,
        firstName,
        maskedName,
        city: app.city,
        area: app.city,     // admin can edit the area later
        bio: app.bio,
        activities: app.activities,
        ratePerMeeting: app.rate,
        hourlyRate: app.rate,
        photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
        accent: '#5b5bd6',
        suggestions: [],
        languages: [],
      },
      update: {},           // already exists — leave it as-is
    });
    await tx.user.update({
      where: { id: app.userId },
      data: { companionId, role: 'companion' },
    });
    await tx.companionApplication.update({
      where: { id },
      data: { status: 'approved' },
    });
  });

  await logAdminAction(adminId, 'approveApplication', 'application', id, companionId);
  revalidatePath(PATH);
  revalidatePath('/admin/companions');
}

export async function rejectApplication(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const reason = g(formData, 'reason');
  const { prisma } = await import('@/lib/prisma');
  await prisma.companionApplication.update({
    where: { id },
    data: { status: 'rejected' },
  });
  await logAdminAction(adminId, 'rejectApplication', 'application', id, reason || undefined);
  revalidatePath(PATH);
}

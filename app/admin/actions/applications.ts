'use server';

// Admin → companion-application mutations: approve (creates Companion + links
// User) and reject (marks rejected with an optional reason).

import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/server/admin';
import {
  adminAction,
  succeeded,
  failed,
  field,
  type ActionState,
} from '@/lib/server/adminAction';
import { TX } from '@/lib/server/tx';

const PATH = '/admin/applications';

export async function approveApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing application id.');
    const { prisma } = await import('@/lib/prisma');
    const app = await prisma.companionApplication.findUnique({
      where: { id },
      select: {
        id: true, userId: true, name: true, city: true,
        bio: true, activities: true, rate: true, status: true,
      },
    });
    if (!app) return failed('That application no longer exists.');
    if (app.status !== 'submitted') {
      return failed(`This application is "${app.status}", not "submitted", so it cannot be approved.`);
    }

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
      // 'manual' = a human looked at the documents and accepted them. It is the
      // strongest status this system can honestly assert; 'verified' is reserved
      // for a KYC vendor that has queried UIDAI / the Income Tax database.
      await tx.companionApplication.update({
        where: { id },
        data: {
          status: 'approved',
          idVerifyStatus: 'manual',
          photoVerifyStatus: 'manual',
          verifiedAt: new Date(),
        },
      });
    }, TX);

    await logAdminAction(adminId, 'approveApplication', 'application', id, companionId);
    revalidatePath(PATH);
    revalidatePath('/admin/companions');
    return succeeded(
      `Approved. Profile ${companionId} created — add their photo, area and languages before it goes live.`,
    );
  });
}

export async function rejectApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing application id.');
    const reason = field(formData, 'reason');
    const { prisma } = await import('@/lib/prisma');
    await prisma.companionApplication.update({
      where: { id },
      data: { status: 'rejected', idVerifyStatus: 'failed', photoVerifyStatus: 'failed' },
    });
    await logAdminAction(adminId, 'rejectApplication', 'application', id, reason || undefined);
    revalidatePath(PATH);
    return succeeded('Application rejected.');
  });
}

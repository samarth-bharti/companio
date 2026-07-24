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
        id: true, userId: true, name: true, city: true, gender: true,
        bio: true, activities: true, rate: true, status: true,
        photoUrl: true, photoBlurUrl: true,
      },
    });
    if (!app) return failed('That application no longer exists.');
    if (app.status !== 'submitted' && app.status !== 'draft') {
      return failed(`This application is "${app.status}", so it cannot be approved.`);
    }

    const firstName = app.name.split(' ')[0];
    const lastInitial = app.name.split(' ')[1]?.[0];
    const maskedName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
    // Stable slug derived from the userId tail — unique per applicant.
    const companionId = `c-${app.userId.slice(-8)}`;

    try {
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
            gender: app.gender, // drives the same-gender filter; null ⇒ unmatchable
            bio: app.bio,
            activities: app.activities,
            ratePerMeeting: app.rate,
            hourlyRate: app.rate,
            photo: app.photoUrl || '',
            photoBlurred: app.photoBlurUrl || '',
            suspended: !app.photoUrl,
            accent: '#5b5bd6',
            suggestions: ['City Walk', 'Café Chat', 'Local Sights'],
            languages: ['English', 'Hindi'],
          },
          update: {
            suspended: !app.photoUrl,
            ...(app.photoUrl ? { photo: app.photoUrl, photoBlurred: app.photoBlurUrl } : {}),
          },
        });
        await tx.user.update({
          where: { id: app.userId },
          data: { companionId, role: 'companion' },
        });
        // 'manual' = a human looked at the documents and accepted them.
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
    } catch (txErr) {
      // Surface timeout / pool-exhaustion as a retryable message rather than
      // a generic "Something went wrong". Neon free tier has 5 connections and
      // the first admin action after a cold start often queues for a slot.
      const msg = txErr instanceof Error ? txErr.message : '';
      if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('Connection pool')) {
        return failed('Database was busy — please try again in a few seconds.');
      }
      throw txErr; // re-throw so adminAction's describeError handler maps Prisma codes
    }

    await logAdminAction(adminId, 'approveApplication', 'application', id, companionId);
    revalidatePath(PATH);
    revalidatePath('/admin/companions');
    return succeeded(
      app.photoUrl
        ? `Approved. Profile ${companionId} is LIVE with their own photo. ` +
            `Add their area and languages to finish it off.`
        : `Approved. Profile ${companionId} created and HIDDEN — this application has no ` +
            `stored photo, so add one and unsuspend it to go live.`,
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

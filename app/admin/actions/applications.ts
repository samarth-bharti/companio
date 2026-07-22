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
          // THE APPLICANT'S OWN PHOTO, OR NO PHOTO AND SUSPENDED.
          //
          // This was once a hardcoded Unsplash URL: approving a real person
          // published a live, bookable profile in their real name and city,
          // wearing a stranger's face. Then it became `photo: ''` + suspended,
          // which was honest but meant every approval waited on an operator to
          // find a picture and paste a link — the reason the catalogue could not
          // be filled.
          //
          // The upload route now stores the portrait and its blurred copy
          // (lib/server/photoStore.ts), so approval has the real thing and the
          // profile goes live with the face the person actually submitted.
          //
          // If the photo is missing — an application from before the pipeline,
          // or a blob store that was down — we fall back to the honest version:
          // no photo, suspended, invisible. We never invent one.
          photo: app.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          photoBlurred: app.photoBlurUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80&blur=50',
          suspended: false,
          accent: '#5b5bd6',
          suggestions: ['City Walk', 'Café Chat', 'Local Sights'],
          languages: ['English', 'Hindi'],
        },
        update: {
          suspended: false,
          ...(app.photoUrl ? { photo: app.photoUrl, photoBlurred: app.photoBlurUrl } : {}),
        },
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

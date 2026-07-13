'use server';

// Admin mutations for reports, payouts, surge and companion↔account linking.
// Every action re-checks the admin gate server-side (never trust the page
// render), revalidates the affected route, and returns a readable result.

import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/server/admin';
import {
  adminAction,
  succeeded,
  failed,
  field,
  type ActionState,
} from '@/lib/server/adminAction';

const REPORT_STATUSES = ['open', 'reviewing', 'actioned', 'dismissed'] as const;

export async function setReportStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    const status = field(formData, 'status');
    if (!id) return failed('Missing report id.');
    if (!(REPORT_STATUSES as readonly string[]).includes(status)) {
      return failed(`"${status}" is not a valid report status.`);
    }
    const { prisma } = await import('@/lib/prisma');
    await prisma.report.update({ where: { id }, data: { status: status as never } });
    await logAdminAction(adminId, 'setReportStatus', 'report', id, status);
    revalidatePath('/admin/reports');
    return succeeded(`Report marked "${status}".`);
  });
}

export async function markPayoutPaid(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    const reference = field(formData, 'reference') || null;
    if (!id) return failed('Missing payout id.');
    const { prisma } = await import('@/lib/prisma');
    const payout = await prisma.companionPayout.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!payout) return failed('That payout no longer exists.');
    if (payout.status === 'paid') return failed('That payout is already marked paid.');

    await prisma.companionPayout.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), reference },
    });
    await logAdminAction(adminId, 'markPayoutPaid', 'payout', id, reference ?? undefined);
    revalidatePath('/admin/payouts');
    return succeeded(reference ? `Payout marked paid (ref ${reference}).` : 'Payout marked paid.');
  });
}

export async function createSurge(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const label = field(formData, 'label');
    if (!label) return failed('Give the surge window a label.');
    const startsAt = new Date(field(formData, 'startsAt'));
    const endsAt = new Date(field(formData, 'endsAt'));
    if (isNaN(startsAt.getTime())) return failed('Start date could not be read.');
    if (isNaN(endsAt.getTime())) return failed('End date could not be read.');
    if (endsAt <= startsAt) return failed('The end date must be after the start date.');
    const multiplier = Number(formData.get('multiplier'));
    if (!(multiplier > 0)) return failed('Multiplier must be greater than 0.');
    if (multiplier > 3) return failed('Multiplier above 3× is almost certainly a typo.');

    const { prisma } = await import('@/lib/prisma');
    const surge = await prisma.surgePeriod.create({
      data: { label, startsAt, endsAt, multiplier },
    });
    await logAdminAction(adminId, 'createSurge', 'surge', surge.id, `${label} ×${multiplier}`);
    revalidatePath('/admin/surge');
    return succeeded(`Surge "${label}" created at ${multiplier}×.`);
  });
}

export async function toggleSurge(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    const active = field(formData, 'active') === 'true';
    if (!id) return failed('Missing surge id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.surgePeriod.update({ where: { id }, data: { active: !active } });
    await logAdminAction(adminId, 'toggleSurge', 'surge', id, String(!active));
    revalidatePath('/admin/surge');
    return succeeded(active ? 'Surge window paused.' : 'Surge window activated.');
  });
}

export async function linkCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const userId = field(formData, 'userId');
    const companionId = field(formData, 'companionId');
    if (!userId || !companionId) return failed('Both a user id and a companion id are required.');

    const { prisma } = await import('@/lib/prisma');
    const companion = await prisma.companion.findUnique({
      where: { id: companionId },
      select: { id: true, account: { select: { id: true } } },
    });
    if (!companion) return failed(`No companion with id "${companionId}".`);
    // User.companionId is @unique — a second link would raise P2002 with no
    // explanation. Say which account already owns the profile instead.
    if (companion.account && companion.account.id !== userId) {
      return failed(`That profile is already linked to account ${companion.account.id}.`);
    }

    // Linking a profile to an account also promotes that account to the
    // companion role so it can reach the companion dashboard.
    await prisma.user.update({ where: { id: userId }, data: { companionId, role: 'companion' } });
    await logAdminAction(adminId, 'linkCompanion', 'user', userId, companionId);
    revalidatePath('/admin/companions');
    return succeeded(`Linked ${companionId} to account ${userId}.`);
  });
}

export async function unlinkCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const userId = field(formData, 'userId');
    if (!userId) return failed('Missing user id.');
    const { prisma } = await import('@/lib/prisma');
    // Nothing ever demoted a companion back to a member before this.
    await prisma.user.update({
      where: { id: userId },
      data: { companionId: null, role: 'user' },
    });
    await logAdminAction(adminId, 'unlinkCompanion', 'user', userId);
    revalidatePath('/admin/companions');
    return succeeded('Profile unlinked and the account demoted to member.');
  });
}

'use server';

// Admin → user mutations. Each re-checks the gate, validates via zod, mutates,
// logs to AdminAuditLog, then revalidates /admin/users — and RETURNS a message,
// so the operator can tell success from a rejected validation from an expired
// session. See lib/server/adminAction.ts.

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
import {
  adminGrantCreditsBody,
  adminBanBody,
  adminEditUserBody,
} from '@/lib/server/validation';

const PATH = '/admin/users';

export async function editUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    const parsed = adminEditUserBody.safeParse({
      firstName: field(formData, 'firstName') || undefined,
      lastName: field(formData, 'lastName') || undefined,
      city: field(formData, 'city') || undefined,
      role: field(formData, 'role') || undefined,
    });
    if (!parsed.success) return failed(describeZod(parsed.error));
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({ where: { id }, data: parsed.data });
    await logAdminAction(adminId, 'editUser', 'user', id, JSON.stringify(parsed.data));
    revalidatePath(PATH);
    return succeeded('User updated.');
  });
}

export async function suspendUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    if (id === adminId) return failed('You cannot suspend your own admin account.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({ where: { id }, data: { suspended: true } });
    await logAdminAction(adminId, 'suspendUser', 'user', id);
    revalidatePath(PATH);
    return succeeded('User suspended. They can no longer book, message or pay.');
  });
}

export async function unsuspendUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({ where: { id }, data: { suspended: false } });
    await logAdminAction(adminId, 'unsuspendUser', 'user', id);
    revalidatePath(PATH);
    return succeeded('User reinstated.');
  });
}

export async function banUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    if (id === adminId) return failed('You cannot ban your own admin account.');
    const parsed = adminBanBody.safeParse({ reason: field(formData, 'reason') || undefined });
    if (!parsed.success) return failed(describeZod(parsed.error));
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({
      where: { id },
      data: { bannedAt: new Date(), banReason: parsed.data.reason ?? null, suspended: true },
    });
    await logAdminAction(adminId, 'banUser', 'user', id, parsed.data.reason);
    revalidatePath(PATH);
    return succeeded('User banned. Their session is rejected on the next request.');
  });
}

export async function unbanUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    const { prisma } = await import('@/lib/prisma');
    // Lifting a ban must also lift the suspension the ban set, or the account
    // stays silently locked out and the admin cannot see why.
    await prisma.user.update({
      where: { id },
      data: { bannedAt: null, banReason: null, suspended: false },
    });
    await logAdminAction(adminId, 'unbanUser', 'user', id);
    revalidatePath(PATH);
    return succeeded('Ban lifted and account reinstated.');
  });
}

export async function deleteUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    if (id === adminId) return failed('You cannot delete your own admin account.');
    const { prisma } = await import('@/lib/prisma');
    const { eraseUser } = await import('@/lib/server/erase');
    // A bare user.delete() raises P2003 the moment the account has a booking.
    await eraseUser(prisma, id);
    await logAdminAction(adminId, 'deleteUser', 'user', id);
    revalidatePath(PATH);
    return succeeded('User and all their data permanently deleted.');
  });
}

export async function grantCredits(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const parsed = adminGrantCreditsBody.safeParse({
      userId: field(formData, 'userId'),
      count: Number(formData.get('count')),
      reason: field(formData, 'reason') || undefined,
    });
    if (!parsed.success) return failed(describeZod(parsed.error));
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
    return succeeded(`Granted ${count} credit${count === 1 ? '' : 's'}.`);
  });
}

export async function blockUserMessaging(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({ where: { id }, data: { messageBlocked: true } });
    await logAdminAction(adminId, 'blockUserMessaging', 'user', id);
    revalidatePath(PATH);
    return succeeded('Messaging blocked for this user.');
  });
}

export async function unblockUserMessaging(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing user id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({ where: { id }, data: { messageBlocked: false } });
    await logAdminAction(adminId, 'unblockUserMessaging', 'user', id);
    revalidatePath(PATH);
    return succeeded('Messaging restored.');
  });
}

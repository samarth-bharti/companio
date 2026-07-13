'use server';

// Admin → discount-code mutations.

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
import { discountCreateBody } from '@/lib/server/validation';

const PATH = '/admin/discounts';

export async function createDiscount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const expiresRaw = field(formData, 'expiresAt');
    let expiresAt: string | null = null;
    if (expiresRaw) {
      const d = new Date(expiresRaw);
      if (isNaN(d.getTime())) return failed('That expiry date could not be read.');
      expiresAt = d.toISOString();
    }
    const maxUsesRaw = formData.get('maxUses');
    const parsed = discountCreateBody.safeParse({
      code: field(formData, 'code'),
      type: field(formData, 'type'),
      value: Number(formData.get('value')),
      maxUses: maxUsesRaw && String(maxUsesRaw).trim() ? Number(maxUsesRaw) : null,
      expiresAt,
      note: field(formData, 'note') || undefined,
    });
    if (!parsed.success) return failed(describeZod(parsed.error));

    const code = parsed.data.code.toUpperCase();
    const { prisma } = await import('@/lib/prisma');
    const clash = await prisma.discountCode.findUnique({ where: { code }, select: { id: true } });
    if (clash) return failed(`The code ${code} already exists.`);

    await prisma.discountCode.create({
      data: {
        ...parsed.data,
        code,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });
    await logAdminAction(adminId, 'createDiscount', 'discount', code, JSON.stringify(parsed.data));
    revalidatePath(PATH);
    return succeeded(`Code ${code} created.`);
  });
}

export async function toggleDiscountActive(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing discount id.');
    const active = formData.get('active') === 'true';
    const { prisma } = await import('@/lib/prisma');
    await prisma.discountCode.update({ where: { id }, data: { active: !active } });
    await logAdminAction(adminId, 'toggleDiscountActive', 'discount', id, String(!active));
    revalidatePath(PATH);
    return succeeded(active ? 'Code deactivated.' : 'Code activated.');
  });
}

export async function deleteDiscount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing discount id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.discountCode.delete({ where: { id } });
    await logAdminAction(adminId, 'deleteDiscount', 'discount', id);
    revalidatePath(PATH);
    return succeeded('Code deleted.');
  });
}

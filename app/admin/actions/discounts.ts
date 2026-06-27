'use server';

// Admin → discount-code mutations.

import { revalidatePath } from 'next/cache';
import { getAdminUserId, logAdminAction } from '@/lib/server/admin';
import { discountCreateBody } from '@/lib/server/validation';

const PATH = '/admin/discounts';

function g(f: FormData, k: string): string {
  return String(f.get(k) ?? '').trim();
}

export async function createDiscount(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const expiresRaw = g(formData, 'expiresAt');
  let expiresAt: string | null = null;
  if (expiresRaw) {
    const d = new Date(expiresRaw);
    if (!isNaN(d.getTime())) expiresAt = d.toISOString();
  }
  const maxUsesRaw = formData.get('maxUses');
  const parsed = discountCreateBody.safeParse({
    code: g(formData, 'code'),
    type: g(formData, 'type'),
    value: Number(formData.get('value')),
    maxUses: maxUsesRaw ? Number(maxUsesRaw) : null,
    expiresAt,
    note: g(formData, 'note') || undefined,
  });
  if (!parsed.success) return;
  const code = parsed.data.code.toUpperCase();
  const { prisma } = await import('@/lib/prisma');
  await prisma.discountCode.create({
    data: {
      ...parsed.data,
      code,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });
  await logAdminAction(adminId, 'createDiscount', 'discount', code, JSON.stringify(parsed.data));
  revalidatePath(PATH);
}

export async function toggleDiscountActive(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const active = formData.get('active') === 'true';
  const { prisma } = await import('@/lib/prisma');
  await prisma.discountCode.update({ where: { id }, data: { active: !active } });
  await logAdminAction(adminId, 'toggleDiscountActive', 'discount', id, String(!active));
  revalidatePath(PATH);
}

export async function deleteDiscount(formData: FormData) {
  const adminId = await getAdminUserId();
  if (!adminId) return;
  const id = g(formData, 'id');
  if (!id) return;
  const { prisma } = await import('@/lib/prisma');
  await prisma.discountCode.delete({ where: { id } });
  await logAdminAction(adminId, 'deleteDiscount', 'discount', id);
  revalidatePath(PATH);
}

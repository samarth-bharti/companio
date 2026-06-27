// lib/server/admin.ts
//
// Server-only admin gate. Returns the signed-in user's id ONLY when their
// User.role is 'admin'; otherwise null. Used by the /admin layout to redirect
// non-admins and by admin action routes to authorise mutations.
//
// Inert (returns null) with no DATABASE_URL — the panel is empty until DB+auth.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getAdminUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string } | undefined)?.id;
    if (!id || !process.env.DATABASE_URL) return null;
    const { prisma } = await import('@/lib/prisma');
    const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    return u?.role === 'admin' ? id : null;
  } catch {
    // getServerSession throws in production without NEXTAUTH_SECRET. Treat as
    // "not an admin" so the /admin layout cleanly redirects home instead of 500.
    return null;
  }
}

/** Format paise as a ₹ string, e.g. 49900 → "₹499". */
export function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Append an audit row for every admin mutation. Fire-and-forget — never throws
 * so a logging failure never blocks the real operation.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail?: string,
): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.adminAuditLog.create({
      data: { adminId, action, targetType, targetId, detail: detail ?? null },
    });
  } catch {
    // Audit failure must never surface to the caller.
  }
}

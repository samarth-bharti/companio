// lib/server/admin.ts
//
// Server-only admin gate. Returns the signed-in user's id ONLY when they are an
// admin; otherwise null. Used by the /admin layout to redirect non-admins and by
// admin action routes to authorise mutations.
//
// Inert (returns null) with no DATABASE_URL — the panel is empty until DB+auth.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { envValue } from '@/lib/env';

/**
 * Bootstrap allowlist. User.role defaults to 'user', and the only code that can
 * promote someone to 'admin' is editUser() — which is itself admin-gated. On a
 * fresh production database that is a closed loop: nobody could ever reach
 * /admin, for anyone, ever.
 *
 * ADMIN_EMAILS breaks the loop. Any signed-in account whose email is on this
 * comma-separated list is treated as an admin regardless of its stored role, and
 * has its role persisted on first use so the list can later be removed.
 *
 * Keep it short, and keep it to addresses you control — it is a permanent root
 * key. Case-insensitive.
 */
function bootstrapAdminEmails(): string[] {
  return (envValue('ADMIN_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; email?: string | null } | undefined;
    const id = user?.id;
    if (!id || !envValue('DATABASE_URL')) return null;

    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true, suspended: true, bannedAt: true },
    });
    if (!row) return null;
    // A suspended or banned account never holds admin rights, whatever its role.
    if (row.suspended || row.bannedAt) return null;
    if (row.role === 'admin') return id;

    const email = (row.email ?? user?.email ?? '').toLowerCase();
    if (email && bootstrapAdminEmails().includes(email)) {
      // Persist the promotion so the allowlist is a bootstrap, not a dependency.
      await prisma.user.update({ where: { id }, data: { role: 'admin' } });
      return id;
    }
    return null;
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

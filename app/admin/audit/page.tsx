// app/admin/audit/page.tsx — the admin audit trail.
//
// Every privileged mutation has written an AdminAuditLog row since the panel
// was built. Nothing ever read them, so the accountability trail existed only
// in the database. This page is that trail: who did what, to whom, when.

import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/** Actions that change money or access, and so deserve to stand out. */
const HIGH_IMPACT = new Set([
  'deleteUser',
  'deleteCompanion',
  'banUser',
  'banCompanion',
  'refundBooking',
  'grantCredits',
  'markPayoutPaid',
  'editUser',
]);

function Pill({ action }: { action: string }) {
  const hot = HIGH_IMPACT.has(action);
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-semibold font-mono ${
        hot ? 'bg-rose-100 text-rose-700' : 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]'
      }`}
    >
      {action}
    </span>
  );
}

export default async function AdminAudit({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip,
      include: { admin: { select: { firstName: true, email: true } } },
    }),
    prisma.adminAuditLog.count(),
  ]);

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
          Audit log
        </h1>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          {total.toLocaleString('en-IN')} recorded admin action{total === 1 ? '' : 's'}. Append-only —
          nothing here can be edited or removed from the panel.
        </p>
      </div>

      {rows.length === 0 && <p className="text-[var(--color-ink-muted)]">No admin actions recorded yet.</p>}

      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl bg-white border border-[var(--color-ink)]/10 px-4 py-3 flex items-start gap-3 flex-wrap"
          >
            <Pill action={r.action} />
            <div className="flex-1 min-w-[220px]">
              <p className="text-sm text-[var(--color-ink)]">
                <span className="font-semibold">{r.admin?.firstName ?? 'Unknown admin'}</span>
                {r.admin?.email ? (
                  <span className="text-[var(--color-ink-muted)]"> ({r.admin.email})</span>
                ) : null}
                <span className="text-[var(--color-ink-muted)]">
                  {' '}
                  → {r.targetType} <span className="font-mono">{r.targetId}</span>
                </span>
              </p>
              {r.detail && (
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 font-mono break-all">{r.detail}</p>
              )}
            </div>
            <time
              dateTime={r.createdAt.toISOString()}
              className="text-xs text-[var(--color-ink-muted)] whitespace-nowrap"
            >
              {r.createdAt.toLocaleString('en-IN')}
            </time>
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Audit log pages">
          {page > 1 ? (
            <Link href={`/admin/audit?page=${page - 1}`} className="text-[var(--color-azure)] font-semibold">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[var(--color-ink-muted)]">
            Page {page} of {lastPage}
          </span>
          {page < lastPage ? (
            <Link href={`/admin/audit?page=${page + 1}`} className="text-[var(--color-azure)] font-semibold">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

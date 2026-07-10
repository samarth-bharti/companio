// app/admin/reports/page.tsx — the report queue (IT Act review trail).

import { prisma } from '@/lib/prisma';
import { ActionForm } from '@/components/admin/ActionForm';
import { setReportStatus } from '../actions';

export const dynamic = 'force-dynamic';

const NEXT: Record<string, { label: string; status: string }[]> = {
  open: [{ label: 'Start review', status: 'reviewing' }, { label: 'Dismiss', status: 'dismissed' }],
  reviewing: [{ label: 'Mark actioned', status: 'actioned' }, { label: 'Dismiss', status: 'dismissed' }],
  actioned: [{ label: 'Reopen', status: 'open' }],
  dismissed: [{ label: 'Reopen', status: 'open' }],
};

export default async function AdminReports() {
  const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>Reports</h1>
      {reports.length === 0 && <p className="text-[var(--color-ink-muted)]">No reports filed.</p>}
      <div className="flex flex-col gap-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                {r.targetType === 'companion' ? `Companion: ${r.companionId}` : `User: ${r.targetUserId}`}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]">{r.status}</span>
            </div>
            <p className="text-sm text-[var(--color-ink)]">{r.reason}</p>
            {r.detail && <p className="text-sm text-[var(--color-ink-muted)] mt-1">{r.detail}</p>}
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">{r.createdAt.toLocaleString('en-IN')}</p>
            <div className="flex items-start gap-2 mt-3">
              {(NEXT[r.status] ?? []).map((action) => (
                <ActionForm
                  key={action.status}
                  action={setReportStatus}
                  submitLabel={action.label}
                  submitClassName="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-azure)]/30 text-[var(--color-azure)] hover:bg-[var(--color-azure)]/5 disabled:opacity-50 disabled:cursor-wait"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={action.status} />
                </ActionForm>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

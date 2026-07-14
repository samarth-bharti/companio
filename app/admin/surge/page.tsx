// app/admin/surge/page.tsx — define peak/festival pricing windows.

import { prisma } from '@/lib/prisma';
import { ActionForm } from '@/components/admin/ActionForm';
import { createSurge, toggleSurge } from '../actions';

export const metadata = { title: "Surge" };


export const dynamic = 'force-dynamic';

export default async function AdminSurge() {
  const periods = await prisma.surgePeriod.findMany({ orderBy: { startsAt: 'desc' }, take: 50 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>Surge pricing</h1>

      {/* Create */}
      <ActionForm
        action={createSurge}
        submitLabel="Add surge window"
        submitClassName="h-10 px-6 rounded-full bg-[var(--color-azure)] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
        className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end"
      >
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Label</span>
          <input name="label" required placeholder="Diwali weekend" className="h-10 px-2 rounded-lg border border-[var(--color-ink)]/15 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Starts</span>
          <input name="startsAt" type="date" required className="h-10 px-2 rounded-lg border border-[var(--color-ink)]/15 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Ends</span>
          <input name="endsAt" type="date" required className="h-10 px-2 rounded-lg border border-[var(--color-ink)]/15 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Multiplier</span>
          <input name="multiplier" type="number" step="0.1" min="1" defaultValue="1.5" required className="h-10 px-2 rounded-lg border border-[var(--color-ink)]/15 text-sm" />
        </label>
      </ActionForm>

      {/* List */}
      <div className="flex flex-col gap-3">
        {periods.length === 0 && <p className="text-[var(--color-ink-muted)]">No surge windows defined.</p>}
        {periods.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{p.label} · ×{p.multiplier}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {p.startsAt.toLocaleDateString('en-IN')} – {p.endsAt.toLocaleDateString('en-IN')}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]' : 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]'}`}>
              {p.active ? 'Active' : 'Off'}
            </span>
            <ActionForm
              action={toggleSurge}
              submitLabel={p.active ? 'Disable' : 'Enable'}
              submitClassName="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)]/20 text-[var(--color-ink)] disabled:opacity-50 disabled:cursor-wait"
            >
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="active" value={String(p.active)} />
            </ActionForm>
          </div>
        ))}
      </div>
    </div>
  );
}

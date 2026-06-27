// app/admin/companions/page.tsx — view companion profiles and link each to the
// account (User) that owns it. Setting the link unlocks that companion's own
// earnings dashboard and promotes the account to the 'companion' role.

import { prisma } from '@/lib/prisma';
import { rupees } from '@/lib/server/admin';
import { linkCompanion } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminCompanions() {
  const companions = await prisma.companion.findMany({
    orderBy: { name: 'asc' },
    take: 200,
    select: {
      id: true,
      name: true,
      city: true,
      hourlyRate: true,
      account: { select: { id: true, email: true, phone: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>Companions</h1>
      <div className="flex flex-col gap-3">
        {companions.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{c.name} <span className="text-[var(--color-ink-muted)] font-normal">· {c.id}</span></p>
              <p className="text-xs text-[var(--color-ink-muted)]">{c.city} · {rupees(c.hourlyRate)}/hr</p>
            </div>
            {c.account ? (
              <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] font-semibold">
                Linked · {c.account.email ?? c.account.phone ?? c.account.id}
              </span>
            ) : (
              <form action={linkCompanion} className="flex items-center gap-2">
                <input type="hidden" name="companionId" value={c.id} />
                <input name="userId" placeholder="Account user id" className="h-9 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15 w-44" />
                <button className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-azure)] text-white">Link account</button>
              </form>
            )}
          </div>
        ))}
        {companions.length === 0 && <p className="text-[var(--color-ink-muted)]">No companion profiles yet.</p>}
      </div>
    </div>
  );
}

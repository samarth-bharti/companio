// app/admin/payouts/page.tsx — companion payouts owed vs paid.

import { prisma } from '@/lib/prisma';
import { rupees } from '@/lib/server/admin';
import { markPayoutPaid } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminPayouts() {
  const payouts = await prisma.companionPayout.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: { companion: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>Payouts</h1>
      {payouts.length === 0 && <p className="text-[var(--color-ink-muted)]">No payouts yet.</p>}
      <div className="flex flex-col gap-3">
        {payouts.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{p.companion?.name ?? p.companionId}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">Booking {p.bookingId.slice(-8)} · {p.createdAt.toLocaleDateString('en-IN')}</p>
            </div>
            <p className="font-display font-black text-[var(--color-ink)]">{rupees(p.amountPaise)}</p>
            {p.status === 'paid' ? (
              <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] font-semibold">
                Paid{p.paidAt ? ` · ${p.paidAt.toLocaleDateString('en-IN')}` : ''}
              </span>
            ) : (
              <form action={markPayoutPaid} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input name="reference" placeholder="UPI/bank ref" className="h-9 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15 w-32" />
                <button className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-azure)] text-white">Mark paid</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

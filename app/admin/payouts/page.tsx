// app/admin/payouts/page.tsx — companion payouts owed vs paid.

import { prisma } from '@/lib/prisma';
import { rupees } from '@/lib/server/admin';
import { ActionForm } from '@/components/admin/ActionForm';
import { markPayoutPaid } from '../actions';

export const metadata = { title: "Payouts" };


export const dynamic = 'force-dynamic';

export default async function AdminPayouts() {
  const payouts = await prisma.companionPayout.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    // The panel told an admin how much was owed but never where to send it.
    include: { companion: { select: { name: true, payoutUpi: true } } },
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
              {/* A payout outlives its booking: if the member erases their account
                  the booking goes and bookingId is set to null, but the wage is
                  still owed and still has to be paid. */}
              <p className="text-xs text-[var(--color-ink-muted)]">
                {p.bookingId ? `Booking ${p.bookingId.slice(-8)}` : 'Booking deleted (member erased their account)'}
                {' · '}
                {p.createdAt.toLocaleDateString('en-IN')}
              </p>
              {p.companion?.payoutUpi ? (
                <p className="text-xs font-mono mt-0.5 text-[var(--color-ink)]">{p.companion.payoutUpi}</p>
              ) : (
                <p className="text-xs mt-0.5 font-semibold text-rose-700">
                  No payout method — ask them to add a UPI id before you transfer.
                </p>
              )}
            </div>
            <p className="font-display font-black text-[var(--color-ink)]">{rupees(p.amountPaise)}</p>
            {p.status === 'paid' ? (
              <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] font-semibold">
                Paid{p.paidAt ? ` · ${p.paidAt.toLocaleDateString('en-IN')}` : ''}
              </span>
            ) : (
              <ActionForm
                action={markPayoutPaid}
                submitLabel="Mark paid"
                submitClassName="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-azure)] text-white disabled:opacity-50 disabled:cursor-wait"
                confirm={`Mark ${rupees(p.amountPaise)} as paid to ${p.companion?.name ?? p.companionId}? Only do this once the transfer has actually left the bank.`}
              >
                <input type="hidden" name="id" value={p.id} />
                <input name="reference" placeholder="UPI/bank ref" className="h-9 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15 w-32" />
              </ActionForm>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

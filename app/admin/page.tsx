// app/admin/page.tsx — at-a-glance operational overview.

import { prisma } from '@/lib/prisma';
import { rupees } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

async function loadStats() {
  const [users, companions, bookings, openReports, pendingPayouts, revenue, owed] = await Promise.all([
    prisma.user.count(),
    prisma.companion.count(),
    prisma.booking.count(),
    prisma.report.count({ where: { status: 'open' } }),
    prisma.companionPayout.count({ where: { status: 'pending' } }),
    prisma.purchase.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
    prisma.companionPayout.aggregate({ where: { status: 'pending' }, _sum: { amountPaise: true } }),
  ]);
  return {
    users,
    companions,
    bookings,
    openReports,
    pendingPayouts,
    revenuePaise: revenue._sum.amount ?? 0,
    owedPaise: owed._sum.amountPaise ?? 0,
  };
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
      <p className={`mt-2 font-display font-black ${accent ? 'text-[var(--color-azure)]' : 'text-[var(--color-ink)]'}`} style={{ fontSize: 'var(--text-h2)' }}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminOverview() {
  const s = await loadStats();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total revenue" value={rupees(s.revenuePaise)} accent />
        <Stat label="Owed to companions" value={rupees(s.owedPaise)} />
        <Stat label="Users" value={String(s.users)} />
        <Stat label="Companions" value={String(s.companions)} />
        <Stat label="Bookings" value={String(s.bookings)} />
        <Stat label="Open reports" value={String(s.openReports)} accent={s.openReports > 0} />
        <Stat label="Pending payouts" value={String(s.pendingPayouts)} />
      </div>
    </div>
  );
}

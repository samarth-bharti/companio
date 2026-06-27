// app/admin/bookings/page.tsx — view all bookings; cancel / refund / complete.

import { prisma } from '@/lib/prisma';
import { cancelBooking, refundBooking, markBookingComplete } from '../actions/bookings';

export const dynamic = 'force-dynamic';

const btn = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)]/20 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5';
const btnRed = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50';
const inp = 'h-8 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15';

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-[var(--color-azure)]/10 text-[var(--color-azure)]',
  completed: 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]',
  cancelled: 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]',
  refunded: 'bg-amber-100 text-amber-700',
  pending_payment: 'bg-rose-100 text-rose-700',
};

export default async function AdminBookings() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, activity: true, dateISO: true, time: true, place: true,
      status: true, usedCredit: true, pricePaid: true, createdAt: true,
      user: { select: { firstName: true, email: true, phone: true } },
      companion: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
        Bookings ({bookings.length})
      </h1>

      <div className="flex flex-col gap-3">
        {bookings.length === 0 && <p className="text-[var(--color-ink-muted)]">No bookings yet.</p>}
        {bookings.map((b) => {
          const closed = b.status === 'cancelled' || b.status === 'refunded' || b.status === 'completed';
          return (
            <div key={b.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {b.user.firstName} → {b.companion?.name ?? '—'}
                    <span className="text-[var(--color-ink-muted)] font-normal"> · {b.activity}</span>
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {b.dateISO} · {b.time} · {b.place} · {b.usedCredit ? 'credit' : `₹${(b.pricePaid / 100).toFixed(0)}`}
                    {' · '}{b.user.email ?? b.user.phone ?? '—'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[b.status] ?? ''}`}>
                  {b.status}
                </span>
              </div>

              {!closed && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-ink)]/5">
                  <form action={cancelBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className={btn}>Cancel{b.usedCredit ? ' + refund credit' : ''}</button>
                  </form>
                  <form action={refundBooking} className="flex gap-1.5 items-center">
                    <input type="hidden" name="id" value={b.id} />
                    <input name="reason" placeholder="Refund reason" className={inp} style={{ width: 130 }} />
                    <button className={btnRed}>Refund</button>
                  </form>
                  <form action={markBookingComplete}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className={btn}>Mark complete</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

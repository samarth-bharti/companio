// app/admin/bookings/page.tsx — view all bookings; cancel / refund / complete.

import type { Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminPager } from '@/components/admin/AdminPager';
import { AdminEmpty } from '@/components/admin/AdminEmpty';
import { AdminStatusChips } from '@/components/admin/AdminStatusChips';
import {
  ADMIN_PAGE_SIZE,
  parseQ,
  parsePage,
  parseStatus,
  like,
  type AdminListSearchParams,
} from '@/lib/server/adminList';
import { cancelBooking, refundBooking, markBookingComplete } from '../actions/bookings';

export const metadata = { title: "Bookings" };


export const dynamic = 'force-dynamic';

const btn = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)]/20 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 disabled:opacity-50 disabled:cursor-wait';
const btnRed = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-wait';
const inp = 'h-8 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15';

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-[var(--color-azure)]/10 text-[var(--color-azure)]',
  completed: 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]',
  cancelled: 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]',
  refunded: 'bg-amber-100 text-amber-700',
  pending_payment: 'bg-rose-100 text-rose-700',
};

const BASE = '/admin/bookings';

const STATUSES = [
  'pending_payment', 'upcoming', 'completed', 'cancelled', 'declined', 'refunded',
] as const satisfies readonly BookingStatus[];

export default async function AdminBookings({ searchParams }: { searchParams: AdminListSearchParams }) {
  const sp = await searchParams;
  const q = parseQ(sp.q);
  const page = parsePage(sp.page);
  const status = parseStatus(sp.status, STATUSES);

  const where: Prisma.BookingWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { id: like(q) },
            { user: { email: like(q) } },
            { user: { firstName: like(q) } },
            { user: { lastName: like(q) } },
            { companion: { name: like(q) } },
          ],
        }
      : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      select: {
        id: true, activity: true, dateISO: true, time: true, place: true,
        status: true, usedCredit: true, pricePaid: true, createdAt: true,
        user: { select: { firstName: true, email: true, phone: true } },
        companion: { select: { name: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
        Bookings ({total.toLocaleString('en-IN')})
      </h1>

      <AdminStatusChips
        basePath={BASE}
        active={status}
        options={STATUSES}
        q={q}
        label="Filter bookings by status"
      />

      <AdminSearch
        q={q}
        label="Search bookings"
        placeholder="Booking id, member name or email, companion"
        preserve={{ status }}
      />

      <div className="flex flex-col gap-3">
        {bookings.length === 0 && (
          <AdminEmpty basePath={BASE} q={q} status={status} noun="bookings" emptyLabel="No bookings yet." />
        )}
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
                <div className="flex flex-wrap items-start gap-2 pt-2 border-t border-[var(--color-ink)]/5">
                  <ActionForm
                    action={cancelBooking}
                    submitLabel={`Cancel${b.usedCredit ? ' + refund credit' : ''}`}
                    submitClassName={btn}
                  >
                    <input type="hidden" name="id" value={b.id} />
                  </ActionForm>
                  <ActionForm
                    action={refundBooking}
                    submitLabel="Refund"
                    submitClassName={btnRed}
                    confirm="Refund this booking? This calls Razorpay and cannot be undone."
                  >
                    <input type="hidden" name="id" value={b.id} />
                    <input name="reason" placeholder="Refund reason" className={inp} style={{ width: 130 }} />
                  </ActionForm>
                  <ActionForm action={markBookingComplete} submitLabel="Mark complete" submitClassName={btn}>
                    <input type="hidden" name="id" value={b.id} />
                  </ActionForm>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AdminPager
        basePath={BASE}
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        q={q}
        status={status}
        label="Booking pages"
      />
    </div>
  );
}

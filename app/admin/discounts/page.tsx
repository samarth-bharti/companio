// app/admin/discounts/page.tsx — create & manage promo / discount codes.

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminPager } from '@/components/admin/AdminPager';
import { AdminEmpty } from '@/components/admin/AdminEmpty';
import {
  ADMIN_PAGE_SIZE,
  parseQ,
  parsePage,
  like,
  type AdminListSearchParams,
} from '@/lib/server/adminList';
import { createDiscount, toggleDiscountActive, deleteDiscount } from '../actions/discounts';

export const metadata = { title: "Discounts" };


export const dynamic = 'force-dynamic';

const btn = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)]/20 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 disabled:opacity-50 disabled:cursor-wait';
const btnBlue = 'text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-azure)] text-white disabled:opacity-50 disabled:cursor-wait';
const btnRed = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-wait';
const inp = 'h-9 px-2 text-sm rounded-lg border border-[var(--color-ink)]/15';

/**
 * Load the codes and stamp the instant they were judged against, together.
 * Reading the clock inside the component body makes the render impure — every
 * row would compare against a slightly different `now`, and the rule that
 * catches it is the same one that catches genuinely unstable renders.
 */
async function loadCodes(where: Prisma.DiscountCodeWhereInput, page: number) {
  const [codes, total] = await Promise.all([
    prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    prisma.discountCode.count({ where }),
  ]);
  return { codes, total, now: Date.now() };
}

const BASE = '/admin/discounts';

export default async function AdminDiscounts({ searchParams }: { searchParams: AdminListSearchParams }) {
  const sp = await searchParams;
  const q = parseQ(sp.q);
  const page = parsePage(sp.page);

  const { codes, total, now } = await loadCodes(q ? { code: like(q) } : {}, page);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
        Discount codes ({total.toLocaleString('en-IN')})
      </h1>

      {/* Create form */}
      <ActionForm
        action={createDiscount}
        submitLabel="Create code"
        submitClassName={btnBlue}
        className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
          Code
          <input name="code" required placeholder="LAUNCH50" className={inp} style={{ width: 140 }} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
          Type
          <select name="type" className={`${inp} pr-6`}>
            <option value="percentage">% off</option>
            <option value="fixed">₹ off (paise)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
          Value
          <input name="value" type="number" required defaultValue="10" className={inp} style={{ width: 90 }} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
          Max uses
          <input name="maxUses" type="number" placeholder="∞" className={inp} style={{ width: 80 }} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
          Expires
          <input name="expiresAt" type="date" className={inp} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)] flex-1 min-w-[140px]">
          Note
          <input name="note" placeholder="Launch week" className={inp} />
        </label>
      </ActionForm>

      {/* List */}
      <AdminSearch q={q} label="Search codes" placeholder="LAUNCH50" />

      <div className="flex flex-col gap-3">
        {codes.length === 0 && (
          <AdminEmpty basePath={BASE} q={q} noun="codes" emptyLabel="No codes yet." />
        )}
        {codes.map((c) => {
          const expired = c.expiresAt ? c.expiresAt.getTime() < now : false;
          const label = c.type === 'percentage' ? `${c.value}% off` : `₹${(c.value / 100).toFixed(0)} off`;
          return (
            <div key={c.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-bold text-[var(--color-ink)] tracking-wide">
                  {c.code} <span className="font-normal text-[var(--color-ink-muted)]">· {label}</span>
                </p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}
                  {c.expiresAt ? ` · expires ${c.expiresAt.toLocaleDateString('en-IN')}` : ' · no expiry'}
                  {c.note ? ` · ${c.note}` : ''}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.active && !expired ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]' : 'bg-rose-100 text-rose-700'}`}>
                {expired ? 'expired' : c.active ? 'active' : 'disabled'}
              </span>
              <ActionForm
                action={toggleDiscountActive}
                submitLabel={c.active ? 'Disable' : 'Enable'}
                submitClassName={btn}
              >
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="active" value={String(c.active)} />
              </ActionForm>
              <ActionForm
                action={deleteDiscount}
                submitLabel="Delete"
                submitClassName={btnRed}
                confirm={`Delete the code ${c.code}?`}
              >
                <input type="hidden" name="id" value={c.id} />
              </ActionForm>
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
        label="Discount code pages"
      />
    </div>
  );
}

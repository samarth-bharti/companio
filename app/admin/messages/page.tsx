// app/admin/messages/page.tsx — the contact inbox.
//
// /api/contact wrote every message a visitor sent into contact_messages and then
// tried to email a copy. The email is gated on RESEND_API_KEY, which is not set,
// and no admin screen read the table — so a safety report, a privacy request or
// a refund ask typed into the contact form landed somewhere nobody would ever
// look. The row was saved, faithfully, into a void. This is the screen that reads it.

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
import { setMessageHandled } from '../actions';

export const metadata = { title: 'Inbox' };

export const dynamic = 'force-dynamic';

/** A refund ask or a safety concern must not sit behind twenty "other"s. */
const TOPIC_LABEL: Record<string, string> = {
  refund: 'Refund request',
  safety: 'Safety concern',
  privacy: 'Privacy / data rights',
  support: 'Account, bookings or payments',
  companion: 'Becoming a companion',
  other: 'Other',
};

const URGENT = new Set(['refund', 'safety', 'privacy']);

const BASE = '/admin/messages';

export default async function AdminMessages({ searchParams }: { searchParams: AdminListSearchParams }) {
  const sp = await searchParams;
  const q = parseQ(sp.q);
  const page = parsePage(sp.page);

  const where: Prisma.ContactMessageWhereInput = q
    ? { OR: [{ name: like(q) }, { email: like(q) }, { message: like(q) }] }
    : {};

  const [messages, total, open] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: [{ handledAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    prisma.contactMessage.count({ where }),
    // Counted in the database, not off the loaded rows: with one page in hand,
    // filtering the array would only ever have reported the unhandled messages
    // that happened to be on this page.
    prisma.contactMessage.count({ where: { ...where, handledAt: null } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
          Inbox
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          {open === 0 ? 'Nothing waiting.' : `${open.toLocaleString('en-IN')} waiting on a reply.`}
          {q && ' Matching this search.'}
        </p>
      </div>

      <AdminSearch q={q} label="Search the inbox" placeholder="Name, email or message text" />

      {messages.length === 0 && (
        <AdminEmpty basePath={BASE} q={q} noun="messages" emptyLabel="Nobody has written in yet." />
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4"
            style={m.handledAt ? { opacity: 0.6 } : undefined}
          >
            <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                {m.name} ·{' '}
                <a href={`mailto:${m.email}`} className="underline underline-offset-2">
                  {m.email}
                </a>
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={
                  URGENT.has(m.topic)
                    ? { background: 'rgba(178,58,46,0.08)', color: '#B23A2E' }
                    : { background: 'rgba(0,0,0,0.05)', color: 'var(--color-ink-muted)' }
                }
              >
                {TOPIC_LABEL[m.topic] ?? m.topic}
              </span>
            </div>

            <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{m.message}</p>

            <p className="text-xs text-[var(--color-ink-muted)] mt-2">
              {m.createdAt.toLocaleString('en-IN')}
              {/* Whether the copy actually left Resend. Without it, this screen is
                  the ONLY place the message exists — worth saying out loud. */}
              {m.emailedAt ? ' · emailed' : ' · not emailed (no email service configured)'}
              {m.handledAt && ` · handled ${m.handledAt.toLocaleDateString('en-IN')}`}
            </p>

            {!m.handledAt && (
              <div className="flex items-start gap-2 mt-3">
                <ActionForm
                  action={setMessageHandled}
                  submitLabel="Mark handled"
                  submitClassName="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-azure)]/30 text-[var(--color-azure)] hover:bg-[var(--color-azure)]/5 disabled:opacity-50 disabled:cursor-wait"
                >
                  <input type="hidden" name="id" value={m.id} />
                </ActionForm>
              </div>
            )}
          </div>
        ))}
      </div>

      <AdminPager
        basePath={BASE}
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        q={q}
        label="Inbox pages"
      />
    </div>
  );
}

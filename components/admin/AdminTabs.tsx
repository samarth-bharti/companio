'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * The admin header. Split out of the layout because it needs `usePathname` to
 * mark the current tab — ten identically-styled links gave an operator no clue
 * which page they were on.
 *
 * The tab row scrolls horizontally rather than wrapping: ten tabs do not fit on
 * a phone, and a wrapped row pushed the content below the fold.
 */

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/companions', label: 'Companions' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/discounts', label: 'Discounts' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/messages', label: 'Inbox' },
  { href: '/admin/payouts', label: 'Payouts' },
  { href: '/admin/surge', label: 'Surge' },
  { href: '/admin/audit', label: 'Audit' },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--color-ink)]/10 bg-white sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4 sm:gap-6">
        <span className="font-display font-black text-[var(--color-ink)] shrink-0">
          Companio <span className="text-[var(--color-ink-muted)]">Admin</span>
        </span>

        <nav
          aria-label="Admin sections"
          className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1"
        >
          {TABS.map((t) => {
            // '/admin' is a prefix of every other tab, so it only matches exactly.
            const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]',
                  active
                    ? 'bg-[var(--color-ink)] text-white font-medium'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]',
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="ml-auto shrink-0 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)] rounded"
        >
          Exit
        </Link>
      </div>
    </header>
  );
}

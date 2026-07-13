// app/admin/layout.tsx — gates the whole /admin tree behind an admin role.
// Non-admins (and everyone, until auth+DB are wired) are sent home.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminUserId } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/companions', label: 'Companions' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/discounts', label: 'Discounts' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/payouts', label: 'Payouts' },
  { href: '/admin/surge', label: 'Surge' },
  { href: '/admin/audit', label: 'Audit' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminId = await getAdminUserId();
  if (!adminId) redirect('/');

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-ink)]/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <span className="font-display font-black text-[var(--color-ink)]">Companio Admin</span>
          <nav className="flex gap-4">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                {t.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            Exit
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

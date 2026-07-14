// app/admin/layout.tsx — gates the whole /admin tree behind an admin role.
// Non-admins (and everyone, until auth+DB are wired) are sent home.

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAdminUserId } from '@/lib/server/admin';
import { AdminTabs } from '@/components/admin/AdminTabs';

export const dynamic = 'force-dynamic';

/**
 * Admin had no metadata, so all ten pages inherited the marketing <title>
 * ("Companio, book a companion…") — an operator with several tabs open could not
 * tell them apart.
 *
 * `noindex` matters more: /admin redirects non-admins, but a redirect is not a
 * robots directive. Nothing stopped a crawler from listing the URLs.
 */
export const metadata: Metadata = {
  title: { template: '%s · Companio Admin', default: 'Companio Admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminId = await getAdminUserId();
  if (!adminId) redirect('/');

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminTabs />
      {/* id matches the root layout's "Skip to content" link. */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

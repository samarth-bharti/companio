import { Suspense } from 'react';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata = {
  title: 'Dashboard, Companio',
  description: 'Your meetups, messages, and membership in one place.',
};

function Skeleton() {
  return (
    <div
      className="min-h-[60vh]"
      style={{ background: 'var(--color-bg)' }}
      aria-hidden="true"
    />
  );
}

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <BackBar fallbackHref="/" />
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <Link
          href="/spin"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-[var(--color-azure)]/20 bg-[var(--color-azure-tint)] hover:bg-[var(--color-azure)]/10 transition-colors"
        >
          <Gift size={18} className="text-[var(--color-azure)] shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-[var(--color-azure-deep)]">
            Your weekly spin is ready — try your luck for a discount →
          </span>
        </Link>
      </div>
      <Suspense fallback={<Skeleton />}>
        <DashboardClient />
      </Suspense>
      <Footer />
    </>
  );
}

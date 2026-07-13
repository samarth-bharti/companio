import { Suspense } from 'react';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { SpinBanner } from '@/components/dashboard/SpinBanner';

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
        <SpinBanner />
      </div>
      <Suspense fallback={<Skeleton />}>
        <DashboardClient />
      </Suspense>
      <Footer />
    </>
  );
}

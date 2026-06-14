import { Suspense } from 'react';
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
      <Suspense fallback={<Skeleton />}>
        <DashboardClient />
      </Suspense>
      <Footer />
    </>
  );
}

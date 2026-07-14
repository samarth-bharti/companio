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
      {/* The layout's "Skip to content" link targets #main-content. This page had
          no <main> at all, so the skip link — the first thing a keyboard user
          tabs to — jumped nowhere, and the page exposed no main landmark. */}
      <main id="main-content">
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <SpinBanner />
        </div>
        <Suspense fallback={<Skeleton />}>
          <DashboardClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

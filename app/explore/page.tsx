import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { ExploreClient } from '@/components/explore/ExploreClient';

export const metadata: Metadata = {
  title: 'Explore companions, Companio',
  description:
    'Browse Aadhaar-verified companions for city walks, gym sessions, café chats, and more in Mumbai and across India. Strictly platonic.',
};

/**
 * Explore page — thin server wrapper.
 * ExploreClient uses useSearchParams so it must sit inside <Suspense>.
 */
export default function ExplorePage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
          <ExploreClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

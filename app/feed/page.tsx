import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { FeedClient } from '@/components/feed/FeedClient';

export const metadata: Metadata = {
  title: 'Feed, Companio',
  description:
    'See what the Companio community is up to, activity proposals, group events, and verified meetup moments. Strictly platonic.',
};

export default function FeedPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <FeedClient />
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { LoungeClient } from '@/components/lounge/LoungeClient';

export const metadata: Metadata = {
  title: 'Lounge, Companio',
  description:
    'Join group activity rooms or start a direct conversation. Mumbai\'s most fun platonic social space.',
};

export default function LoungePage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-0" style={{ overflow: 'hidden' }}>
        <LoungeClient />
      </main>
      <Footer />
    </>
  );
}

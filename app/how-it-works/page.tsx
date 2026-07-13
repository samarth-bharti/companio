import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { HowItWorksJourney } from '@/components/howitworks/HowItWorksJourney';

export const metadata: Metadata = {
  title: 'How It Works, Companio',
  description:
    'Learn how Companio works: browse ID-checked companions, book a session, meet safely, and leave an honest review.',
};

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <HowItWorksJourney />
      <Footer />
    </>
  );
}

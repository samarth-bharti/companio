import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import { getCompanion } from '@/lib/data/companions';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { CompanionProfile } from '@/components/companion/CompanionProfile';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const companion = getCompanion(id);
  if (!companion) return { title: 'Not found, Companio' };
  return {
    title: `${companion.name}, Companio`,
    description: companion.bio,
    openGraph: { images: [companion.photo] },
  };
}

export default async function CompanionPage({ params }: Props) {
  const { id } = await params;
  const companion = getCompanion(id);
  if (!companion) notFound();
  return (
    <>
      <Nav />
      <BackBar backHref="/explore" label="Explore" />
      <CompanionProfile companion={companion} />
      <Footer />
    </>
  );
}

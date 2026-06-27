import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import { getCompanion } from '@/lib/data/companions';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { CompanionProfile } from '@/components/companion/CompanionProfile';
import { ReportButton } from '@/components/safety/ReportButton';

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
      <div className="max-w-2xl mx-auto px-4 pb-10 flex justify-center">
        <ReportButton companionId={companion.id} companionName={companion.firstName} />
      </div>
      <Footer />
    </>
  );
}

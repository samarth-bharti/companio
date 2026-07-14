import { notFound, redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { findVisibleCompanion, freePreviewIdSet } from '@/lib/server/catalogue';
import { viewerHasUnlocked } from '@/lib/server/viewer';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { CompanionProfile } from '@/components/companion/CompanionProfile';
import { ReportButton } from '@/components/safety/ReportButton';

interface Props {
  params: Promise<{ id: string }>;
}

/** Paid-for, or the city's free preview. Anything else must not be rendered. */
async function viewerMaySee(id: string): Promise<boolean> {
  const [unlocked, free] = await Promise.all([viewerHasUnlocked(), freePreviewIdSet()]);
  return unlocked || free.has(id);
}

// Read from the database, not from lib/data/companions. A profile an admin
// suspended must 404, and a newly approved applicant must resolve — neither
// happened while this page rendered a bundled array.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const companion = await findVisibleCompanion(id);
  if (!companion) return { title: 'Not found, Companio' };

  // A locked profile's bio must not be published as its meta description. It was
  // — which put the paid text in the page source, in the OG card, and in the
  // search index, for free.
  if (!(await viewerMaySee(id))) {
    return {
      title: `${companion.maskedName}, Companio`,
      description: `A ID-checked companion in ${companion.area}, ${companion.city}. Unlock to see their full profile.`,
    };
  }

  return {
    title: `${companion.name}, Companio`,
    description: companion.bio,
    openGraph: { images: [companion.photo] },
  };
}

export default async function CompanionPage({ params }: Props) {
  const { id } = await params;
  const companion = await findVisibleCompanion(id);
  if (!companion) notFound();

  // The gate is here, before a single byte of the profile is rendered.
  //
  // It used to be a useEffect inside CompanionProfile that called router.replace
  // AFTER the server had already sent the complete bio down the wire. "View
  // source" was the whole exploit. A redirect that runs in the browser is not a
  // paywall; it is a suggestion.
  if (!(await viewerMaySee(id))) {
    redirect(`/explore?locked=${encodeURIComponent(id)}`);
  }

  return (
    <>
      <Nav />
      <BackBar backHref="/explore" label="Explore" />
      {/* Target of the layout's "Skip to content" link, and the page's main landmark. */}
      <main id="main-content">
        <CompanionProfile companion={companion} />
        <div className="max-w-2xl mx-auto px-4 pb-10 flex justify-center">
          <ReportButton companionId={companion.id} companionName={companion.firstName} />
        </div>
      </main>
      <Footer />
    </>
  );
}

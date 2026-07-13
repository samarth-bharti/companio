'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { PassportStack } from '@/components/ui/PassportStack';
import { type Companion, topMatchIdFor } from '@/lib/data/companions';
import { dataClient } from '@/lib/dataClient';
import { CompanionProfilePortrait } from './CompanionProfilePortrait';
import { CompanionProfileSuggestions } from './CompanionProfileSuggestions';
import { CompanionProfileReviews } from './CompanionProfileReviews';
import { CompanionProfileBookingRail } from './CompanionProfileBookingRail';

interface Props {
  companion: Companion;
}

export function CompanionProfile({ companion }: Props) {
  const router = useRouter();

  // Gate: profiles are behind the ₹199 unlock except the free preview.
  //
  // The free preview is per city — it is whoever explore shows unblurred in the
  // city you are browsing. This used to compare against a single hardcoded id
  // (a Mumbai companion), so in every other city the one profile a locked
  // visitor could see was the one profile that bounced them back to /explore.
  //
  // Whether the unlock was bought is likewise the server's answer, not
  // localStorage's: a member who had paid was still being turned away.
  const isCityPreview = topMatchIdFor(companion.city) === companion.id;

  useEffect(() => {
    if (isCityPreview) return;
    let cancelled = false;
    dataClient
      .getUnlocked()
      .then((unlocked) => {
        if (!cancelled && !unlocked) router.replace('/explore');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isCityPreview, router]);

  return (
    <main className="min-h-screen pb-24 md:pb-0" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 mb-3 h-10 px-3 -ml-1 rounded-pill font-sans font-semibold text-sm transition-colors hover:bg-azure-tint focus-visible:outline-azure"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to explore
        </Link>

        {/* Journey breadcrumb — shows user where they are in the booking flow */}
        <nav aria-label="Booking journey" className="mb-6 flex items-center gap-1.5 text-xs font-sans select-none" style={{ color: 'var(--color-ink-muted)' }}>
          <a href="/explore" className="hover:underline underline-offset-2 transition-colors" style={{ color: 'var(--color-azure-deep)' }}>Explore</a>
          <span aria-hidden="true" className="opacity-40">→</span>
          <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>Profile</span>
          <span aria-hidden="true" className="opacity-40">→</span>
          <span>Book</span>
        </nav>
        <div className="md:grid md:grid-cols-[1fr_320px] md:gap-10">
          {/* ── Left column ─────────────────────────────────────── */}
          <div className="space-y-10 min-w-0">
            <CompanionProfilePortrait companion={companion} />

            <Reveal delay={0.08}>
              <CompanionProfileSuggestions suggestions={companion.suggestions} />
            </Reveal>

            <Reveal delay={0.12}>
              <section aria-label="Verification credentials">
                <h2
                  className="font-sans font-bold text-sm uppercase tracking-widest mb-4"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  Verified &amp; trusted
                </h2>
                <PassportStack />
              </section>
            </Reveal>

            <Reveal delay={0.16}>
              <CompanionProfileReviews
                reviews={companion.reviewsList}
                rating={companion.rating}
                reviewCount={companion.reviews}
              />
            </Reveal>
          </div>

          {/* ── Right column — sticky booking rail (md+) ─────────── */}
          <aside className="hidden md:block mt-0">
            <Reveal delay={0.1}>
              <CompanionProfileBookingRail companion={companion} />
            </Reveal>
          </aside>
        </div>
      </div>

      {/* Mobile booking rail — fixed bottom bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid rgba(20,26,46,0.08)',
          boxShadow: '0 -4px 20px rgba(20,26,46,0.08)',
        }}
      >
        <CompanionProfileBookingRail companion={companion} mobile />
      </div>
    </main>
  );
}

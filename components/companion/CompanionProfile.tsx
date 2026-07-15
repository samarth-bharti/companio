'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { PassportStack } from '@/components/ui/PassportStack';
import { type Companion } from '@/lib/data/companions';
import { CompanionProfilePortrait } from './CompanionProfilePortrait';
import { CompanionProfileSuggestions } from './CompanionProfileSuggestions';
import { CompanionProfileReviews } from './CompanionProfileReviews';
import { CompanionProfileBookingRail } from './CompanionProfileBookingRail';

interface Props {
  companion: Companion;
}

/**
 * The paywall used to live in here: a useEffect that read localStorage and
 * called router.replace — after the server had already sent the full bio to the
 * browser. It is gone, because app/companion/[id]/page.tsx now refuses to render
 * this component at all unless the viewer may see it.
 *
 * A component that receives a companion can trust that it is allowed to show it.
 */
export function CompanionProfile({ companion }: Props) {
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

      {/* Mobile booking rail — fixed bar sitting directly above the global tab
          bar (--mobile-nav-h), not under it: the two share bottom:0 and the nav
          (z-50) was covering this rail's Book button (z-40) entirely. */}
      <div
        className="md:hidden fixed left-0 right-0 z-40 px-4 py-3"
        style={{
          bottom: 'var(--mobile-nav-h, 0px)',
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

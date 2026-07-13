'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DigitRoll } from '@/components/journey/DigitRoll';
import { CountUp } from '@/components/motion/CountUp';
import { CitySelector } from './CitySelector';

interface ExploreHeaderProps {
  matched: boolean;
  name?: string;
  cityName: string;
  unlockedCount: number;
  /** How many companions actually list in this city. */
  cityCount: number;
  selectedCityId: string;
  onCityChange: (id: string) => void;
  quizDone: boolean;
  freeNowCount: number;
}

/**
 * ExploreHeader — light band atop the explore grid.
 * Personalised H1 when ?matched=1; city selector; social-proof chip; unlock counter.
 * Quiz link shown only when quiz not yet done (§ADD item 5).
 * Spec §4.1 + §1.5 copy voice (platonic, no fake urgency).
 */
export function ExploreHeader({
  matched, name, cityName, unlockedCount,
  cityCount, selectedCityId, onCityChange, quizDone, freeNowCount,
}: ExploreHeaderProps) {
  return (
    <section
      className="py-8 md:py-12 relative overflow-hidden"
      style={{ background: 'var(--grad-hero-bg)' }}
      aria-labelledby="explore-heading"
    >
      <div className="max-w-3xl mx-auto px-6">

        {/* Eyebrow + city selector */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--color-azure)', fontFamily: 'var(--font-sans)' }}
          >
            Explore companions in
          </p>
          <CitySelector value={selectedCityId} onChange={onCityChange} />
        </div>

        {/* H1 — personalised when matched, else default with aurora accent */}
        {matched ? (
          <>
            <h1
              id="explore-heading"
              className="mb-3 leading-tight tracking-tight"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-h1)',
                color: 'var(--color-ink)',
              }}
            >
              Your {cityCount} {cityCount === 1 ? 'match' : 'matches'} in {cityName}
              {name ? `, ${name}` : ''}.
            </h1>
            <p
              className="mb-6"
              style={{
                fontSize: 'var(--text-lead)',
                color: 'var(--color-ink-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Tap anyone to take a closer look.
            </p>
          </>
        ) : (
          <h1
            id="explore-heading"
            className="mb-6 leading-tight tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h1)',
              color: 'var(--color-ink)',
            }}
          >
            {/* "Verified company, near you." — the `verified` column is operator-
                owned and is false for every companion on the platform. The word
                cannot headline a page where it is true of nobody. */}
            Good company,{' '}
            <em
              className="not-italic"
              style={{
                background: 'var(--grad-aurora)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              near you.
            </em>
          </h1>
        )}

        {/* Counts the companions actually in this city. The old copy read
            "{members}+ members", a hardcoded per-city figure that was invented.
            Hidden entirely when the city has nobody, rather than saying "0+". */}
        {cityCount > 0 && (
          <div
            className="mb-4 flex w-fit items-center gap-2 rounded-pill px-4 py-2"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(31,174,107,0.20)',
              boxShadow: 'var(--shadow-1)',
            }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full animate-pulse"
              style={{ background: 'var(--color-emerald)' }}
              aria-hidden="true"
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
              {cityCount} ID-checked {cityCount === 1 ? 'companion' : 'companions'} ·{' '}
              <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>
                <CountUp value={freeNowCount} />
              </span>{' '}
              free to meet today
            </span>
          </div>
        )}

        {/* Unlock counter — aria-live so screen readers announce the roll.
            The denominator is this city's roster, not a hardcoded 14. */}
        {cityCount > 0 && (
          <div
            aria-live="polite"
            className="mb-5 flex items-center gap-1 text-sm"
            style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-sans)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
              <DigitRoll value={unlockedCount} aria-label={String(unlockedCount)} className="text-sm" />
            </span>
            <span> of {cityCount} profiles unlocked</span>
          </div>
        )}

        {/* Quiz link — only before quiz is done */}
        {!quizDone && (
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1.5 text-sm font-medium rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: 'var(--color-azure-deep)', outlineColor: 'var(--color-azure)' }}
          >
            Not sure who to pick? Take the 60-second quiz
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}

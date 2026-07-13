'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import type { Companion } from '@/lib/data/companions';
import { CompanionCard } from './CompanionCard';
import { BlurLockCard } from './BlurLockCard';
import { TiltCard } from '@/components/motion/TiltCard';

export interface CompanionGridProps {
  companions: Companion[];
  unlocked: boolean;
  /** Non-null during the develop-reveal sequence; tappedId = card the user tapped. */
  developing: { tappedId: string } | null;
  onUnlockClick: (c: Companion) => void;
  onBook: (c: Companion) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  quizDone: boolean;
  compareIds: string[];
  onToggleCompare?: (id: string) => void;
  /** When set, scroll to + briefly highlight this companion id. */
  highlightId?: string | null;
  /** The city on screen, for the "not live here yet" copy. */
  cityName: string;
  /** True when this city has no companions at all, before any filter applies. */
  cityIsEmpty: boolean;
  loading: boolean;
  loadError: boolean;
}

function GridMessage({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <section style={{ background: 'var(--color-bg)' }} aria-label="Companion profiles">
      <div className="max-w-xl mx-auto px-6 py-20 flex flex-col items-center gap-3 text-center">
        <p className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
          {title}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
          {body}
        </p>
        {children}
      </div>
    </section>
  );
}

/** Skeleton cards, so a slow database never looks like an empty city. */
function GridSkeleton() {
  return (
    <section style={{ background: 'var(--color-bg)' }} aria-label="Loading companions">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto px-6 py-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <li
            key={i}
            aria-hidden="true"
            className="h-[340px] rounded-[var(--radius-lg)] animate-pulse"
            style={{ background: 'rgba(20,26,46,0.05)' }}
          />
        ))}
      </ul>
      <span className="sr-only" role="status">
        Loading companions…
      </span>
    </section>
  );
}

/**
 * Detects the responsive column count (1/2/3/4) matching the Tailwind breakpoints
 * on the grid, so the Chebyshev-distance stagger stays layout-accurate.
 * Breakpoints: sm=640 lg=1024 xl=1280.
 */
function useColumnCount(): number {
  const [cols, setCols] = useState(3); // safe SSR default; updated after mount
  useEffect(() => {
    function update() {
      if (window.matchMedia('(max-width: 639px)').matches) setCols(1);
      else if (window.matchMedia('(max-width: 1023px)').matches) setCols(2);
      else if (window.matchMedia('(max-width: 1279px)').matches) setCols(3);
      else setCols(4);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cols;
}

/**
 * CompanionGrid — denser 4-col responsive grid (spec §ADD item 1).
 *
 * Locked: topMatch shows as a full CompanionCard (free preview); others are BlurLockCards.
 * Unlocked: all CompanionCards with favourite toggles. During develop-reveal, every card
 * mounts fresh (key suffix '-u') so it plays the blur→clear animation from scratch.
 * Stagger delay is Chebyshev-distance-based, radiating outward from the tapped card.
 * Reduced motion: develop animations suppressed — cards render clear immediately.
 * Empty filtered list: friendly empty state instead of the grid.
 */
export function CompanionGrid({
  companions, unlocked, developing, onUnlockClick, onBook,
  favorites, onToggleFavorite,
  quizDone, compareIds, onToggleCompare, highlightId,
  cityName, cityIsEmpty, loading, loadError,
}: CompanionGridProps) {
  const reduced = useEffectiveReducedMotion();
  const cols = useColumnCount();
  // refs keyed by companion id so we can scroll to highlighted card
  const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    const el = cardRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      setFlashId(highlightId);
      const t = setTimeout(() => setFlashId(null), 1200);
      return () => clearTimeout(t);
    }
  }, [highlightId, reduced]);

  const tappedIdx = developing
    ? companions.findIndex((c) => c.id === developing.tappedId)
    : -1;
  const tappedRow = tappedIdx >= 0 ? Math.floor(tappedIdx / cols) : 0;
  const tappedCol = tappedIdx >= 0 ? tappedIdx % cols : 0;

  function getDevelop(i: number): { delay: number; ring?: boolean } | null {
    if (!developing || reduced) return null;
    const row = Math.floor(i / cols);
    const col = i % cols;
    const dist = Math.max(Math.abs(row - tappedRow), Math.abs(col - tappedCol));
    return {
      delay: Math.min(0.06 + 0.05 * dist, 0.7),
      ring: companions[i].id === developing.tappedId,
    };
  }

  // These four states used to be one. "No companions match these filters" was
  // shown when the database was unreachable, when a city had nobody in it, and
  // while the request was still in flight. They mean entirely different things.
  if (loading) return <GridSkeleton />;

  if (loadError) {
    return (
      <GridMessage
        title="We couldn't load companions just now."
        body="This is our problem, not yours. Please refresh in a moment — nothing has been lost."
      />
    );
  }

  if (cityIsEmpty) {
    return (
      <GridMessage
        title={`Companio isn't live in ${cityName} yet.`}
        body={`No companion lists in ${cityName} so far. We'd rather show you an empty page than someone who isn't there. If you know the city well, you could be the first.`}
      >
        <Link
          href="/become-a-companion"
          className="mt-3 inline-flex items-center justify-center h-12 px-6 rounded-pill font-sans font-bold text-sm text-white"
          style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
        >
          Become a companion in {cityName} →
        </Link>
      </GridMessage>
    );
  }

  if (companions.length === 0) {
    return (
      <GridMessage
        title="No companions match these filters."
        body="Try broadening your search or clearing a filter."
      />
    );
  }

  return (
    <section style={{ background: 'var(--color-bg)' }} aria-label="Companion profiles">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto px-6 py-12">
        {companions.map((c, i) => {
          // Key includes '-u' suffix when unlocked → forces full remount for all cards
          // simultaneously so every card plays the develop animation from blur.
          const key = unlocked ? `${c.id}-u` : c.id;

          const isFlashing = flashId === c.id;

          if (!unlocked) {
            return (
              <li key={key} ref={(el) => { cardRefs.current[c.id] = el; }}>
                {c.topMatch ? (
                  // Free preview — full CompanionCard; tilt active, Book button opens sheet via onBook
                  <TiltCard maxDeg={5}>
                    <CompanionCard companion={c} develop={null} onBook={onBook} />
                  </TiltCard>
                ) : (
                  // Blurred lock card — no tilt (3D on a sealed card looks odd)
                  <BlurLockCard companion={c} onUnlockClick={onUnlockClick} />
                )}
              </li>
            );
          }

          return (
            <li
              key={key}
              ref={(el) => { cardRefs.current[c.id] = el; }}
              style={isFlashing && !reduced ? {
                outline: '2.5px solid var(--color-azure)',
                borderRadius: 'var(--radius-lg)',
                transition: 'outline 0.3s ease',
              } : undefined}
            >
              <TiltCard maxDeg={5}>
                <CompanionCard
                  companion={c}
                  develop={developing ? getDevelop(i) : null}
                  onBook={onBook}
                  isFavorite={favorites.includes(c.id)}
                  onToggleFavorite={onToggleFavorite}
                  quizDone={quizDone}
                  isCompared={compareIds.includes(c.id)}
                  onToggleCompare={onToggleCompare}
                />
              </TiltCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

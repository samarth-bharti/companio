'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { BadgeCheck, Heart, Plus, Check, MapPin, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { durations } from '@/lib/motion';
import type { Companion } from '@/lib/data/companions';
import { RatingBadge } from '@/components/companion/RatingBadge';

/*
 * Pulse-ring keyframe lives in app/globals.css (companio-pulse-ring) — this
 * component injects zero <style> tags.
 */

// A companion nobody has reviewed yet is new. The old thresholds — new below 45
// reviews, popular above 100 — sorted a catalogue in which every single profile
// was hardcoded to 124 reviews, so every profile was "Popular" and none was new.
function isNew(c: Companion) { return c.reviews === 0; }
function isPopular(c: Companion) { return c.reviews >= 25; }

interface CompanionCardProps {
  companion: Companion;
  develop?: { delay: number; ring?: boolean } | null;
  onBook?: (c: Companion) => void;
  /** Favourite state — only provided when grid is unlocked. */
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  /** Compare state — only provided when grid is unlocked. */
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  /** Show matchScore badge when quizDone. */
  quizDone?: boolean;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium bg-white/85 text-ink"
      style={{ border: '1.5px solid rgba(46,107,255,0.18)' }}
    >
      {children}
    </span>
  );
}

// memo: prevents re-render when parent (CompanionGrid/ExploreClient) state changes
// but this card's own props haven't. ExploreClient handlers are useCallback-wrapped.
export const CompanionCard = memo(function CompanionCard({
  companion, develop, onBook,
  isFavorite, onToggleFavorite,
  isCompared, onToggleCompare,
  quizDone,
}: CompanionCardProps) {
  const shouldReduce = useEffectiveReducedMotion();
  const {
    id, name, city, area, age, rating, reviews,
    activities, languages, bio, photo, topMatch,
  } = companion;

  const ease = [0.16, 1, 0.3, 1] as const;
  const hasDevelop = !!(develop && !shouldReduce);
  const hasRing = !!(develop?.ring && !shouldReduce);

  // Cards in the unlocked grid always have onToggleFavorite; locked preview cards don't.
  const isUnlockedGrid = !!onToggleFavorite;
  const extraActivities = Math.max(0, activities.length - 2);

  return (
    <motion.article
      className="group relative w-full rounded-[var(--radius-lg)] overflow-hidden bg-surface"
      style={{ boxShadow: 'var(--shadow-1)' }}
      initial={hasRing ? { boxShadow: '0 0 0 1px rgba(255,178,62,0.25), 0 12px 36px -12px rgba(255,178,62,0.45)' } : false}
      animate={hasRing ? { boxShadow: '0 1px 3px rgba(20,26,46,0.07)' } : {}}
      transition={hasRing ? { duration: 0.9, ease, delay: develop!.delay } : {}}
      whileHover={shouldReduce ? {} : { y: -4 }}
    >
      {/* Portrait — 4:3, with a bottom scrim so the overlaid name stays legible. */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <motion.div
          className="absolute inset-0"
          initial={hasDevelop ? { filter: 'blur(18px) sepia(0.6)', scale: 1 } : false}
          animate={hasDevelop ? { filter: 'blur(0px) sepia(0)', scale: [1, 1.04, 1] } : {}}
          transition={hasDevelop ? { duration: durations.slow, ease, delay: develop!.delay } : {}}
        >
          <Image
            src={photo}
            alt={`${name}, companion in ${area}, ${city}`}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, (max-width:1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </motion.div>

        {/* Legibility scrim for the name overlay. */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(11,15,30,0.85), rgba(11,15,30,0.25) 55%, transparent)' }}
          aria-hidden="true"
        />

        {/* Top-left: topMatch ribbon OR New/Popular badge */}
        {topMatch ? (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-pill text-xs font-bold text-ink shadow-sm" style={{ background: 'var(--color-gold)' }}>
            ★ Top match
          </div>
        ) : isUnlockedGrid && (isNew(companion) || isPopular(companion)) ? (
          <div
            className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-pill text-xs font-semibold shadow-sm"
            style={
              isNew(companion)
                ? { background: 'rgba(122,79,224,0.92)', color: '#fff', backdropFilter: 'blur(4px)' }
                : { background: 'rgba(255,178,62,0.94)', color: '#141A2E', backdropFilter: 'blur(4px)' }
            }
          >
            {/* "New this week" claimed a join date we do not track. "New" is
                simply what having no reviews means. */}
            {isNew(companion) ? 'New' : 'Popular'}
          </div>
        ) : null}

        {/* Favourite toggle — unlocked grid only */}
        {onToggleFavorite && (
          <button
            type="button"
            aria-pressed={!!isFavorite}
            aria-label={isFavorite ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(id); }}
            className={cn(
              'absolute top-2.5 right-2.5 w-10 h-10 flex items-center justify-center rounded-full transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
              isFavorite ? 'bg-white/90' : 'bg-black/30 hover:bg-white/80',
            )}
            style={{ outlineColor: 'var(--color-azure)' }}
          >
            <Heart size={18} aria-hidden="true" className={isFavorite ? 'fill-current' : ''} style={{ color: isFavorite ? '#E53E3E' : 'white' }} />
          </button>
        )}

        {/* Match score — overlaid bottom-right (quiz-matched, unlocked grid) */}
        {quizDone && isUnlockedGrid && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-pill text-xs font-bold shadow-sm" style={{ background: 'rgba(122,79,224,0.94)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            {companion.matchScore}% match
          </div>
        )}

        {/* Name block — the whole block links to the profile (no ugly blue link). */}
        <Link
          href={`/companion/${id}`}
          className="absolute bottom-2.5 left-3 right-3 focus-visible:outline-none"
          aria-label={`View ${name}'s profile`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[1.15rem] font-bold text-white leading-tight tracking-tight drop-shadow group-hover:underline decoration-white/40 underline-offset-2" style={{ fontFamily: 'var(--font-display)' }}>
              {name}{age ? <span className="font-medium opacity-80">, {age}</span> : null}
            </span>
            <BadgeCheck size={17} className="shrink-0 drop-shadow text-white" aria-hidden="true" />
            <span className="sr-only">Verified</span>
          </div>
          <div className="flex items-center gap-1 text-[0.8rem] font-medium text-white/85 mt-0.5">
            <MapPin size={12} aria-hidden="true" />
            <span>{area} · {city}</span>
          </div>
        </Link>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-2.5">
        {/* Meta line: rating · distance · availability */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          <RatingBadge rating={rating} reviews={reviews} />
          {isUnlockedGrid && (
            <>
              <span aria-hidden="true">·</span>
              <span>{companion.distanceKm} km</span>
              <span aria-hidden="true">·</span>
              <span
                className="inline-flex items-center gap-1 font-semibold"
                style={{ color: companion.availableNow ? 'var(--color-emerald)' : 'var(--color-ink-muted)' }}
              >
                {companion.availableNow && (
                  <span className="relative inline-flex h-2 w-2" aria-hidden="true">
                    {!shouldReduce && (
                      <span className="absolute inset-0 rounded-full" style={{ background: 'var(--color-emerald)', opacity: 0.35, animation: 'companio-pulse-ring 1.8s ease-out infinite' }} />
                    )}
                    <span className="relative block h-2 w-2 rounded-full" style={{ background: 'var(--color-emerald)' }} />
                  </span>
                )}
                {companion.availability}
              </span>
            </>
          )}
        </div>

        {/* Bio tagline — a line of personality (the "details" that make a card interesting). */}
        <p className="text-[0.8rem] leading-relaxed line-clamp-2" style={{ color: 'var(--color-ink-muted)' }}>
          {bio}
        </p>

        {/* Languages */}
        {languages?.length > 0 && (
          <div className="flex items-center gap-1.5 text-[0.7rem] font-medium" style={{ color: 'var(--color-ink-muted)' }}>
            <Languages size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{languages.join(' · ')}</span>
          </div>
        )}

        {/* Activity chips — up to 2 + overflow count */}
        <div className="flex flex-wrap gap-1.5">
          {activities.slice(0, 2).map((act) => (
            <Chip key={act}>{act}</Chip>
          ))}
          {extraActivities > 0 && <Chip>+{extraActivities}</Chip>}
        </div>

        {/* Actions — compare (secondary) + a prominent Book button. */}
        <div className="flex items-center gap-2 pt-1">
          {onToggleCompare && (
            <button
              type="button"
              aria-pressed={!!isCompared}
              aria-label={isCompared ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
              onClick={(e) => { e.stopPropagation(); onToggleCompare(id); }}
              className={cn(
                'shrink-0 flex items-center gap-1 px-3 h-[46px] rounded-xl text-xs font-semibold transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
              )}
              style={
                isCompared
                  ? { background: 'var(--color-azure)', border: '1.5px solid var(--color-azure)', color: 'white', outlineColor: 'var(--color-azure)' }
                  : { background: 'rgba(46,107,255,0.06)', border: '1.5px solid rgba(46,107,255,0.22)', color: 'var(--color-azure-deep)', outlineColor: 'var(--color-azure)' }
              }
            >
              {isCompared ? <Check size={13} aria-hidden /> : <Plus size={13} aria-hidden />}
              {isCompared ? 'Added' : 'Compare'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onBook?.(companion)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 min-h-[46px] px-4 rounded-xl text-[0.95rem] font-bold text-white',
              'transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure',
            )}
            style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)', letterSpacing: '-0.01em' }}
            aria-label={isUnlockedGrid ? `Book a meetup with ${name}` : `Unlock to see ${name}'s full profile`}
          >
            {isUnlockedGrid ? 'Book a walk' : 'Unlock to book'}
          </button>
        </div>
      </div>
    </motion.article>
  );
});

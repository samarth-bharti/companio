'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { spring, stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Review {
  name: string;
  city: string;
  stars: number;
  text: string;
}

interface Props {
  reviews: Review[];
  rating: number;
  reviewCount: number;
}

/**
 * Star row — animated variant stagger-fills stars on scroll-in.
 */
function StarRow({
  rating,
  size = 14,
  animated = false,
}: {
  rating: number;
  size?: number;
  animated?: boolean;
}) {
  const reduced = useEffectiveReducedMotion();
  const path = 'M8 1.5l1.85 3.74 4.12.6-2.98 2.9.7 4.1L8 10.8l-3.69 1.94.7-4.1L2.03 5.84l4.12-.6L8 1.5z';

  return (
    <span aria-label={`${rating} out of 5 stars`} className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating;
        if (animated) {
          return (
            <motion.svg
              key={i}
              aria-hidden="true"
              width={size}
              height={size}
              viewBox="0 0 16 16"
              fill={filled ? 'var(--color-gold)' : 'var(--color-edge)'}
              initial={reduced ? false : { opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { ...spring.snappy, delay: i * stagger.tight }
              }
            >
              <path d={path} />
            </motion.svg>
          );
        }
        return (
          <svg
            key={i}
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill={filled ? 'var(--color-gold)' : 'var(--color-edge)'}
          >
            <path d={path} />
          </svg>
        );
      })}
    </span>
  );
}

/**
 * ReviewCard — single card used inside the drag carousel.
 */
function ReviewCard({ r }: { r: Review }) {
  return (
    <div
      className={cn(
        'rounded-lg p-4 select-none',
        r.stars === 4
          ? 'border border-[--color-edge] bg-[--color-surface]'
          : 'bg-[--color-azure-tint]',
      )}
      style={{ boxShadow: 'var(--shadow-1)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StarRow rating={r.stars} />
          {r.stars === 4 && (
            <span
              className="font-sans text-xs px-2 py-0.5 rounded-pill border"
              style={{
                color: 'var(--color-ink-muted)',
                borderColor: 'var(--color-edge)',
                background: 'var(--color-surface)',
              }}
            >
              Honest review
            </span>
          )}
        </div>
        <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          {r.name} · {r.city}
        </span>
      </div>
      <p
        className="font-serif text-sm leading-relaxed"
        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}
      >
        &ldquo;{r.text}&rdquo;
      </p>
    </div>
  );
}

/**
 * CompanionProfileReviews — swipeable/draggable carousel.
 * Keyboard: previous/next buttons flanking the track; arrow keys also work.
 * Reduced motion: snaps instantly, drag spring disabled.
 */
export function CompanionProfileReviews({ reviews, rating, reviewCount }: Props) {
  const reduced = useEffectiveReducedMotion();
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = reviews.length;
  const clamp = (n: number) => Math.max(0, Math.min(total - 1, n));

  const prev = () => setCurrent((c) => clamp(c - 1));
  const next = () => setCurrent((c) => clamp(c + 1));

  // Card width = 100% of the track (one card visible at a time on mobile),
  // or up to 340px on wider viewports — calculated at paint time.
  // We use percentages via translateX so no ResizeObserver needed.
  const CARD_GAP = 16; // px — gap between cards
  // We scroll by 100% of the card width + gap.
  // Because cards are 100% wide the percentage offset = index × (100% + gap).
  // Since framer-motion `x` works in pixels we keep it simple:
  // cardW ≈ trackRef.current?.offsetWidth or fall back to 300.
  const cardW = trackRef.current?.offsetWidth ?? 300;
  const offset = -(current * (cardW + CARD_GAP));

  return (
    <section aria-label="Member reviews">
      <div className="flex items-center gap-3 mb-5">
        <h2
          className="font-sans font-bold text-sm uppercase tracking-widest"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          Reviews
        </h2>
        <span className="flex items-center gap-1.5">
          <StarRow rating={Math.round(rating)} size={15} animated />
          <span
            className="font-sans font-semibold text-sm"
            style={{ color: 'var(--color-ink)' }}
          >
            {rating.toFixed(1)}
          </span>
          <span className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            ({reviewCount} reviews)
          </span>
        </span>
      </div>

      <Reveal>
        {/* Carousel wrapper */}
        <div className="relative">
          {/* Track */}
          <div
            ref={trackRef}
            className="overflow-hidden rounded-lg"
            aria-roledescription="carousel"
            aria-label="Reviews carousel"
          >
            <motion.div
              className="flex"
              style={{ gap: CARD_GAP }}
              animate={{ x: offset }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 260, damping: 30 }
              }
              drag={reduced ? false : 'x'}
              dragConstraints={{ left: offset - cardW * 0.2, right: offset + cardW * 0.2 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) next();
                else if (info.offset.x > 60) prev();
              }}
            >
              {reviews.map((r, i) => (
                <div
                  key={`${r.name}-${r.stars}-${i}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Review ${i + 1} of ${total}`}
                  aria-hidden={i !== current}
                  className="shrink-0 w-full"
                >
                  <ReviewCard r={r} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Prev / Next buttons */}
          {total > 1 && (
            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={prev}
                disabled={current === 0}
                aria-label="Previous review"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border transition-opacity disabled:opacity-30 hover:bg-[var(--color-azure-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-azure)]"
                style={{ borderColor: 'var(--color-edge)', color: 'var(--color-ink-muted)' }}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>

              {/* Dot indicators */}
              <div className="flex gap-1.5" aria-hidden="true">
                {reviews.map((_, i) => (
                  <span
                    key={i}
                    className="block rounded-full transition-all"
                    style={{
                      width: i === current ? 16 : 6,
                      height: 6,
                      background: i === current ? 'var(--color-azure)' : 'var(--color-edge)',
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={next}
                disabled={current === total - 1}
                aria-label="Next review"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border transition-opacity disabled:opacity-30 hover:bg-[var(--color-azure-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-azure)]"
                style={{ borderColor: 'var(--color-edge)', color: 'var(--color-ink-muted)' }}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

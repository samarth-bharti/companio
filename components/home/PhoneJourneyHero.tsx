'use client';

import { useRef } from 'react';
import { motion, useTransform, useReducedMotion, cubicBezier } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useJsScroll } from '@/lib/useJsScroll';
import { HeroCopyState0, HeroCopyState1, HeroCopyState2 } from './phone/HeroCopy';
import { useIsMobile } from '@/lib/useIsMobile';

// Smooth in-out used for every scroll-linked dissolve so transitions ease into
// and out of each beat instead of tracking the scrollbar linearly.
const EASE = cubicBezier(0.42, 0, 0.2, 1);

// Light readability veil over the video so the dark hero copy stays legible while
// the cinematic footage shows through (keeps the site's light/airy aesthetic).
// Scrim opacity matched to comp 2 (lighter veil → the video shows through more).
const SCRIM =
  'radial-gradient(ellipse 80% 55% at 50% 48%, rgba(251,252,255,0.45) 0%, rgba(251,252,255,0.25) 70%, rgba(251,252,255,0.18) 100%), linear-gradient(180deg, rgba(251,252,255,0.38) 0%, rgba(251,252,255,0.25) 45%, rgba(251,252,255,0.20) 100%)';

// Soft white halo behind the dark copy so it stays legible over busy footage.
const COPY_HALO = '0 1px 18px rgba(251,252,255,0.6)';

// Bottom fade into the dark panel colour (--color-ink-dark-panel = #14122A) that
// follows the hero. Doubles as a soft shadow. The first (radial) layer adds a
// little extra darkness in the bottom-right corner, where the source video's
// watermark sits, so it disappears without over-darkening the whole band.
const BOTTOM_FADE =
  'radial-gradient(60% 90% at 90% 100%, rgba(20,18,42,0.72) 0%, rgba(20,18,42,0.28) 55%, rgba(20,18,42,0) 100%),' +
  'linear-gradient(to top,' +
  ' rgba(20,18,42,0.96) 0%,' +
  ' rgba(20,18,42,0.86) 18%,' +
  ' rgba(20,18,42,0.48) 46%,' +
  ' rgba(20,18,42,0.14) 74%,' +
  ' rgba(20,18,42,0) 100%)';

function VideoBackground() {
  return (
    <>
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div aria-hidden="true" className="absolute inset-0" style={{ zIndex: 10, background: SCRIM }} />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0"
        style={{ zIndex: 12, height: 'min(42%, 340px)', background: BOTTOM_FADE }}
      />
    </>
  );
}

function AmbientBlobs() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full opacity-15 blur-2xl" style={{ background: 'var(--color-azure)' }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-[0.12] blur-2xl" style={{ background: 'var(--color-violet)' }} />
    </>
  );
}

/**
 * Centered scroll-driven hero with a full-bleed cinematic video background.
 * Three copy states cross-fade in a single centered column while sliding from
 * alternating sides (state 1 from the right, state 2 from the left); cursor
 * stickers trail on top. The video sits behind a light scrim for legibility.
 * Reduced motion: collapses to a static centered state-0 layout with no video.
 */
export function PhoneJourneyHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();
  const isMobile = useIsMobile();

  const { scrollYProgress } = useJsScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Contiguous crossfades — each beat fades OUT exactly as the next fades IN, so
  // the hero is never blank between states (a true dissolve, not a gap-then-pop).
  // First beat changes EARLY (short hold→0.10, snappy dissolve 0.10–0.22) so the
  // story starts with little scroll; the second beat keeps its later, calmer
  // timing (B holds→0.60, B↔C dissolve 0.60–0.72, C holds→end).
  const opA = useTransform(scrollYProgress, [0, 0.10, 0.22], [1, 1, 0], { ease: EASE });
  const opB = useTransform(scrollYProgress, [0.10, 0.22, 0.60, 0.72], [0, 1, 1, 0], { ease: EASE });
  const opC = useTransform(scrollYProgress, [0.60, 0.72, 1], [0, 1, 1], { ease: EASE });

  // Calm vertical drift: the entering beat rises from just below and settles;
  // the exiting beat lifts. Softer than a horizontal slide when two beats
  // briefly overlap mid-dissolve.
  const yA = useTransform(scrollYProgress, [0, 0.10, 0.22], [0, 0, -22], { ease: EASE });
  const yB = useTransform(scrollYProgress, [0.10, 0.22, 0.60, 0.72], [22, 0, 0, -30], { ease: EASE });
  const yC = useTransform(scrollYProgress, [0.60, 0.72, 1], [30, 0, 0], { ease: EASE });

  // Micro-scale only on the lighter later beats. The state-0 block (H1 + CTAs +
  // trust row) is heavy; scaling it caused the first-merge jank, so it animates
  // opacity + translate only.
  const scaleB = useTransform(scrollYProgress, [0.10, 0.22, 0.60, 0.72], [0.985, 1, 1, 0.98], { ease: EASE });
  const scaleC = useTransform(scrollYProgress, [0.60, 0.72, 1], [0.985, 1, 1], { ease: EASE });

  // Disable pointer events on state-0 CTAs once they have faded out.
  const ptr0 = useTransform(opA, (v) => (v < 0.4 ? 'none' : 'auto'));

  // Scroll cue fades out as soon as the journey starts.
  const opCue = useTransform(scrollYProgress, [0, 0.07], [1, 0]);

  // ── Static branch: reduced motion (no video) ─────────────────────────────
  if (shouldReduce) {
    return (
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--grad-hero-bg)' }}
      >
        <AmbientBlobs />
        <div className="relative z-30 max-w-4xl mx-auto px-6 py-28 md:py-32 w-full">
          <HeroCopyState0 />
        </div>
      </section>
    );
  }

  // ── Mobile branch: video background, single static state (no scroll scene) ─
  if (isMobile) {
    return (
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--grad-hero-bg)' }}
      >
        <VideoBackground />
        <div className="relative z-30 max-w-4xl mx-auto px-6 py-28 w-full" style={{ textShadow: COPY_HALO }}>
          <HeroCopyState0 />
        </div>
      </section>
    );
  }

  // ── Full scroll-driven scene with video background ───────────────────────
  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="hero-heading"
      className="relative"
      style={{ height: '200vh', background: 'var(--grad-hero-bg)' }}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <VideoBackground />

        {/* Single centered column. State 0 sizes it in normal flow; states 1–2
            overlay it, centered. z-30 keeps copy above scrim/stickers. */}
        <div className="relative z-30 max-w-4xl mx-auto px-6 w-full" style={{ textShadow: COPY_HALO }}>
          <motion.div style={{ opacity: opA, y: yA, pointerEvents: ptr0, willChange: 'transform, opacity' }}>
            <HeroCopyState0 />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ opacity: opB, y: yB, scale: scaleB, willChange: 'transform, opacity' }}
          >
            <HeroCopyState1 />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ opacity: opC, y: yC, scale: scaleC, willChange: 'transform, opacity' }}
          >
            <HeroCopyState2 />
          </motion.div>
        </div>

        {/* Scroll cue — invites the scroll-story, fades on first scroll. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: opCue }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1"
        >
          {/* Light-on-dark: the bottom fade darkens this corner of the hero. */}
          <span className="text-xs font-sans tracking-wide" style={{ color: 'rgba(244,242,255,0.75)' }}>
            Scroll
          </span>
          <ChevronDown size={18} className="animate-bounce" style={{ color: 'rgba(244,242,255,0.75)' }} aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { useRef } from 'react';
import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { useJsScroll } from '@/lib/useJsScroll';
import { HeroCopyState0, HeroCopyState1, HeroCopyState2 } from './phone/HeroCopy';
import { CursorStickers } from './CursorStickers';
import { useIsMobile } from '@/lib/useIsMobile';

// Light readability veil over the video so the dark hero copy stays legible while
// the cinematic footage shows through (keeps the site's light/airy aesthetic).
const SCRIM =
  'radial-gradient(ellipse 80% 55% at 50% 48%, rgba(251,252,255,0.74) 0%, rgba(251,252,255,0.4) 70%, rgba(251,252,255,0.32) 100%), linear-gradient(180deg, rgba(251,252,255,0.55) 0%, rgba(251,252,255,0.42) 45%, rgba(251,252,255,0.7) 100%)';

// Soft white halo behind the dark copy so it stays legible over busy footage.
const COPY_HALO = '0 1px 18px rgba(251,252,255,0.6)';

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

  // Sequential, non-overlapping opacity bands (each fades out before the next in).
  const opA = useTransform(scrollYProgress, [0, 0.26, 0.34], [1, 1, 0]);
  const opB = useTransform(scrollYProgress, [0.40, 0.48, 0.60, 0.68], [0, 1, 1, 0]);
  const opC = useTransform(scrollYProgress, [0.74, 0.82, 1], [0, 1, 1]);

  // Minimal horizontal slide, alternating sides: state 0 exits left, state 1
  // enters from the right (exits left), state 2 enters from the left.
  const xA = useTransform(scrollYProgress, [0, 0.26, 0.34], [0, 0, -44]);
  const xB = useTransform(scrollYProgress, [0.40, 0.48, 0.60, 0.68], [44, 0, 0, -44]);
  const xC = useTransform(scrollYProgress, [0.74, 0.82, 1], [-44, 0, 0]);

  // Disable pointer events on state-0 CTAs once they have faded out.
  const ptr0 = useTransform(opA, (v) => (v < 0.3 ? 'none' : 'auto'));

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
      style={{ height: '240vh', background: 'var(--grad-hero-bg)' }}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <VideoBackground />
        <CursorStickers />

        {/* Single centered column. State 0 sizes it in normal flow; states 1–2
            overlay it, centered. z-30 keeps copy above scrim/stickers. */}
        <div className="relative z-30 max-w-4xl mx-auto px-6 w-full" style={{ textShadow: COPY_HALO }}>
          <motion.div style={{ opacity: opA, x: xA, pointerEvents: ptr0, willChange: 'transform, opacity' }}>
            <HeroCopyState0 />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ opacity: opB, x: xB, willChange: 'transform, opacity' }}
          >
            <HeroCopyState1 />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ opacity: opC, x: xC, willChange: 'transform, opacity' }}
          >
            <HeroCopyState2 />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

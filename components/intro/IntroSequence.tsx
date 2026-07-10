'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Seal } from '@/components/ui/Seal';

const STORE_KEY = 'companio_intro_seen';
const DISMISS_AFTER_MS = 1900;

/**
 * Shard configs: each geometric fragment starts off-screen and flies to centre,
 * converging around the Seal mark that assembles behind them. Trimmed to 5
 * (one per corner + top) so fewer simultaneous animations compete for the main
 * thread during the page-load / LCP window.
 */
const SHARDS = [
  { id: 'a', dx: -140, dy: -95,  r: -48, color: '#2E6BFF', w: 24, h: 32 },
  { id: 'b', dx:  148, dy: -80,  r:  33, color: '#7A4FE0', w: 20, h: 26 },
  { id: 'c', dx:  -92, dy:  108, r:  62, color: '#FFB23E', w: 22, h: 18 },
  { id: 'd', dx:  108, dy:   98, r: -22, color: '#1FAE6B', w: 18, h: 22 },
  { id: 'e', dx:  -52, dy: -152, r:  17, color: '#2E6BFF', w: 16, h: 20 },
] as const;

/**
 * Cinematic on-load intro — shown once per session.
 * Geometric shards fly in and converge around the Companio mark, which
 * assembles and glows before the overlay dissolves into the hero beneath.
 * Skipped entirely under prefers-reduced-motion.
 * Skippable via click / Esc / first scroll.
 */
export function IntroSequence() {
  const shouldReduce = useEffectiveReducedMotion();
  const [show, setShow] = useState(false);

  const dismiss = useCallback(() => setShow(false), []);

  useEffect(() => {
    if (shouldReduce) return;
    if (typeof sessionStorage === 'undefined') return;
    // Per session: plays on each fresh visit / new tab, never on internal nav.
    if (sessionStorage.getItem(STORE_KEY)) return;
    sessionStorage.setItem(STORE_KEY, '1');
    setShow(true);
    const t = setTimeout(dismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(t);
  }, [shouldReduce, dismiss]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', dismiss, { once: true, passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', dismiss);
    };
  }, [show, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="cinematic-intro"
          aria-hidden="true"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none"
          style={{ background: 'var(--color-ink-dark-panel)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: [0.7, 0, 0.84, 0] }}
          onClick={dismiss}
        >
          {/* Ambient radial backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at center, rgba(122,79,224,0.25) 0%, transparent 70%)',
            }}
          />

          {/* Skip — only tabbable element */}
          <button
            aria-label="Skip intro"
            tabIndex={0}
            className="absolute top-6 right-6 text-xs font-sans font-semibold px-4 py-2 rounded-pill border transition-colors hover:bg-white/10 focus-visible:outline-white"
            style={{ color: 'rgba(244,242,255,0.45)', borderColor: 'rgba(244,242,255,0.14)' }}
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
          >
            Skip
          </button>

          {/* Shard assembly + Seal mark */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 200, height: 200 }}
          >
            {/* Geometric fragments — fly in, converge, fade out as mark appears */}
            {SHARDS.map((shard, i) => (
              <motion.div
                key={shard.id}
                aria-hidden="true"
                className="absolute"
                style={{
                  width: shard.w,
                  height: shard.h,
                  background: shard.color,
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  willChange: 'transform, opacity',
                }}
                initial={{ x: shard.dx, y: shard.dy, rotate: shard.r, opacity: 0, scale: 0.2 }}
                animate={{
                  x:       [shard.dx, 0,    0],
                  y:       [shard.dy, 0,    0],
                  rotate:  [shard.r,  0,    0],
                  opacity: [0,        0.85, 0],
                  scale:   [0.2,      1,    0.15],
                }}
                transition={{
                  duration: 1.25,
                  times: [0, 0.48, 1],
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.035,
                }}
              />
            ))}

            {/* Aurora glow ring that sweeps as shards converge */}
            <motion.div
              aria-hidden="true"
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 130,
                height: 130,
                background:
                  'conic-gradient(from 0deg, rgba(46,107,255,0.3), rgba(122,79,224,0.5), rgba(255,178,62,0.3), rgba(46,107,255,0.3))',
                filter: 'blur(8px)',
                willChange: 'transform, opacity',
              }}
              initial={{ opacity: 0, rotate: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.9, 0], rotate: 360, scale: [0.4, 1.5, 1.5] }}
              transition={{ delay: 0.48, duration: 1.5, ease: 'easeOut' }}
            />

            {/* Seal mark: assembles as shards converge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotate: -14 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <Seal size={100} label="Companio" />
            </motion.div>
          </div>

          {/* Brand name + tagline */}
          <motion.div
            className="mt-7 flex flex-col items-center gap-2 relative z-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.88, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="font-display font-semibold tracking-tight"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-panel-text)' }}
            >
              Companio
            </span>
            <span
              className="font-sans text-center"
              style={{ fontSize: '1rem', color: 'rgba(244,242,255,0.5)' }}
            >
              Real company, for everything better with someone.
            </span>
          </motion.div>

          {/* Progress bar fills over the session duration */}
          <motion.div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-[3px] pointer-events-none"
            style={{ background: 'var(--grad-aurora)' }}
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            animate={{ scaleX: 1 }}
            transition={{ duration: DISMISS_AFTER_MS / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

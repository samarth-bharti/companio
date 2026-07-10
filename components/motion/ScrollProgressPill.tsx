'use client';

import { useEffect, useState } from 'react';
import { useScroll, useSpring, motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
/**
 * Slim right-side vertical scroll-progress indicator.
 * Driven by document scroll; spring-smoothed for fine-pointer devices.
 * Hidden on touch viewports (md breakpoint + up).
 * Under prefers-reduced-motion the spring is bypassed — still shows progress
 * but without springy lag.
 */
export function ScrollProgressPill() {
  const { scrollYProgress } = useScroll();
  const shouldReduce = useEffectiveReducedMotion();
  const smoothed = useSpring(scrollYProgress, { stiffness: 180, damping: 28, restDelta: 0.001 });

  // Render only after mount: server + first client render both produce null,
  // so they match. This avoids the framer-motion SSR hydration mismatch where
  // useEffectiveReducedMotion()/useScroll() differ between server and client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none hidden md:flex flex-col items-center"
    >
      <div
        className="relative overflow-hidden rounded-full"
        style={{ width: 4, height: 96, background: 'rgba(46,107,255,0.14)' }}
      >
        <motion.div
          className="absolute top-0 left-0 right-0 rounded-full"
          style={{
            height: '100%',
            scaleY: shouldReduce ? scrollYProgress : smoothed,
            transformOrigin: 'top',
            background: 'var(--grad-aurora)',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
}

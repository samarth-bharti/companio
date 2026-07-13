'use client';

import { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { useJsScroll } from '@/lib/useJsScroll';
import { cn } from '@/lib/utils';

interface ColorMorphBridgeProps {
  /**
   * Hex color at the top of the bridge (source section).
   * Must be a literal hex string — NOT a CSS var — because framer-motion
   * interpolates color channels numerically.
   */
  from: string;
  /**
   * Hex color at the bottom of the bridge (destination section).
   * Same constraint as `from`.
   */
  to: string;
  /** Height in vh units. Default: 28. */
  heightVh?: number;
  className?: string;
}

/**
 * ColorMorphBridge — scroll-driven background tween between two sections.
 *
 * As the bridge scrolls through the viewport, its backgroundColor smoothly
 * transitions from `from` to `to` using framer-motion's useTransform.
 * The tween is active between [20 %, 80 %] of scroll progress so the extremes
 * snap cleanly to each section's solid colour.
 *
 * Reduced motion: renders a static linear-gradient instead (no scroll binding).
 * aria-hidden — purely decorative transition element.
 */
export function ColorMorphBridge({
  from,
  to,
  heightVh = 28,
  className,
}: ColorMorphBridgeProps) {
  const ref = useRef<HTMLDivElement>(null);
  // SSR-safe: framer's useReducedMotion() is false on the server but true on the
  // client's first render, so branching markup on it fails hydration. This hook
  // returns false until mounted.
  const shouldReduce = useEffectiveReducedMotion();

  const { scrollYProgress } = useJsScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const backgroundColor = useTransform(scrollYProgress, [0.2, 0.8], [from, to]);

  if (shouldReduce) {
    return (
      <div
        aria-hidden="true"
        className={cn('w-full', className)}
        style={{
          height: `${heightVh}vh`,
          background: `linear-gradient(to bottom, ${from}, ${to})`,
        }}
      />
    );
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('w-full', className)}
      style={{ height: `${heightVh}vh` }}
    >
      <motion.div className="w-full h-full" style={{ backgroundColor }} />
    </div>
  );
}

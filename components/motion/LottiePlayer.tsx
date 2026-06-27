'use client';

/**
 * LottiePlayer — lazy, viewport-aware, reduced-motion-safe Lottie wrapper.
 *
 * Performance model:
 * - Dynamic-imports lottie-react so it never lands in the initial bundle.
 * - Fetches JSON only on first viewport entry (100 px margin).
 * - Keeps IntersectionObserver alive after first load to PAUSE the animation
 *   when it scrolls out of view and RESUME when it re-enters.
 *   This is the key fix for CPU lag when multiple Lotties exist on one page.
 * - prefers-reduced-motion → frozen first frame, no loop, no play.
 * - Always aria-hidden (decorative use only).
 */

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LottiePlayerProps {
  src: string;           // path under /public, e.g. "/lottie/high-five.json"
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  speed?: number;
}

export function LottiePlayer({
  src,
  width = 160,
  height = 160,
  className,
  style,
  loop = true,
  // speed kept in signature for API compat; lottie-react speed is set on the ref
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lottieRef = useRef<any>(null);

  const hasLoadedRef = useRef(false);

  const [animationData, setAnimationData] = useState<object | null>(null);

  // Single source of truth (honours the global motion toggle).
  const reducedMotion = useEffectiveReducedMotion();
  // Stable ref so the IntersectionObserver callback never captures a stale value.
  // Updated in an effect (not during render) — the observer reads it at scroll
  // time, so a post-commit update is soon enough.
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  // Live-apply toggle changes to an already-mounted animation.
  useEffect(() => {
    const l = lottieRef.current;
    if (!l || !animationData) return;
    if (reducedMotion) l.goToAndStop(0, true);
    else l.play();
  }, [reducedMotion, animationData]);

  // Two observers with different margins:
  // ① loadObs (1200px out) — fetch + parse the JSON well BEFORE the animation
  //   is visible. Large files (accent-2 is ~600 KB) need the head start, or the
  //   user sees an empty box and the parse janks the scroll right at arrival.
  // ② playObs (100px) — pause off-screen / resume in-view to free CPU.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const loadObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoadedRef.current) {
          hasLoadedRef.current = true;
          fetch(src)
            .then((r) => r.json())
            .then(setAnimationData)
            .catch(() => {/* decorative animation — fail silently, no console noise */});
          loadObs.disconnect();
        }
      },
      { rootMargin: '1200px 0px' },
    );

    const playObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (lottieRef.current && !reducedMotionRef.current) {
            lottieRef.current.play();
          }
        } else {
          lottieRef.current?.pause();
        }
      },
      { rootMargin: '100px' },
    );

    loadObs.observe(el);
    playObs.observe(el);
    return () => {
      loadObs.disconnect();
      playObs.disconnect();
    };
  }, [src]); // re-create only if src changes

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ width, height, ...style }}
    >
      {animationData && (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={reducedMotion ? false : loop}
          autoplay={!reducedMotion}
          // On reduced-motion: jump to frame 0 and freeze.
          initialSegment={reducedMotion ? [0, 1] : undefined}
          // progressiveLoad spreads SVG DOM construction across frames —
          // large files otherwise block the main thread on init.
          rendererSettings={{ progressiveLoad: true }}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
}

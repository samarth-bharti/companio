'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';
import { BadgeCheck, MapPin } from 'lucide-react';
import { AppMockup } from './AppMockup';

type CachedRect = { left: number; top: number; width: number; height: number };

function FloatingChip({
  depth,
  springX,
  springY,
  children,
  className,
  style,
}: {
  depth: number;
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const x = useTransform(springX, (v) => v * depth);
  const y = useTransform(springY, (v) => v * depth);
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, willChange: 'transform', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Right-side visual column: AppMockup + layered parallax chips.
 * Perf fixes vs previous version:
 *  - rect cached on mount/resize/mouseenter (no getBCR inside onMouseMove)
 *  - pointer updates are rAF-throttled (one motionValue.set per frame max)
 *  - live-meetup chip uses solid bg — no backdrop-filter on a moving element
 *  - will-change: transform on chips only
 */
export function AppMockupVisual({ scrollY }: { scrollY: MotionValue<number> }) {
  const shouldReduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cachedRect = useRef<CachedRect | null>(null);
  const rafPending = useRef(false);
  const pendingX = useRef(0);
  const pendingY = useRef(0);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 80, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 80, damping: 22 });

  useEffect(() => {
    setFine(window.matchMedia('(pointer: fine)').matches);
  }, []);

  useEffect(() => {
    const cacheRect = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      cachedRect.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    cacheRect();
    window.addEventListener('resize', cacheRect, { passive: true });
    return () => window.removeEventListener('resize', cacheRect);
  }, []);

  const onMouseEnter = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    cachedRect.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduce || !fine || !cachedRect.current) return;
      const { left, top, width, height } = cachedRect.current;
      pendingX.current = e.clientX - left - width / 2;
      pendingY.current = e.clientY - top - height / 2;
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(() => {
        rawX.set(pendingX.current);
        rawY.set(pendingY.current);
        rafPending.current = false;
      });
    },
    [shouldReduce, fine, rawX, rawY]
  );

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <motion.div
      ref={ref}
      className="relative flex items-center justify-center"
      style={shouldReduce ? {} : { y: scrollY, willChange: 'transform' }}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Ambient glow — static, reduced from blur-3xl/w-80 to keep overdraw low */}
      <div
        aria-hidden="true"
        className="absolute w-64 h-64 rounded-full blur-2xl opacity-18 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2E6BFF 0%, #7A4FE0 100%)' }}
      />

      <FloatingChip depth={0.01} springX={springX} springY={springY}>
        <AppMockup />
      </FloatingChip>

      {/* Verified badge chip */}
      <FloatingChip
        depth={0.06}
        springX={springX}
        springY={springY}
        className="absolute -top-4 -right-4"
      >
        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-2xl font-sans text-xs font-bold text-white shadow-lg"
          style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <BadgeCheck size={13} aria-hidden="true" />
          ID verified
        </motion.div>
      </FloatingChip>

      {/* Live meetup chip — solid bg replaces backdrop-filter: blur() on a moving element */}
      <FloatingChip
        depth={0.09}
        springX={springX}
        springY={springY}
        className="absolute -bottom-3 -left-8"
      >
        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-2xl font-sans text-xs font-semibold shadow-lg"
          style={{
            background: '#1A1836',
            border: '1px solid rgba(31,174,107,0.4)',
            color: 'var(--color-panel-text)',
          }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
              style={{ background: 'var(--color-emerald)' }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: 'var(--color-emerald)' }}
            />
          </span>
          840 meetups this week
        </motion.div>
      </FloatingChip>

      {/* City chip */}
      <FloatingChip
        depth={0.12}
        springX={springX}
        springY={springY}
        className="absolute top-10 -left-12"
      >
        <motion.div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl font-sans text-xs font-semibold shadow-lg"
          style={{
            background: '#FFF8EC',
            border: '1.5px solid rgba(255,178,62,0.4)',
            color: 'var(--color-ink)',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <MapPin size={12} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
          38 cities
        </motion.div>
      </FloatingChip>

      {/* Rating chip */}
      <FloatingChip
        depth={0.07}
        springX={springX}
        springY={springY}
        className="absolute bottom-12 -right-10"
      >
        <motion.div
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl font-sans text-xs font-bold shadow-lg"
          style={{ background: '#F0EBFF', border: '1.5px solid rgba(122,79,224,0.3)', color: '#7A4FE0' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          ★ 4.9 rated
        </motion.div>
      </FloatingChip>
    </motion.div>
  );
}

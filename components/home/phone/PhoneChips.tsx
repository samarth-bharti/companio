'use client';

import { useRef, useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue, type MotionStyle } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { BadgeCheck, Check } from 'lucide-react';

/** Parallax wrapper: pointer offset scaled by `depth`, optional scroll-opacity via `style`. */
function FloatingChip({
  depth,
  springX,
  springY,
  children,
  className,
  style,
}: {
  depth: number;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  children: ReactNode;
  className?: string;
  style?: MotionStyle;
}) {
  const x = useTransform(springX, (v: number) => v * depth);
  const y = useTransform(springY, (v: number) => v * depth);
  return (
    <motion.div aria-hidden="true" style={{ x, y, willChange: 'transform', ...style }} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Wraps the phone column: adds ambient glow, pointer-parallax, and 3 scroll-state chips.
 * Chip opacity bands:
 *   "ID verified" — visible states 0–1 (0→0.04→0.62→0.72 → 0,1,1,0)
 *   "★ 4.9 rated"      — peaks in state 1  (0.30→0.40→0.62→0.72 → 0,1,1,0)
 *   "Booked ✓"         — fades in state 2  (0.66→0.76→1 → 0,1,1)
 */
export function PhoneChipsWrapper({
  scrollYProgress,
  children,
}: {
  scrollYProgress: MotionValue<number>;
  children: ReactNode;
}) {
  const shouldReduce = useEffectiveReducedMotion();
  const [fine, setFine] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cachedRect = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const rafPending = useRef(false);
  const pendingX = useRef(0);
  const pendingY = useRef(0);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 80, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 80, damping: 22 });

  // Scroll-state opacity for each chip
  const aadhaarOp = useTransform(scrollYProgress, [0, 0.04, 0.62, 0.72], [0, 1, 1, 0]);
  const ratingOp  = useTransform(scrollYProgress, [0.30, 0.40, 0.62, 0.72], [0, 1, 1, 0]);
  const bookedOp  = useTransform(scrollYProgress, [0.66, 0.76, 1], [0, 1, 1]);

  useEffect(() => { setFine(window.matchMedia('(pointer: fine)').matches); }, []);

  useEffect(() => {
    const cache = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      cachedRect.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    cache();
    window.addEventListener('resize', cache, { passive: true });
    return () => window.removeEventListener('resize', cache);
  }, []);

  const onMouseEnter = useCallback(() => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    cachedRect.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
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
  }, [shouldReduce, fine, rawX, rawY]);

  const onMouseLeave = useCallback(() => { rawX.set(0); rawY.set(0); }, [rawX, rawY]);

  return (
    <div
      ref={wrapRef}
      className="relative flex items-center justify-center"
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Ambient glow behind phone */}
      <div aria-hidden="true" className="absolute w-64 h-64 rounded-full blur-2xl opacity-[0.18] pointer-events-none" style={{ background: 'radial-gradient(circle, #2E6BFF 0%, #7A4FE0 100%)' }} />

      {/* Phone + tilt — depth 0.01 for subtle body parallax */}
      <FloatingChip depth={0.01} springX={springX} springY={springY}>
        {children}
      </FloatingChip>

      {/* ID verified — states 0–1 */}
      <FloatingChip depth={0.06} springX={springX} springY={springY} className="absolute -top-4 -right-4" style={{ opacity: aadhaarOp }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl font-sans text-xs font-bold text-white shadow-lg" style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}>
          <BadgeCheck size={13} aria-hidden="true" />
          ID verified
        </div>
      </FloatingChip>

      {/* ★ 4.9 rated — peaks in state 1 */}
      <FloatingChip depth={0.07} springX={springX} springY={springY} className="absolute bottom-12 -right-10" style={{ opacity: ratingOp }}>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl font-sans text-xs font-bold shadow-lg" style={{ background: '#F0EBFF', border: '1.5px solid rgba(122,79,224,0.3)', color: '#7A4FE0' }}>
          ★ 4.9 rated
        </div>
      </FloatingChip>

      {/* Booked ✓ — state 2 */}
      <FloatingChip depth={0.09} springX={springX} springY={springY} className="absolute -bottom-3 -left-8" style={{ opacity: bookedOp }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl font-sans text-xs font-bold shadow-lg" style={{ background: '#E6F5EE', border: '1.5px solid rgba(31,174,107,0.35)', color: '#157A4A' }}>
          <Check size={11} aria-hidden="true" />
          Booked ✓
        </div>
      </FloatingChip>
    </div>
  );
}

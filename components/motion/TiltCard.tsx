'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation angle in degrees. Default 7. */
  maxDeg?: number;
}

/**
 * CSS 3D perspective tilt that follows the cursor while hovering.
 * Springs back to flat on mouse-leave.
 *
 * Only activates on (pointer: fine) — i.e. desktop mouse.
 * Disabled for reduced-motion. Touch screens see no effect.
 */
export function TiltCard({ children, className, maxDeg = 7 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia('(pointer: fine)').matches);
  }, []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springCfg = { stiffness: 260, damping: 24 };

  // mx: [-0.5, 0.5] → rotateY: [-maxDeg, +maxDeg]
  // my: [-0.5, 0.5] → rotateX: [+maxDeg, -maxDeg]
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-maxDeg, maxDeg]), springCfg);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [maxDeg, -maxDeg]), springCfg);

  // RAF-throttle the pointer read. Mousemove can fire many times per frame;
  // calling getBoundingClientRect() on each event forces a layout reflow every
  // time — multiplied across every card in a grid, that's the jank/freeze.
  // Coalescing to one rect read per frame removes the layout thrash.
  const rafId = useRef<number | null>(null);
  const pending = useRef({ x: 0, y: 0 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      pending.current = { x: e.clientX, y: e.clientY };
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const el = ref.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        mx.set((pending.current.x - left) / width - 0.5);
        my.set((pending.current.y - top) / height - 0.5);
      });
    },
    [mx, my]
  );

  const onLeave = useCallback(() => {
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  // Cancel any in-flight frame on unmount (cards unmount on filter/grid changes).
  useEffect(() => () => { if (rafId.current !== null) cancelAnimationFrame(rafId.current); }, []);

  const active = fine && !shouldReduce;

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={
        active
          ? { perspective: 900, rotateX, rotateY, transformStyle: 'preserve-3d' }
          : {}
      }
      onMouseMove={active ? onMove : undefined}
      onMouseLeave={active ? onLeave : undefined}
    >
      {children}
    </motion.div>
  );
}

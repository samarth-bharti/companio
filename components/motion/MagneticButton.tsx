'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum pixel offset in any direction. */
  maxShift?: number;
}

/**
 * Pointer-follow magnetic wrapper for Button.
 * Only activates on (pointer: fine) — i.e. desktop with a mouse.
 * Touch screens see no effect, preventing accidental layout shifts.
 */
export function MagneticButton({ children, className, maxShift = 6 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useEffectiveReducedMotion();
  const [pointerFine, setPointerFine] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPointerFine(window.matchMedia('(pointer: fine)').matches);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || shouldReduce || !pointerFine) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;
    setPos({
      x: ((e.clientX - cx) / (width / 2)) * maxShift,
      y: ((e.clientY - cy) / (height / 2)) * maxShift,
    });
  }, [shouldReduce, pointerFine, maxShift]);

  const onMouseLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  return (
    <motion.div
      ref={ref}
      className={cn('inline-flex', className)}
      animate={pos}
      whileHover={{ scale: pointerFine && !shouldReduce ? 1.02 : 1 }}
      transition={spring.snappy}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  );
}

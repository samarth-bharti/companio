'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { useJsScroll } from '@/lib/useJsScroll';
import { cn } from '@/lib/utils';

interface ParallaxLayerProps {
  children: React.ReactNode;
  /**
   * Parallax intensity: 0.2 = moves 20px for every 100px scrolled past.
   * Negative values move opposite to scroll direction.
   */
  depth?: number;
  className?: string;
}

/**
 * Wraps content in a scroll-driven vertical parallax.
 * Disabled on reduced-motion and viewports narrower than 768px (touch-only)
 * because the effect causes motion sickness on mobile.
 */
export function ParallaxLayer({ children, depth = 0.2, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useEffectiveReducedMotion();
  const [isWide, setIsWide] = useState(true);

  useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 768);
    check();
    const mq = window.matchMedia('(min-width: 768px)');
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  const { scrollYProgress } = useJsScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const yRange = depth * 100;
  const y = useTransform(scrollYProgress, [0, 1], [-yRange, yRange]);
  const disabled = shouldReduce || !isWide;

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.div style={disabled ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
}

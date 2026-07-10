'use client';

import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { cn } from '@/lib/utils';
import { durations } from '@/lib/motion';
import { useRevealInView } from '@/lib/useRevealInView';

interface CountUpProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  /** Animation duration in seconds. Defaults to durations.slow. */
  duration?: number;
}

/**
 * Animates a number from 0 to `value` when it enters the viewport.
 * Flashes --color-cyan-spark on completion to signal the "ding" moment.
 * On reduced-motion, shows the final value immediately with no animation.
 */
export function CountUp({
  value,
  suffix = '',
  prefix = '',
  className,
  duration = durations.slow,
}: CountUpProps) {
  const shouldReduce = useEffectiveReducedMotion();
  // Bulletproof trigger so the counter can't stick at 0 if its observer misses.
  const { ref, revealed: isInView } = useRevealInView<HTMLSpanElement>();
  const [flashed, setFlashed] = useState(false);

  useEffect(() => {
    if (!isInView || !ref.current) return;

    if (shouldReduce) {
      ref.current.textContent = `${prefix}${value}${suffix}`;
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(v)}${suffix}`;
        }
      },
      onComplete() {
        setFlashed(true);
        setTimeout(() => setFlashed(false), 480);
      },
    });

    return () => controls.stop();
  }, [isInView, value, shouldReduce, duration, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={cn(
        'transition-colors',
        flashed ? 'text-cyan-spark' : '',
        className
      )}
      style={{ transitionDuration: 'var(--dur-base)' }}
    >
      {prefix}0{suffix}
    </span>
  );
}

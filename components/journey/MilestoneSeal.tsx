'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Seal } from '@/components/ui/Seal';
import { Confetti } from '@/components/journey/Confetti';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MilestoneSealProps {
  label: string;
  sub?: string;
  size?: number;
  withConfetti?: boolean;
  onDone?: () => void;
  className?: string;
}

export function MilestoneSeal({
  label,
  sub,
  size = 72,
  withConfetti = false,
  onDone,
  className,
}: MilestoneSealProps) {
  const reduced = useEffectiveReducedMotion();

  // When confetti is absent, drive onDone from here.
  // When confetti is present, Confetti calls onDone on completion (including
  // reduced-motion path where it fires immediately).
  useEffect(() => {
    if (withConfetti) return;
    const delay = reduced ? 150 : 1100;
    const t = setTimeout(() => onDone?.(), delay);
    return () => clearTimeout(t);
  }, [reduced, withConfetti, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('relative inline-flex flex-col items-center gap-2', className)}
    >
      {withConfetti && (
        <Confetti count={24} onDone={onDone} />
      )}

      <motion.div
        className="relative z-10"
        initial={reduced ? false : { scale: 0.3, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={spring.stamp}
      >
        <Seal size={size} decorative />
      </motion.div>

      <motion.span
        className="font-display text-center leading-tight"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0.15 }}
        style={{
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        }}
      >
        {label}
      </motion.span>

      {sub && (
        <motion.span
          className="text-sm text-center"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0.25 }}
          style={{ color: 'var(--color-ink-muted)' }}
        >
          {sub}
        </motion.span>
      )}
    </div>
  );
}

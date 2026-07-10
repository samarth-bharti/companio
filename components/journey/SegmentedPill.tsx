'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface SegmentedPillProps {
  /** Step labels in order, e.g. ['City','You','Time']. */
  steps: string[];
  /** Zero-based index of the current step. */
  current: number;
  className?: string;
}

/**
 * SegmentedPill — named-step progress indicator with seal-dots.
 * A dot "stamps in" (spring.stamp) for each completed step; the current step's
 * label is highlighted. Purely presentational; parent owns the step state.
 */
export function SegmentedPill({ steps, current, className }: SegmentedPillProps) {
  const reduced = useEffectiveReducedMotion();

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={current + 1}
      aria-valuetext={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1.5 rounded-pill flex-wrap justify-center',
        className,
      )}
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(46,107,255,0.12)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span key={label} className="flex items-center gap-1 px-1.5">
            {done ? (
              <motion.span
                aria-hidden="true"
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--grad-seal)' }}
                initial={reduced ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={reduced ? { duration: 0 } : spring.stamp}
              />
            ) : (
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: active ? 'var(--color-azure)' : 'transparent',
                  border: active ? 'none' : '1.5px solid rgba(46,107,255,0.3)',
                }}
              />
            )}
            <span
              className="font-sans text-xs font-semibold hidden sm:inline"
              style={{
                color: active
                  ? 'var(--color-ink)'
                  : done
                    ? 'var(--color-ink-muted)'
                    : 'rgba(20,26,46,0.35)',
              }}
            >
              {label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

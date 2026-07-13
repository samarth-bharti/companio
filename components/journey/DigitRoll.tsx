'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { cn } from '@/lib/utils';

interface DigitRollProps {
  value: number;
  className?: string;
  'aria-label'?: string;
}

// spring.soft values extracted — useSpring expects SpringOptions, not Transition
const SPRING_OPTS = { stiffness: 170, damping: 26 };

/**
 * One slot-machine column for a single digit 0–9.
 * Cell height is 1em; the column is 10em tall and translates to show the target digit.
 * Em units in translateY inherit the component's font-size automatically.
 */
function DigitCell({ digit }: { digit: number }) {
  const raw = useSpring(digit, SPRING_OPTS);

  useEffect(() => {
    raw.set(digit);
  }, [digit, raw]);

  // useTransform maps the numeric spring value → an em string for translateY
  const y = useTransform(raw, (v: number) => `${-v}em`);

  return (
    <span
      aria-hidden="true"
      className="inline-block overflow-hidden"
      style={{ height: '1em', lineHeight: '1em', verticalAlign: 'top' }}
    >
      <motion.span
        className="flex flex-col"
        style={{ y, lineHeight: '1em' }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span
            key={d}
            className="block text-center"
            style={{ height: '1em', lineHeight: '1em' }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * DigitRoll — slot-machine vertical digit roll.
 *
 * Each decimal digit in `value` becomes its own animated column (0–9).
 * Non-digit characters (comma, dot) are rendered statically.
 * Accessible: wrapper carries aria-label; animated digits are aria-hidden.
 * Reduced motion: plain text of the final value.
 */
export function DigitRoll({
  value,
  className,
  'aria-label': ariaLabel,
}: DigitRollProps) {
  // SSR-safe: framer's useReducedMotion() is false on the server but true on the
  // client's first render, so branching markup on it fails hydration. This hook
  // returns false until mounted.
  const reduced = useEffectiveReducedMotion();
  const str = String(value);

  if (reduced) {
    return (
      <span
        className={cn('tabular-nums', className)}
        aria-label={ariaLabel ?? str}
      >
        {str}
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex items-start tabular-nums', className)}
      aria-label={ariaLabel ?? str}
    >
      {str.split('').map((char, i) => {
        const digit = parseInt(char, 10);
        if (isNaN(digit)) {
          // Static non-digit character (e.g. comma, period)
          return (
            <span
              key={i}
              aria-hidden="true"
              className="inline-block"
              style={{ lineHeight: '1em' }}
            >
              {char}
            </span>
          );
        }
        // key by position so digit changes at same position animate, not reset
        return <DigitCell key={i} digit={digit} />;
      })}
    </span>
  );
}

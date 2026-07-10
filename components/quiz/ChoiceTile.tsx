'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Check } from 'lucide-react';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ChoiceTileProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  accent?: string;
  className?: string;
}

/**
 * ChoiceTile — tactile selectable option for quiz questions.
 * spring.snappy on select, check-pop on stamp, aria-pressed for a11y.
 */
export function ChoiceTile({
  label,
  selected,
  onClick,
  accent = 'var(--color-azure)',
  className,
}: ChoiceTileProps) {
  const reduced = useEffectiveReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2.5 w-full text-left',
        'px-4 py-3.5 rounded-lg font-sans text-sm font-medium',
        'border min-h-[44px] cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
      style={{
        background: selected ? accent : 'rgba(255,255,255,0.75)',
        borderColor: selected ? accent : 'rgba(46,107,255,0.18)',
        color: selected ? 'white' : 'var(--color-ink)',
        boxShadow: selected ? `0 0 0 3px ${accent}33, var(--shadow-1)` : 'var(--shadow-1)',
        backdropFilter: 'blur(6px)',
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
      }}
      whileHover={reduced ? {} : { scale: 1.01 }}
      whileTap={reduced ? {} : { scale: 0.97 }}
      animate={!reduced && selected ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={spring.snappy}
      aria-pressed={selected}
    >
      <span className="flex-1">{label}</span>

      {selected && (
        <motion.span
          aria-hidden="true"
          className="shrink-0 flex items-center justify-center"
          initial={reduced ? false : { scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={spring.stamp}
        >
          <Check size={16} strokeWidth={2.5} />
        </motion.span>
      )}
    </motion.button>
  );
}

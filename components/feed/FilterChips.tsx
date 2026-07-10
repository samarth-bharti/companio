'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import type { PostType } from './data';

export type FeedFilter = 'all' | PostType;

const CHIPS: { value: FeedFilter; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'activity', label: 'Activities' },
  { value: 'event',    label: 'Events' },
  { value: 'photo',    label: 'Photos' },
];

interface FilterChipsProps {
  value: FeedFilter;
  onChange: (v: FeedFilter) => void;
}

export function FilterChips({ value, onChange }: FilterChipsProps) {
  const reduced = useEffectiveReducedMotion();
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none' }}
      role="group"
      aria-label="Filter posts by type"
    >
      {CHIPS.map(chip => {
        const active = chip.value === value;
        return (
          <motion.button
            key={chip.value}
            onClick={() => onChange(chip.value)}
            whileTap={reduced ? {} : { scale: 0.93 }}
            transition={spring.snappy}
            aria-pressed={active}
            className="shrink-0 px-4 py-1.5 rounded-pill text-sm font-sans font-semibold whitespace-nowrap transition-colors"
            style={
              active
                ? { background: 'var(--color-azure)', color: 'white', boxShadow: 'var(--glow-azure)' }
                : {
                    background: 'rgba(46,107,255,0.07)',
                    color: 'var(--color-ink-muted)',
                    border: '1.5px solid rgba(46,107,255,0.15)',
                  }
            }
          >
            {chip.label}
          </motion.button>
        );
      })}
    </div>
  );
}

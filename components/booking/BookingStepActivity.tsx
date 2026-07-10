'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Check } from 'lucide-react';
import { spring, stagger, calm } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Props {
  activities: string[];
  selected: string;
  onSelect: (a: string) => void;
}

export function BookingStepActivity({ activities, selected, onSelect }: Props) {
  const reduced = useEffectiveReducedMotion();

  return (
    <fieldset className="border-0 p-0 m-0 space-y-4">
      <legend
        className="font-display mb-6 w-full"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h3)',
          color: 'var(--color-ink)',
        }}
      >
        What would you like to do?
      </legend>

      {/* Ghost numeral */}
      <span
        aria-hidden="true"
        className="absolute right-4 top-0 font-display select-none pointer-events-none"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(4rem, 12vw, 7rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: 'rgba(46,107,255,0.07)',
          lineHeight: 1,
        }}
      >
        01
      </span>

      {/* Stagger container — calm entrance for transactional flow */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
        initial={reduced ? false : 'hidden'}
        animate="visible"
      >
        {activities.map((activity) => {
          const isSelected = activity === selected;
          return (
            <motion.div
              key={activity}
              variants={{
                hidden:  { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: calm.base },
              }}
            >
              <motion.button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(activity)}
                className={cn(
                  'relative flex items-center gap-3 w-full text-left rounded-lg p-4',
                  'font-sans font-semibold text-sm transition-colors min-h-[44px]',
                  'focus-visible:outline-2 cursor-pointer',
                )}
                style={{
                  background: isSelected ? 'var(--color-azure-tint)' : 'var(--color-surface)',
                  border: `2px solid ${isSelected ? 'var(--color-azure)' : 'rgba(20,26,46,0.10)'}`,
                  color: isSelected ? 'var(--color-azure-deep)' : 'var(--color-ink)',
                  boxShadow: isSelected ? 'var(--glow-azure)' : 'var(--shadow-1)',
                }}
                whileHover={reduced ? {} : { scale: 1.02 }}
                whileTap={reduced ? {} : { scale: 0.97 }}
                animate={reduced ? {} : { scale: isSelected ? 1.02 : 1 }}
                transition={reduced ? { duration: 0 } : spring.snappy}
              >
                {isSelected && (
                  <motion.span
                    initial={reduced ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={reduced ? { duration: 0 } : { ...spring.stamp, delay: 0.05 }}
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-azure)' }}
                    aria-hidden="true"
                  >
                    <Check size={11} strokeWidth={3} color="white" />
                  </motion.span>
                )}
                <span>{activity}</span>
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </fieldset>
  );
}

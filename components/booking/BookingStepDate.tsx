'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Check } from 'lucide-react';
import { spring, stagger, calm } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface DateOption {
  iso: string;
  label: string;
  sub: string;
}

interface Props {
  selected: string;
  onSelect: (iso: string, label: string) => void;
}

export function BookingStepDate({ selected, onSelect }: Props) {
  const reduced = useEffectiveReducedMotion();
  const [dates, setDates] = useState<DateOption[]>([]);

  useEffect(() => {
    const today = new Date();
    const options: DateOption[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const iso = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-');
      const weekday  = d.toLocaleDateString('en-IN', { weekday: 'long' });
      const shortDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      options.push({
        iso,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : weekday,
        sub: shortDate,
      });
    }
    setDates(options);
  }, []);

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend
        className="font-display mb-6 w-full"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h3)',
          color: 'var(--color-ink)',
        }}
      >
        When works for you?
      </legend>

      {dates.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg animate-pulse"
              style={{ background: 'var(--color-azure-tint)' }}
            />
          ))}
        </div>
      ) : (
        /* Stagger container — calm entrance for transactional flow */
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
          initial={reduced ? false : 'hidden'}
          animate="visible"
        >
          {dates.map((d) => {
            const isSelected = d.iso === selected;
            return (
              <motion.div
                key={d.iso}
                variants={{
                  hidden:  { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: calm.base },
                }}
              >
                <motion.button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(d.iso, d.label)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-0.5 w-full',
                    'rounded-lg p-3 min-h-[60px] font-sans text-sm font-semibold',
                    'transition-colors cursor-pointer focus-visible:outline-2',
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
                  <span className="text-sm font-bold">{d.label}</span>
                  <span className="text-xs opacity-70">{d.sub}</span>
                  {isSelected && (
                    <motion.span
                      initial={reduced ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={reduced ? { duration: 0 } : spring.stamp}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--color-azure)' }}
                      aria-hidden="true"
                    >
                      <Check size={9} strokeWidth={3} color="white" />
                    </motion.span>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </fieldset>
  );
}

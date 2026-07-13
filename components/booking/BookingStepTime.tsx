'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Check } from 'lucide-react';
import { spring, stagger, calm } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TIME_SLOTS = [
  { id: 'morning',   label: 'Morning',   sub: '7-10 AM', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', sub: '12-3 PM', icon: '☀️' },
  { id: 'evening',   label: 'Evening',   sub: '5-8 PM',  icon: '🌆' },
];

interface Props {
  selected: string;
  onSelect: (slot: string) => void;
}

export function BookingStepTime({ selected, onSelect }: Props) {
  const reduced = useEffectiveReducedMotion();

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
        What time suits you?
      </legend>

      {/* Stagger container — calm entrance for transactional flow */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.default } } }}
        initial={reduced ? false : 'hidden'}
        animate="visible"
      >
        {TIME_SLOTS.map((slot) => {
          const isSelected = slot.label === selected;
          return (
            <motion.div
              key={slot.id}
              variants={{
                hidden:  { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: calm.base },
              }}
            >
              <motion.button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(slot.label)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-lg p-5 w-full',
                  'font-sans font-semibold text-sm transition-colors cursor-pointer',
                  'min-h-[44px] focus-visible:outline-2',
                )}
                style={{
                  background: isSelected ? 'var(--color-azure-tint)' : 'var(--color-surface)',
                  border: `2px solid ${isSelected ? 'var(--color-azure)' : 'rgba(20,26,46,0.10)'}`,
                  color: isSelected ? 'var(--color-azure-deep)' : 'var(--color-ink)',
                  boxShadow: isSelected ? 'var(--glow-azure)' : 'var(--shadow-1)',
                }}
                whileHover={reduced ? {} : { scale: 1.02 }}
                whileTap={reduced ? {} : { scale: 0.97 }}
                animate={reduced ? {} : { scale: isSelected ? 1.03 : 1 }}
                transition={reduced ? { duration: 0 } : spring.snappy}
                aria-label={`${slot.label}, ${slot.sub}`}
              >
                <span className="text-2xl" aria-hidden="true">{slot.icon}</span>
                <span className="font-bold">{slot.label}</span>
                <span className="text-xs opacity-70">{slot.sub}</span>
                {isSelected && (
                  <motion.span
                    initial={reduced ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={reduced ? { duration: 0 } : spring.stamp}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-azure)' }}
                    aria-hidden="true"
                  >
                    <Check size={11} strokeWidth={3} color="white" />
                  </motion.span>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </fieldset>
  );
}

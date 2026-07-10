'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';
import { DigitRoll } from '@/components/journey/DigitRoll';

export interface Pack {
  id: string;
  tier: string; // '01' | '02' | '03' — ghost numeral
  name: string;
  price: number;
  credits: number;
  perMeetup: string | null;
  ribbon: string | null;
}

interface PackCardProps {
  pack: Pack;
  selected: boolean;
  onSelect: () => void;
  recommended?: boolean;
}

/**
 * Renders ₹ prefix + locale-formatted price with per-digit slot-machine roll.
 * Non-digit characters (commas) render statically.
 * The parent <p> carries aria-hidden; radio input owns the accessible label.
 */
function PriceRoll({ amount }: { amount: number }) {
  const formatted = amount.toLocaleString('en-IN'); // e.g. "1,999"
  return (
    <>
      {'₹'}
      {formatted.split('').map((char, i) => {
        const d = parseInt(char, 10);
        if (!isNaN(d)) {
          return <DigitRoll key={i} value={d} />;
        }
        return (
          <span key={i} aria-hidden="true">
            {char}
          </span>
        );
      })}
    </>
  );
}

export function PackCard({ pack, selected, onSelect, recommended = false }: PackCardProps) {
  const reduced = useEffectiveReducedMotion();

  // Entrance animation removed — Reveal in page.tsx handles staggered mount reveal.
  // whileHover / whileTap and the selection-state animations are preserved.

  return (
    <motion.label
      whileHover={reduced ? {} : { scale: 1.02, y: -2 }}
      whileTap={reduced ? {} : { scale: 0.97 }}
      className={cn(
        'relative block cursor-pointer rounded-[var(--radius-lg)] p-5 overflow-hidden',
        'border-2 transition-colors duration-150',
        'focus-within:ring-2 focus-within:ring-[var(--color-azure)] focus-within:ring-offset-2',
        selected
          ? 'border-[var(--color-azure)] bg-[var(--color-azure-tint)]'
          : 'border-[rgba(20,26,46,0.10)] bg-[var(--color-surface)]',
        recommended && !selected && 'border-[rgba(46,107,255,0.30)]',
      )}
      style={
        recommended
          ? { boxShadow: selected ? 'var(--glow-azure)' : 'var(--shadow-lift)' }
          : { boxShadow: 'var(--shadow-1)' }
      }
    >
      {/* Hidden radio — real semantics, keyboard-operable */}
      <input
        type="radio"
        name="credit-pack"
        value={pack.id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
        aria-label={`${pack.name}, ₹${pack.price.toLocaleString('en-IN')}${pack.perMeetup ? `, ${pack.perMeetup}` : ''}`}
      />

      {/* Ghost numeral — editorial tier rhythm */}
      <span
        aria-hidden="true"
        className="absolute bottom-1 right-3 font-black leading-none pointer-events-none select-none z-0"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(4.5rem,12vw,6.5rem)',
          letterSpacing: '-0.04em',
          color: selected ? 'rgba(46,107,255,0.09)' : 'rgba(20,26,46,0.06)',
        }}
      >
        {pack.tier}
      </span>

      <div className="relative z-10">
        {/* Ribbon — social proof, honest, no urgency */}
        {pack.ribbon && (
          <p className="mb-2 text-xs font-semibold leading-snug" style={{ color: '#157A4A' }}>
            {pack.ribbon}
          </p>
        )}

        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-ink-muted)] mb-1">
          {pack.name}
        </p>

        {/* Price — PriceRoll animates each digit via DigitRoll columns. aria-hidden
            because the radio input above carries the full accessible label. */}
        <p
          className="font-black text-[var(--color-ink)] leading-none"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,5vw,2.25rem)' }}
          aria-hidden="true"
        >
          <PriceRoll amount={pack.price} />
        </p>

        {/* Per-meetup math — fades in after the card settles */}
        {pack.perMeetup && (
          <motion.p
            className="mt-0.5 text-sm text-[var(--color-ink-muted)]"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { ...spring.soft, delay: recommended ? 0.6 : 0.2 }
            }
          >
            {pack.perMeetup}
          </motion.p>
        )}
      </div>

      {/* Selected indicator — stamp pop */}
      {selected && (
        <motion.span
          key="check"
          initial={reduced ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={reduced ? { duration: 0 } : spring.stamp}
          className="absolute top-3 right-3 z-10"
          aria-hidden="true"
        >
          <CheckCircle2 size={20} className="text-[var(--color-azure)]" />
        </motion.span>
      )}
    </motion.label>
  );
}

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Zap, CalendarClock, RotateCcw, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { spring, stagger } from '@/lib/motion';

const BENEFITS = [
  { Icon: Zap,           text: 'Meetups at ₹399 instead of ₹499' },
  { Icon: CalendarClock, text: 'Priority booking slots' },
  { Icon: RotateCcw,     text: 'Free reschedule anytime' },
  { Icon: Star,          text: 'Early access to newly verified companions' },
  { Icon: MapPin,        text: 'Member-only city walks' },
] as const;

interface PlusCardProps {
  isPlus: boolean;
  onUpgrade: () => void;
}

export function PlusCard({ isPlus, onUpgrade }: PlusCardProps) {
  const reduced = useReducedMotion();

  if (isPlus) {
    return (
      <motion.div
        className="rounded-[var(--radius-lg)] p-6 text-center"
        style={{ background: 'var(--grad-dark-panel)' }}
        role="status"
        aria-label="Companio Plus membership active"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : spring.soft}
      >
        <p
          className="font-black text-[var(--color-panel-text)] mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)' }}
        >
          You&apos;re a Plus member
        </p>
        <p className="text-sm" style={{ color: 'rgba(244,242,255,0.65)' }}>
          All benefits active, cancel anytime in two taps.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative rounded-[var(--radius-lg)] p-6 overflow-hidden"
      style={{ background: 'var(--grad-dark-panel)', boxShadow: 'var(--glow-violet)' }}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : spring.soft}
      whileHover={reduced ? {} : { y: -2 }}
    >
      {/* Aurora accent hairline — the through-line motif */}
      <div
        className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
        style={{ background: 'var(--grad-aurora)' }}
        aria-hidden="true"
      />

      <div className="pt-3">
        {/* Price */}
        <div className="flex items-end gap-2 mb-1">
          <p
            className="font-black text-[var(--color-panel-text)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,5vw,2.25rem)' }}
          >
            ₹299
          </p>
          <p className="text-sm mb-1.5" style={{ color: 'rgba(244,242,255,0.55)' }}>
            /month
          </p>
        </div>

        <p className="text-base font-semibold text-[var(--color-panel-text)] mb-5">
          Companio Plus
        </p>

        {/* Benefits list — stagger reveal */}
        <motion.ul
          className="flex flex-col gap-2.5 mb-6"
          aria-label="Companio Plus benefits"
          variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
          initial={reduced ? false : 'hidden'}
          animate="visible"
        >
          {BENEFITS.map(({ Icon, text }) => (
            <motion.li
              key={text}
              className="flex items-start gap-2.5"
              variants={{
                hidden:  { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0, transition: spring.soft },
              }}
            >
              <Icon
                size={14}
                className="mt-0.5 shrink-0"
                style={{ color: 'var(--color-gold)' }}
                aria-hidden="true"
              />
              <span className="text-sm" style={{ color: 'rgba(244,242,255,0.85)' }}>
                {text}
              </span>
            </motion.li>
          ))}
        </motion.ul>

        <Button variant="aurora" size="lg" className="w-full" onClick={onUpgrade}>
          Get Companio Plus
        </Button>

        {/* Commitment-friction removal */}
        <p className="mt-3 text-xs text-center" style={{ color: 'rgba(244,242,255,0.45)' }}>
          Cancel anytime in two taps, no lock-in, no fine print.
        </p>
      </div>
    </motion.div>
  );
}

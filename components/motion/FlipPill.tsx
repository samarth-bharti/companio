'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
interface FlipPillProps {
  /** Target date for the countdown. */
  targetISO: string;
  className?: string;
}

function unitsUntil(targetISO: string): { d: number; h: number; m: number } | null {
  const diff = new Date(targetISO).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
  };
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const reduced = useEffectiveReducedMotion();
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span
        className="relative inline-block overflow-hidden rounded-md px-1.5 py-0.5 font-sans font-bold text-sm tabular-nums"
        style={{ background: 'rgba(46,107,255,0.10)', color: 'var(--color-ink)' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            className="inline-block"
            initial={reduced ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { rotateX: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>{label}</span>
    </span>
  );
}

/**
 * FlipPill — flip-clock countdown ("in 2d 14h 06m") for the dashboard's next
 * meetup. Informational styling only — no urgency colors. Also renders the
 * plain-text equivalent for screen readers.
 */
export function FlipPill({ targetISO, className }: FlipPillProps) {
  const [units, setUnits] = useState(() => unitsUntil(targetISO));

  useEffect(() => {
    setUnits(unitsUntil(targetISO));
    const t = setInterval(() => setUnits(unitsUntil(targetISO)), 30000);
    return () => clearInterval(t);
  }, [targetISO]);

  if (!units) {
    return (
      <span className={className} style={{ color: 'var(--color-emerald)' }}>
        Today
      </span>
    );
  }

  const srText = `in ${units.d} days, ${units.h} hours, ${units.m} minutes`;

  return (
    <span className={className}>
      <span className="sr-only">{srText}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        <span className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>in</span>
        <FlipDigit value={units.d} label="d" />
        <FlipDigit value={units.h} label="h" />
        <FlipDigit value={units.m} label="m" />
      </span>
    </span>
  );
}

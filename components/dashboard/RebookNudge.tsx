'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import type { Booking } from '@/lib/appState';
import type { Companion } from '@/lib/data/companions';

interface RebookNudgeProps {
  booking: Booking;
  companion: Companion;
}

export function RebookNudge({ booking, companion }: RebookNudgeProps) {
  const reduced = useEffectiveReducedMotion();

  // Parent OverviewPanel stagger wrapper handles entrance; this owns hover/tap
  return (
    <motion.div
      whileHover={reduced ? {} : { y: -2 }}
      transition={spring.snappy}
      className="rounded-lg p-5 flex gap-4 items-start"
      style={{
        background: 'rgba(46,107,255,0.04)',
        border: '1.5px solid rgba(46,107,255,0.12)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      <img
        src={companion.photo}
        alt={companion.firstName}
        className="rounded-full object-cover shrink-0"
        width={44}
        height={44}
        style={{ width: 44, height: 44 }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm mb-3" style={{ color: 'var(--color-ink)' }}>
          How was your {booking.activity.toLowerCase()} with {companion.firstName}? Want to go again?
        </p>
        <motion.a
          href={`/book?companion=${companion.id}`}
          whileTap={reduced ? {} : { scale: 0.97 }}
          transition={spring.snappy}
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-pill text-sm font-semibold text-white"
          style={{ background: 'var(--grad-cta)' }}
        >
          Book again →
        </motion.a>
      </div>
    </motion.div>
  );
}

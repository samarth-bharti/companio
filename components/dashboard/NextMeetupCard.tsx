'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { MapPin } from 'lucide-react';
import { FlipPill } from '@/components/motion/FlipPill';
import { spring } from '@/lib/motion';
import type { Booking } from '@/lib/appState';
import type { Companion } from '@/lib/data/companions';
import { meetupStartISO } from '@/lib/meetupTime';

interface NextMeetupCardProps {
  booking: Booking;
  companion: Companion;
}

function fmtDate(iso: string): string {
  // Append noon to avoid timezone date-off-by-one when parsing date-only strings
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function NextMeetupCard({ booking, companion }: NextMeetupCardProps) {
  const reduced = useEffectiveReducedMotion();

  // Parent OverviewPanel stagger wrapper handles entrance; this only owns hover/tap
  return (
    <motion.article
      whileHover={reduced ? {} : { y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={spring.snappy}
      className="rounded-lg p-5 flex gap-4 items-start"
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-2)',
        border: '1.5px solid rgba(46,107,255,0.1)',
        cursor: 'default',
      }}
      aria-label={`Next meetup: ${booking.activity} with ${companion.firstName} on ${fmtDate(booking.dateISO)}`}
    >
      <img
        src={companion.photo}
        alt={companion.firstName}
        className="rounded-full object-cover shrink-0"
        width={52}
        height={52}
        style={{ width: 52, height: 52 }}
      />

      <div className="flex-1 min-w-0">
        <p
          className="font-sans text-xs font-semibold tracking-widest uppercase mb-1"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          Next meetup
        </p>
        <p className="font-sans font-bold text-base mb-1" style={{ color: 'var(--color-ink)' }}>
          {booking.activity} with {companion.firstName}
        </p>
        <div className="flex items-center gap-1 mb-3">
          <MapPin size={12} aria-hidden="true" style={{ color: 'var(--color-ink-muted)' }} />
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            {booking.place} · {fmtDate(booking.dateISO)} · {booking.time}
          </span>
        </div>
        <FlipPill targetISO={meetupStartISO(booking.dateISO, booking.time)} />
      </div>
    </motion.article>
  );
}

'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { FlipPill } from '@/components/motion/FlipPill';
import { spring } from '@/lib/motion';
import type { Booking } from '@/lib/appState';
import type { Companion } from '@/lib/data/companions';

function fmtDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function StatusPill({ status }: { status: Booking['status'] }) {
  const map: Record<Booking['status'], { label: string; bg: string; color: string }> = {
    pending_payment: { label: 'Payment pending', bg: 'rgba(214,158,46,0.12)', color: '#946200' },
    upcoming:  { label: 'Upcoming',  bg: 'rgba(46,107,255,0.1)',  color: 'var(--color-azure-deep)' },
    completed: { label: 'Completed', bg: 'rgba(31,174,107,0.1)',  color: '#157A4A' },
    cancelled: { label: 'Cancelled', bg: 'rgba(90,99,120,0.1)',   color: 'var(--color-ink-muted)' },
    refunded:  { label: 'Refunded',  bg: 'rgba(214,158,46,0.12)', color: '#946200' },
  };
  const { label, bg, color } = map[status];
  return (
    <span className="inline-block px-2.5 py-1 rounded-pill text-xs font-semibold" style={{ background: bg, color }}>
      {label}
    </span>
  );
}

export function StarRow({ stars }: { stars: number }) {
  return (
    <span aria-label={`${stars} out of 5 stars`} style={{ color: 'var(--color-gold)' }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

// Shared card variant (used by Section stagger in BookingsPanel)
export const cardVariant = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

interface UpcomingCardProps {
  booking: Booking;
  companion: Companion;
  cancelTarget: string | null;
  onCancelRequest: (id: string) => void;
  onCancelConfirm: (id: string) => void;
  onCancelDismiss: () => void;
}

export function UpcomingCard({
  booking: b, companion: c,
  cancelTarget, onCancelRequest, onCancelConfirm, onCancelDismiss,
}: UpcomingCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={cardVariant}
      whileHover={reduced ? {} : { y: -2 }}
      transition={spring.snappy}
      className="rounded-lg p-4 flex gap-3 items-start"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-1)', border: '1.5px solid rgba(46,107,255,0.08)' }}
    >
      <Image src={c.photo} alt={c.firstName} width={44} height={44} className="rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>{b.activity} with {c.firstName}</span>
          <StatusPill status={b.status} />
        </div>
        <div className="flex items-center gap-1 mb-2">
          <MapPin size={11} aria-hidden="true" style={{ color: 'var(--color-ink-muted)' }} />
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>{b.place} · {fmtDate(b.dateISO)} · {b.time}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FlipPill targetISO={b.dateISO} />
          {cancelTarget === b.id ? (
            <span className="inline-flex gap-2 items-center text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              Cancel this meetup?
              <motion.button whileTap={reduced ? {} : { scale: 0.97 }} transition={spring.snappy} onClick={() => onCancelConfirm(b.id)} className="font-semibold min-h-[36px] px-3 rounded-md" style={{ color: 'var(--color-danger)', background: 'rgba(178,58,46,0.08)' }}>Yes, cancel</motion.button>
              <motion.button whileTap={reduced ? {} : { scale: 0.97 }} transition={spring.snappy} onClick={onCancelDismiss} className="font-semibold min-h-[36px] px-3 rounded-md" style={{ color: 'var(--color-ink-muted)' }}>Keep it</motion.button>
            </span>
          ) : (
            <motion.button whileTap={reduced ? {} : { scale: 0.97 }} transition={spring.snappy} onClick={() => onCancelRequest(b.id)} className="font-sans text-xs min-h-[36px] px-3 rounded-md" style={{ color: 'var(--color-ink-muted)' }}>Cancel</motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface PastCardProps {
  booking: Booking;
  companion: Companion;
  onReview: (b: Booking) => void;
}

export function PastCard({ booking: b, companion: c, onReview }: PastCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={cardVariant}
      whileHover={reduced ? {} : { y: -2 }}
      transition={spring.snappy}
      className="rounded-lg p-4 flex gap-3 items-start"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-1)', border: '1.5px solid rgba(46,107,255,0.06)' }}
    >
      <Image src={c.photo} alt={c.firstName} width={44} height={44} className="rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>{b.activity} with {c.firstName}</span>
          <StatusPill status={b.status} />
        </div>
        <p className="font-sans text-xs mb-2" style={{ color: 'var(--color-ink-muted)' }}>{b.place} · {fmtDate(b.dateISO)}</p>
        {b.status === 'completed' && (
          b.review
            ? <p className="font-sans text-sm"><StarRow stars={b.review.stars} />{b.review.text && <span className="ml-2 text-xs" style={{ color: 'var(--color-ink-muted)' }}>{b.review.text}</span>}</p>
            : <motion.button whileTap={reduced ? {} : { scale: 0.97 }} transition={spring.snappy} onClick={() => onReview(b)} className="font-sans text-sm font-semibold min-h-[44px] px-4 rounded-pill" style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}>Rate your meetup →</motion.button>
        )}
      </div>
    </motion.div>
  );
}

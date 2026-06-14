'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, Smartphone, BellRing, CalendarPlus } from 'lucide-react';
import { calm } from '@/lib/motion';
import { TicketStub } from '@/components/ui/TicketStub';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { Stamp } from '@/components/ui/Stamp';
import { Button } from '@/components/ui/Button';
import { type Companion } from '@/lib/data/companions';
import { type Booking } from '@/lib/appState';

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface Props {
  companion: Companion;
  booking: Booking;
}

export function BookingConfirmed({ companion, booking }: Props) {
  const reduced = useReducedMotion();
  const dateLabel = formatDate(booking.dateISO);

  // Announce confirmation to screen readers
  const liveRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `Meetup confirmed. You're meeting ${companion.firstName} on ${dateLabel}.`;
    }
  }, [companion.firstName, dateLabel]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start py-12 px-4"
      style={{ background: 'var(--grad-hero-bg)' }}
    >
      {/* SR live region */}
      <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />

      <div className="w-full max-w-md space-y-8">
        {/* Milestone seal + confetti */}
        <div className="flex justify-center">
          <MilestoneSeal
            label={`You're meeting ${companion.firstName}`}
            sub={dateLabel}
            size={80}
            withConfetti
          />
        </div>

        {/* Ticket stub */}
        <motion.div
          initial={reduced ? false : { scale: 0.96, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={reduced ? { duration: 0 } : calm.base}
        >
          <TicketStub
            className="border-azure/20"
            stub={
              <div className="flex flex-col items-center gap-2">
                <Stamp
                  icon={CalendarPlus}
                  label="Booked"
                  tone="trust"
                  angle={-2}
                />
                <span
                  className="font-sans text-xs text-center leading-tight"
                  style={{ color: 'var(--color-ink-muted)', fontSize: '0.68rem' }}
                >
                  {booking.dateISO}
                </span>
              </div>
            }
          >
            <div className="space-y-3">
              {/* Companion */}
              <div>
                <p
                  className="font-sans text-xs uppercase tracking-widest font-bold mb-0.5"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  Your companion
                </p>
                <p
                  className="font-sans font-bold text-base"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
                >
                  {companion.name}
                </p>
                <p className="font-sans text-xs" style={{ color: 'var(--color-azure-deep)' }}>
                  ID-verified · {companion.area}
                </p>
              </div>

              {/* Activity */}
              <div>
                <p
                  className="font-sans text-xs uppercase tracking-widest font-bold mb-0.5"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  Activity
                </p>
                <p className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                  {booking.activity}
                </p>
              </div>

              {/* Date & time */}
              <div>
                <p
                  className="font-sans text-xs uppercase tracking-widest font-bold mb-0.5"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  When
                </p>
                <p className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                  {dateLabel} · {booking.time}
                </p>
              </div>

              {/* Place */}
              <div>
                <p
                  className="font-sans text-xs uppercase tracking-widest font-bold mb-0.5"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  Place
                </p>
                <p className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                  {booking.place}
                </p>
              </div>

              {/* Price */}
              <div
                className="rounded-md p-2.5 mt-1"
                style={{ background: 'var(--color-azure-tint)' }}
              >
                <p className="font-sans font-bold text-sm" style={{ color: 'var(--color-azure-deep)' }}>
                  {booking.usedCredit
                    ? '₹0 today, included meeting used'
                    : '₹499 · UPI (demo)'}
                </p>
                <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  ₹ held in escrow until you meet
                </p>
              </div>
            </div>
          </TicketStub>
        </motion.div>

        {/* Reassurance row */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { ...calm.slow, delay: 0.2 }}
          className="grid grid-cols-3 gap-3 text-center"
          aria-label="Booking reassurances"
        >
          {[
            { icon: ShieldCheck, text: '₹ in escrow until you meet' },
            { icon: Smartphone, text: 'SOS one tap away' },
            { icon: BellRing, text: `${companion.firstName} has been notified` },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-1.5">
              <Icon size={18} strokeWidth={1.8} style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
              <p className="font-sans text-xs leading-tight" style={{ color: 'var(--color-ink-muted)' }}>
                {text}
              </p>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { ...calm.slow, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            style={{ minHeight: 44 }}
            aria-label="Add this meetup to your calendar (demo)"
            onClick={() => {/* mock */}}
          >
            Add to calendar
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="cta" size="md" className="w-full" style={{ minHeight: 44 }}>
              View in dashboard →
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

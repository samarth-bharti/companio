'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import Link from 'next/link';
import { ShieldCheck, Smartphone, BellRing, CalendarPlus } from 'lucide-react';
import { calm } from '@/lib/motion';
import { TicketStub } from '@/components/ui/TicketStub';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { Stamp } from '@/components/ui/Stamp';
import { Button } from '@/components/ui/Button';
import { SosButton } from '@/components/safety/SosButton';
import { type Companion } from '@/lib/data/companions';
import { type Booking } from '@/lib/appState';

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Parse a loose time label ("7:00 AM", "07:00", "5 PM") into 24h hours/minutes.
function parseTime(label: string): { h: number; min: number } {
  const m = label.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return { h: 9, min: 0 };
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const mer = m[3]?.toLowerCase();
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return { h, min };
}

// Build a calendar file the user can add to any app. Floating local time
// (no timezone marker) — the meetup is wherever the member already is.
function buildIcs(activity: string, firstName: string, iso: string, time: string, place: string): string {
  const [y, mo, d] = iso.split('-').map(Number);
  const { h, min } = parseTime(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(min)}00`;
  const endH = (h + 1) % 24;
  const end = `${y}${pad(mo)}${pad(d)}T${pad(endH)}${pad(min)}00`;
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Companio//Meetup//EN',
    'BEGIN:VEVENT',
    `UID:companio-${iso}-${h}${min}@companio`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(`${activity} with ${firstName}`)}`,
    `LOCATION:${esc(place)}`,
    `DESCRIPTION:${esc('Your Companio meetup. Strictly platonic, ID-checked, meet in public first.')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

interface Props {
  companion: Companion;
  booking: Booking;
}

export function BookingConfirmed({ companion, booking }: Props) {
  const reduced = useEffectiveReducedMotion();
  const dateLabel = formatDate(booking.dateISO);

  function addToCalendar() {
    const ics = buildIcs(booking.activity, companion.firstName, booking.dateISO, booking.time, booking.place);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companio-${companion.firstName.toLowerCase()}-${booking.dateISO}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

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
                  ID-checked · {companion.area}
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

              {/* The meetup code. /verify has always told members to compare a
                  4-digit code with their companion when they meet; until now the
                  code did not exist, so the instruction could not be followed. */}
              {booking.meetupCode && (
                <div
                  className="rounded-md p-3 mt-1"
                  style={{ background: 'rgba(31,174,107,0.08)', border: '1px solid rgba(31,174,107,0.25)' }}
                >
                  <p
                    className="font-sans text-xs uppercase tracking-widest font-bold mb-1"
                    style={{ color: '#157A4A' }}
                  >
                    Meetup code
                  </p>
                  <p
                    className="font-display font-bold tabular-nums leading-none mb-1.5"
                    style={{ fontSize: '2rem', letterSpacing: '0.16em', color: 'var(--color-ink)' }}
                  >
                    {booking.meetupCode}
                  </p>
                  <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                    {companion.firstName} has the same four digits. Ask for them when you meet — if
                    they do not match, do not go ahead, and report it to us.
                  </p>
                </div>
              )}

              {/* Price */}
              <div
                className="rounded-md p-2.5 mt-1"
                style={{ background: 'var(--color-azure-tint)' }}
              >
                <p className="font-sans font-bold text-sm" style={{ color: 'var(--color-azure-deep)' }}>
                  ₹0 today, included meeting used
                </p>
                <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  Free to cancel any time before you meet
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
            { icon: ShieldCheck, text: 'Verified companion' },
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

        {/* SOS — live-location share during the meetup (free, client-side) */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { ...calm.slow, delay: 0.25 }}
        >
          <SosButton companionName={companion.firstName} />
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
            aria-label="Add this meetup to your calendar"
            onClick={addToCalendar}
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

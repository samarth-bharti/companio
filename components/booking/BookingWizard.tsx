'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { calm } from '@/lib/motion';
import { getWallet, decrementMeeting } from '@/lib/journeyState';
import { addBooking, addNotification } from '@/lib/appState';
import { track } from '@/lib/analytics';
import { getCompanion } from '@/lib/data/companions';
import { SegmentedPill } from '@/components/journey/SegmentedPill';
import { FlowTopBar } from '@/components/layout/FlowTopBar';
import { BookingStepActivity } from './BookingStepActivity';
import { BookingStepDate } from './BookingStepDate';
import { BookingStepTime } from './BookingStepTime';
import { BookingStepPlace } from './BookingStepPlace';
import { BookingStepReview } from './BookingStepReview';
import { BookingConfirmed } from './BookingConfirmed';
import { SafetyAckModal } from './SafetyAckModal';
import type { Booking } from '@/lib/appState';

const STEPS = ['Activity', 'Date', 'Time', 'Place', 'Review'] as const;

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface FormState {
  activity: string;
  dateISO: string;
  dateLabel: string;
  time: string;
  place: string;
}

export function BookingWizard() {
  const params = useSearchParams();
  const companionId = params.get('companion') ?? '';
  const companion = getCompanion(companionId);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormState>({
    activity: companion?.activities[0] ?? '',
    dateISO: '',
    dateLabel: '',
    time: '',
    place: '',
  });
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const reduced = useReducedMotion();
  // Synchronous double-submit guard: setConfirmed is async, so a fast double-tap
  // on "Confirm" would otherwise call addBooking()/decrementMeeting() twice.
  const submittingRef = useRef(false);

  // Fire booking_start once the wizard knows which companion is being booked.
  // Keyed on the id (primitive) so it emits once per companion. Placed BEFORE
  // the early return below to keep the hook call order stable (rules-of-hooks).
  const trackCompanionId = companion?.id;
  useEffect(() => {
    if (trackCompanionId) track('booking_start', { companionId: trackCompanionId });
  }, [trackCompanionId]);

  // No valid companion in the URL — don't silently book a random person.
  // Send the user back to choose, with their context intact.
  if (!companion) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-5"
        style={{ background: 'var(--grad-hero-bg)' }}
      >
        <h1 className="font-display text-h2 tracking-tight" style={{ color: 'var(--color-ink)' }}>
          Let&rsquo;s find you a companion first
        </h1>
        <p className="font-sans text-base max-w-md" style={{ color: 'var(--color-ink-muted)' }}>
          Pick someone you&rsquo;d like to meet, then choose your activity, date and place.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center justify-center h-12 px-8 rounded-pill font-sans font-bold text-sm text-white"
          style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
        >
          Browse companions →
        </Link>
      </main>
    );
  }

  function goNext() { setDir(1); setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function goBack() { setDir(-1); setStep((s) => Math.max(s - 1, 0)); }

  function canAdvance() {
    if (step === 0) return !!form.activity;
    if (step === 1) return !!form.dateISO;
    if (step === 2) return !!form.time;
    if (step === 3) return !!form.place;
    return false;
  }

  function handleConfirm() {
    if (!companion) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    const wallet = getWallet();
    const usedCredit = wallet.credits > 0;
    if (usedCredit) decrementMeeting();
    const b = addBooking({
      companionId: companion.id,
      activity: form.activity,
      dateISO: form.dateISO,
      time: form.time,
      place: form.place,
      usedCredit,
      pricePaid: usedCredit ? 0 : 499,
    });
    addNotification({
      title: 'Meetup confirmed',
      body: `You're meeting ${companion.firstName} on ${formatDate(form.dateISO)}, ₹ held in escrow.`,
    });
    track('booking_complete', { companionId: companion.id, bookingId: b.id });
    setBooking(b);
    setConfirmed(true);
  }

  if (confirmed && booking) {
    return <BookingConfirmed companion={companion} booking={booking} />;
  }

  const stepVariants = {
    enter: (d: number) => ({ x: d * 32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -32, opacity: 0 }),
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--grad-hero-bg)' }}
    >
      <FlowTopBar
        backHref={`/companion/${companion.id}`}
        backLabel={`${companion.firstName}'s profile`}
        exitHref="/explore"
        exitLabel="Exit to explore"
      />
      <div className="max-w-xl mx-auto w-full px-4 sm:px-6 pt-4 pb-24">
        {/* Progress */}
        <div className="flex justify-center mb-8">
          <SegmentedPill steps={[...STEPS]} current={step} />
        </div>

        {/* Step content */}
        <div className="relative min-h-[380px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduced ? { duration: 0 } : calm.base}
              className="relative"
            >
              {step === 0 && (
                <BookingStepActivity
                  activities={companion.activities}
                  selected={form.activity}
                  onSelect={(a) => setForm((f) => ({ ...f, activity: a }))}
                />
              )}
              {step === 1 && (
                <BookingStepDate
                  selected={form.dateISO}
                  onSelect={(iso, label) => setForm((f) => ({ ...f, dateISO: iso, dateLabel: label }))}
                />
              )}
              {step === 2 && (
                <BookingStepTime
                  selected={form.time}
                  onSelect={(t) => setForm((f) => ({ ...f, time: t }))}
                />
              )}
              {step === 3 && (
                <BookingStepPlace
                  area={companion.area}
                  selected={form.place}
                  onSelect={(p) => setForm((f) => ({ ...f, place: p }))}
                />
              )}
              {step === 4 && (
                <BookingStepReview
                  companion={companion}
                  state={form}
                  onConfirm={() => setSafetyOpen(true)}
                  onBack={goBack}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Safety acknowledgement — gates the real confirm. */}
        <SafetyAckModal
          open={safetyOpen}
          companionFirstName={companion.firstName}
          onClose={() => setSafetyOpen(false)}
          onConfirm={() => { setSafetyOpen(false); handleConfirm(); }}
        />

        {/* Navigation (steps 0–3) */}
        {step < 4 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="font-sans font-semibold text-sm px-5 min-h-[44px] rounded-pill focus-visible:outline-2"
                style={{ color: 'var(--color-ink-muted)', background: 'rgba(20,26,46,0.06)' }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance()}
              className="flex-1 font-sans font-semibold text-sm text-white min-h-[44px] rounded-pill transition-opacity disabled:opacity-40 focus-visible:outline-white"
              style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
            >
              {step === 3 ? 'Review booking' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

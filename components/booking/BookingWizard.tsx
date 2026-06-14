'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { calm } from '@/lib/motion';
import { getWallet, decrementMeeting } from '@/lib/journeyState';
import { addBooking, addNotification } from '@/lib/appState';
import { getCompanion, COMPANIONS } from '@/lib/data/companions';
import { SegmentedPill } from '@/components/journey/SegmentedPill';
import { FlowTopBar } from '@/components/layout/FlowTopBar';
import { BookingStepActivity } from './BookingStepActivity';
import { BookingStepDate } from './BookingStepDate';
import { BookingStepTime } from './BookingStepTime';
import { BookingStepPlace } from './BookingStepPlace';
import { BookingStepReview } from './BookingStepReview';
import { BookingConfirmed } from './BookingConfirmed';
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
  const companion = getCompanion(companionId) ?? COMPANIONS[0];

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormState>({
    activity: companion.activities[0] ?? '',
    dateISO: '',
    dateLabel: '',
    time: '',
    place: '',
  });
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const reduced = useReducedMotion();

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
                  onConfirm={handleConfirm}
                  onBack={goBack}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

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

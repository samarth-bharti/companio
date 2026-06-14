'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, MapPin, Clock, Calendar, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getWallet, type Wallet } from '@/lib/journeyState';
import { type Companion } from '@/lib/data/companions';
import { calm } from '@/lib/motion';

interface BookingFormState {
  activity: string;
  dateISO: string;
  dateLabel: string;
  time: string;
  place: string;
}

interface Props {
  companion: Companion;
  state: BookingFormState;
  onConfirm: () => void;
  onBack: () => void;
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor: 'rgba(20,26,46,0.07)' }}>
      <Icon size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
      <div>
        <p className="font-sans text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>{label}</p>
        <p className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>{value}</p>
      </div>
    </div>
  );
}

export function BookingStepReview({ companion, state, onConfirm, onBack }: Props) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    setWallet(getWallet());
  }, []);

  const hasCredits = (wallet?.credits ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-display mb-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h3)',
            color: 'var(--color-ink)',
          }}
        >
          Review your meetup
        </h2>
        <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          Make sure everything looks right.
        </p>
      </div>

      <span
        aria-hidden="true"
        className="absolute right-4 top-0 font-display select-none pointer-events-none"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(4rem, 12vw, 7rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: 'rgba(46,107,255,0.07)',
          lineHeight: 1,
        }}
      >
        05
      </span>

      {/* Summary card — calm reveal on mount */}
      <motion.div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(46,107,255,0.12)', boxShadow: 'var(--shadow-2)' }}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : calm.base}
      >
        {/* Companion header */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'var(--color-azure-tint)' }}
        >
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative"
            style={{ border: '2px solid var(--color-azure)' }}
          >
            <Image src={companion.photo} alt="" aria-hidden="true" fill sizes="32px" className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-sm truncate" style={{ color: 'var(--color-ink)' }}>
              {companion.name}
            </p>
            <div className="flex items-center gap-1">
              <BadgeCheck size={12} style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
              <span className="font-sans text-xs" style={{ color: 'var(--color-azure-deep)' }}>Verified</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <Row icon={Calendar} label="Activity" value={state.activity} />
          <Row icon={Clock} label="Date & time" value={`${state.dateLabel} · ${state.time}`} />
          <Row icon={MapPin} label="Place" value={state.place} />
        </div>
      </motion.div>

      {/* Price line — calm reveal with slight delay */}
      <motion.div
        className="rounded-lg p-4"
        role="status"
        aria-live="polite"
        style={{
          background: hasCredits ? 'var(--color-azure-tint)' : 'var(--color-surface)',
          border: `1.5px solid ${hasCredits ? 'var(--color-azure)' : 'rgba(20,26,46,0.10)'}`,
        }}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { ...calm.base, delay: 0.1 }}
      >
        {hasCredits ? (
          <>
            <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
              ₹0 today
            </p>
            <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--color-azure-deep)' }}>
              This uses 1 of your {wallet?.credits} included meeting{(wallet?.credits ?? 0) > 1 ? 's' : ''}.
            </p>
          </>
        ) : (
          <>
            <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
              ₹499 for this meetup
            </p>
            <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              ₹499 · UPI (demo), ₹ held in escrow until you meet.
            </p>
          </>
        )}
      </motion.div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          size="md"
          type="button"
          onClick={onBack}
          style={{ minHeight: 44 }}
        >
          Back
        </Button>
        <Button
          variant="cta"
          size="lg"
          type="button"
          className="flex-1"
          onClick={onConfirm}
          style={{ minHeight: 44 }}
          aria-label="Confirm your meetup booking"
        >
          Confirm meetup
        </Button>
      </div>
    </div>
  );
}

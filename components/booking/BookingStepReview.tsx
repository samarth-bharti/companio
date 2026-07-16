'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { BadgeCheck, MapPin, Clock, Calendar, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { type Wallet } from '@/lib/journeyState';
import { dataClient } from '@/lib/dataClient';
import { type Companion } from '@/lib/data/companions';
import { formatPaise, UNLOCK_AMOUNT } from '@/lib/money';
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
  /** True while the booking request is in flight. */
  submitting?: boolean;
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

export function BookingStepReview({ companion, state, onConfirm, onBack, submitting = false }: Props) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  // Zero credits has TWO causes and they are not the same sentence.
  //
  // This screen said "You've used both included meetings" whenever the balance
  // was zero — including to a member who has never unlocked, never booked, and
  // therefore never had a meeting to use. They were told they had spent the very
  // thing they had not yet bought, and handed a dead button reading "No meetings
  // left", on the last screen before a booking. The two states need telling apart.
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const reduced = useEffectiveReducedMotion();

  // Read the wallet through dataClient, not journeyState: in http mode the
  // authoritative balance is a row in Postgres, and localStorage is a stale
  // copy that a signed-in member on a new device has never written.
  useEffect(() => {
    let cancelled = false;
    dataClient.getWallet().then((w) => { if (!cancelled) setWallet(w); }).catch(() => {});
    dataClient.getUnlocked().then((u) => { if (!cancelled) setUnlocked(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const hasCredits = (wallet?.credits ?? 0) > 0;
  // Never bought the unlock → they have not "used" anything; they have not started.
  const needsUnlock = !hasCredits && unlocked === false;

  /**
   * Nothing is known until BOTH reads land, and "not known yet" must not render as
   * "no". Both start as null, so for the first moments of this screen `hasCredits`
   * was false and the member — who may have two meetings sitting in their wallet —
   * was shown "You've used both included meetings" above a dead "No meetings left"
   * button, on the last screen before they book. It corrects itself when the fetch
   * returns; on a slow connection that is a long time to be told you cannot do the
   * thing you are about to do, and the natural response is to give up and leave.
   *
   * OverviewPanel already learned this exact lesson about the wallet ("the fallback
   * is null — we do not know yet — not { credits: 2 }"). Same rule here: say nothing
   * until we know.
   */
  const loading = wallet === null || unlocked === null;

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
            {companion.verified && (
              <div className="flex items-center gap-1">
                <BadgeCheck size={12} style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
                <span className="font-sans text-xs" style={{ color: 'var(--color-azure-deep)' }}>Verified</span>
              </div>
            )}
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
        {loading ? (
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Checking your included meetings…
          </p>
        ) : hasCredits ? (
          <>
            <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
              ₹0 today
            </p>
            <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--color-azure-deep)' }}>
              This uses 1 of your {wallet?.credits} included meeting{(wallet?.credits ?? 0) > 1 ? 's' : ''}.
            </p>
          </>
        ) : needsUnlock ? (
          <>
            <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
              Unlock Companio to book
            </p>
            <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              A pass from {formatPaise(UNLOCK_AMOUNT)} opens every profile in your city and
              includes your first meeting — this one.
            </p>
          </>
        ) : (
          <>
            <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
              You&apos;ve used your included meeting
            </p>
            <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              Paid meetups are coming soon. We&apos;ll email you the moment they open.
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
        {/* v1 is unlock-only: a meetup can only be booked with an included
            meeting. Without one there is nothing to charge against, so the
            action is disabled rather than silently creating a free booking.
            But a member who has simply never unlocked is not at a dead end —
            they are one payment away, and the button should say so and take
            them there, instead of reading "No meetings left" and doing nothing. */}
        {loading ? (
          <Button
            variant="cta"
            size="lg"
            type="button"
            className="flex-1"
            disabled
            style={{ minHeight: 44 }}
            aria-label="Checking your included meetings"
          >
            Checking…
          </Button>
        ) : needsUnlock ? (
          <Button
            variant="cta"
            size="lg"
            type="button"
            className="flex-1"
            // Seeded with this companion, so the sheet opens on the person they
            // were already trying to book rather than a generic grid.
            onClick={() => { window.location.href = `/explore?unlock=${companion.id}`; }}
            style={{ minHeight: 44 }}
            aria-label={`Get a Companio pass from ${formatPaise(UNLOCK_AMOUNT)} to book this meetup`}
          >
            Unlock from {formatPaise(UNLOCK_AMOUNT)}
          </Button>
        ) : (
          <Button
            variant="cta"
            size="lg"
            type="button"
            className="flex-1"
            onClick={onConfirm}
            disabled={!hasCredits || submitting}
            style={{ minHeight: 44 }}
            aria-label={
              hasCredits
                ? 'Confirm your meetup booking'
                : 'Booking unavailable — you have used your included meeting'
            }
          >
            {submitting ? 'Confirming…' : hasCredits ? 'Confirm meetup' : 'No meetings left'}
          </Button>
        )}
      </div>
    </div>
  );
}

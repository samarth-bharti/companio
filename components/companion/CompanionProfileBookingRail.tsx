'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Button } from '@/components/ui/Button';
import { dataClient } from '@/lib/dataClient';
import { type Wallet } from '@/lib/journeyState';
import { type Companion } from '@/lib/data/companions';
import { spring, stagger } from '@/lib/motion';

interface Props {
  companion: Companion;
  mobile?: boolean;
}

function StarMini({ rating }: { rating: number }) {
  const reduced = useEffectiveReducedMotion();
  const path = 'M8 1.5l1.85 3.74 4.12.6-2.98 2.9.7 4.1L8 10.8l-3.69 1.94.7-4.1L2.03 5.84l4.12-.6L8 1.5z';

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.svg
          key={i}
          aria-hidden="true"
          width={12}
          height={12}
          viewBox="0 0 16 16"
          fill={i < Math.round(rating) ? 'var(--color-gold)' : 'var(--color-edge)'}
          initial={reduced ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { ...spring.snappy, delay: 0.2 + i * stagger.tight }
          }
        >
          <path d={path} />
        </motion.svg>
      ))}
    </span>
  );
}

export function CompanionProfileBookingRail({ companion, mobile }: Props) {
  const router  = useRouter();
  const reduced = useEffectiveReducedMotion();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // The wallet decides what this rail's primary CTA says and what it charges,
  // so it has to be the server's wallet. Reading localStorage here meant the
  // profile could offer "₹0 today" against credits the server had already spent.
  useEffect(() => {
    let cancelled = false;
    dataClient.getWallet()
      .then((w) => { if (!cancelled) setWallet(w); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const hasCredits = (wallet?.credits ?? 0) > 0;
  // May be undefined: an unreviewed companion has an empty reviewsList. This
  // used to be indexed straight into (`topReview.text`), which crashed the whole
  // profile page the moment the fabricated reviews were removed.
  const topReview = companion.reviewsList.find((r) => r.stars === 5) ?? companion.reviewsList[0];

  function handleBook() {
    router.push(`/book?companion=${companion.id}`);
  }

  if (mobile) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-sm truncate" style={{ color: 'var(--color-ink)' }}>
            {hasCredits ? `1 of ${wallet?.credits} included meetings` : 'Both included meetings used'}
          </p>
          <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            {hasCredits ? '₹0 today' : 'Paid meetups coming soon'}
          </p>
        </div>
        <Button variant="cta" size="lg" onClick={handleBook} style={{ minHeight: 44, minWidth: 44 }}>
          Book meetup
        </Button>
      </div>
    );
  }

  return (
    <div
      className="sticky top-8 rounded-lg p-5 space-y-5"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(46,107,255,0.12)',
        boxShadow: 'var(--shadow-2)',
      }}
    >
      {/* Rate */}
      <div>
        <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
          {hasCredits
            ? `${wallet?.credits} meeting${(wallet?.credits ?? 0) > 1 ? 's' : ''} included`
            : 'Both included meetings used'}
        </p>
        <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
          {hasCredits
            ? 'Yours anytime · no expiry · no subscription'
            : 'ID-verified · paid meetups coming soon'}
        </p>
      </div>

      {/* Trust snippet — a real review if one exists, otherwise the guarantee
          that actually applies to an unreviewed companion. */}
      <div
        className="rounded-md p-3 space-y-1.5"
        style={{ background: 'var(--color-azure-tint)' }}
      >
        {topReview ? (
          <>
            <div className="flex items-center gap-2">
              <StarMini rating={companion.rating} />
              <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                {companion.rating.toFixed(1)}
              </span>
              <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                ({companion.reviews})
              </span>
            </div>
            <p
              className="font-serif text-xs leading-relaxed"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}
            >
              &ldquo;{topReview.text.slice(0, 90)}{topReview.text.length > 90 ? '…' : ''}&rdquo;
            </p>
            <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              , {topReview.name}
            </p>
          </>
        ) : (
          <>
            <p className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
              No reviews yet
            </p>
            <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
              {companion.firstName}&rsquo;s government ID has been verified. If the meetup isn&rsquo;t right,
              tell us within 7 days and we&rsquo;ll refund the unlock in full.
            </p>
          </>
        )}
      </div>

      {/* Book CTA — one-time gentle nudge on mount, no loop, no urgency */}
      <motion.div
        initial={reduced ? false : { y: 0 }}
        animate={reduced ? {} : { y: [0, -4, 0] }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.5, delay: 0.9, ease: 'easeInOut' }
        }
        aria-hidden="true"
      >
        <Button
          variant="cta"
          size="lg"
          className="w-full"
          onClick={handleBook}
          disabled={wallet !== null && !hasCredits}
          style={{ minHeight: 44 }}
          aria-label={
            wallet !== null && !hasCredits
              ? 'Booking unavailable — you have used both included meetings'
              : `Book a meetup with ${companion.firstName}`
          }
        >
          {wallet !== null && !hasCredits ? 'No meetings left' : 'Book a meetup'}
        </Button>
      </motion.div>

      {/* Reassurance — only claims that are actually true today */}
      <p
        className="font-sans text-xs text-center leading-relaxed"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        Free to cancel any time before you meet · full refund in 7 days
      </p>
    </div>
  );
}

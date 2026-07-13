'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { dataClient } from '@/lib/dataClient';
import { useData } from '@/lib/useData';
import { getCompanion } from '@/lib/data/companions';
import type { Booking, Plan } from '@/lib/appState';
import { WalletCard } from './WalletCard';
import { NextMeetupCard } from './NextMeetupCard';
import { StampShelf } from './StampShelf';
import { RebookNudge } from './RebookNudge';
import { calm, stagger } from '@/lib/motion';

// Shared variant used by each stagger child
const cardVariant = {
  hidden:   { opacity: 0, y: 8 },
  visible:  { opacity: 1, y: 0, transition: calm.base },
};

const NO_BOOKINGS: Booking[] = [];

export function OverviewPanel() {
  const reduced = useEffectiveReducedMotion();

  // Each slice re-reads on its own change event, so cancelling a booking in
  // another tab, or paying in this one, updates the panel without a reload.
  const { data: wallet }   = useData('wallet', () => dataClient.getWallet(), { credits: 2, used: 0 });
  const { data: bookings } = useData('bookings', () => dataClient.getBookings(), NO_BOOKINGS);
  const { data: unlocked } = useData('unlocked', () => dataClient.getUnlocked(), false);
  const { data: plan }     = useData<Plan>('plan', () => dataClient.getPlan(), null);

  const upcoming = bookings
    .filter((b) => b.status === 'upcoming')
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const nextBooking    = upcoming[0];
  const nextCompanion  = nextBooking ? getCompanion(nextBooking.companionId) : undefined;

  const rebookCandidate = [...bookings]
    .filter((b) => b.status === 'completed' && !b.review)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0];
  const rebookCompanion = rebookCandidate ? getCompanion(rebookCandidate.companionId) : undefined;

  return (
    // Stagger container: each motion.div child inherits variants and staggers in
    <motion.div
      className="flex flex-col gap-5"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } },
      }}
    >
      <motion.div variants={cardVariant}>
        <WalletCard wallet={wallet} />
      </motion.div>

      <motion.div variants={cardVariant}>
        {nextBooking && nextCompanion ? (
          <NextMeetupCard booking={nextBooking} companion={nextCompanion} />
        ) : (
          <NoMeetupState />
        )}
      </motion.div>

      <motion.div variants={cardVariant}>
        <StampShelf bookings={bookings} unlocked={unlocked} />
      </motion.div>

      {rebookCandidate && rebookCompanion && (
        <motion.div variants={cardVariant}>
          <RebookNudge booking={rebookCandidate} companion={rebookCompanion} />
        </motion.div>
      )}
    </motion.div>
  );
}

function NoMeetupState() {
  return (
    <div
      className="rounded-lg p-6 text-center"
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-1)',
        border: '1.5px solid rgba(46,107,255,0.08)',
      }}
    >
      <p className="font-sans text-sm mb-1 font-semibold" style={{ color: 'var(--color-ink)' }}>
        Ready when you are
      </p>
      <p className="font-sans text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
        Your 2 included meetings are waiting, no expiry, no rush.
      </p>
      <a
        href="/explore"
        className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-pill text-sm font-semibold text-white"
        style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
      >
        Find a companion →
      </a>
    </div>
  );
}

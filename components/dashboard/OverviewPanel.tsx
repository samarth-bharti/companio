'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { dataClient } from '@/lib/dataClient';
import { useData } from '@/lib/useData';
import { useViewerReady } from '@/lib/useViewerReady';
import { getCompanion } from '@/lib/data/companions';
import type { Booking, Plan } from '@/lib/appState';
import type { Wallet } from '@/lib/journeyState';
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
  // A guest previewing the dashboard has no rows to read; asking anyway is 401s.
  const signedIn = useViewerReady();
  const reduced = useEffectiveReducedMotion();

  // Each slice re-reads on its own change event, so cancelling a booking in
  // another tab, or paying in this one, updates the panel without a reload.
  // The fallback is null — "we do not know yet" — not `{ credits: 2 }`.
  //
  // A hard-coded 2 is the number a brand-new account happens to start with, and
  // useData returns the fallback until the real read lands. So a member who had
  // already spent both included meetings was shown "2 meetings remaining, worth
  // ₹998" on every dashboard load, for as long as the request took, before it
  // silently corrected itself to 0. Telling someone they hold ₹998 of credit
  // they do not have is not a loading state; it is a wrong balance.
  const { data: wallet, loading: walletLoading } =
    useData<Wallet | null>('wallet', () => dataClient.getWallet(), null, signedIn);
  const { data: bookings } = useData('bookings', () => dataClient.getBookings(), NO_BOOKINGS, signedIn);
  const { data: unlocked } = useData('unlocked', () => dataClient.getUnlocked(), false, signedIn);
  const { data: plan }     = useData<Plan>('plan', () => dataClient.getPlan(), null, signedIn);
  // Read for the milestone shelf: the first stamp was awarded to everyone,
  // signed out included. Age confirmation is something a member actually does.
  const { data: user }     = useData('user', () => dataClient.getUser(), null, signedIn);

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
        {wallet && !walletLoading ? (
          <WalletCard wallet={wallet} />
        ) : (
          <WalletCardSkeleton />
        )}
      </motion.div>

      <motion.div variants={cardVariant}>
        {nextBooking && nextCompanion ? (
          <NextMeetupCard booking={nextBooking} companion={nextCompanion} />
        ) : (
          <NoMeetupState />
        )}
      </motion.div>

      <motion.div variants={cardVariant}>
        <StampShelf bookings={bookings} unlocked={unlocked} dateOfBirth={user?.dateOfBirth ?? null} />
      </motion.div>

      {rebookCandidate && rebookCompanion && (
        <motion.div variants={cardVariant}>
          <RebookNudge booking={rebookCandidate} companion={rebookCompanion} />
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Placeholder shown while the real balance is in flight. Deliberately shows no
 * number at all: any number here would be a guess, and a guessed balance is
 * indistinguishable from a real one to the person reading it.
 */
function WalletCardSkeleton() {
  return (
    <div
      className="rounded-lg p-6 min-h-[168px] animate-pulse"
      style={{ background: 'var(--color-surface, #fff)', border: '1px solid rgba(0,0,0,0.06)' }}
      aria-hidden="true"
    >
      <div className="h-3 w-24 rounded bg-black/10" />
      <div className="h-8 w-40 rounded bg-black/10 mt-4" />
      <div className="h-3 w-56 rounded bg-black/5 mt-4" />
    </div>
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

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { dataClient } from '@/lib/dataClient';
import { useData } from '@/lib/useData';
import { useViewerReady } from '@/lib/useViewerReady';
import { CalendarDays } from 'lucide-react';
import { getCompanion } from '@/lib/data/companions';
import type { Booking } from '@/lib/appState';
import { ReviewModal } from './ReviewModal';
import { UpcomingCard, PastCard } from './BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { stagger } from '@/lib/motion';

const NO_BOOKINGS: Booking[] = [];

export function BookingsPanel() {
  // A guest previewing the dashboard has no rows to read; asking anyway is 401s.
  const signedIn = useViewerReady();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  // `refresh` is still handed to the children that mutate a booking directly
  // (ReviewModal). Every dataClient mutation also emits, so a cancel from
  // another tab, or an admin refund once http mode is live, lands here too.
  const { data: bookings, refresh } = useData('bookings', () => dataClient.getBookings(), NO_BOOKINGS, signedIn);

  const doCancel = async (id: string) => {
    await dataClient.updateBooking(id, { status: 'cancelled' });
    await dataClient.addNotification({
      title: 'Booking cancelled',
      // Meetups are never charged for, so there was never a payment to reverse
      // here — this promised a refund of nothing. Cancelling returns the meeting
      // to the wallet, which is what actually happens.
      body: 'Your meetup was cancelled. The meeting is back in your wallet.',
    });
    setCancelTarget(null);
  };

  const upcoming = bookings.filter((b) => b.status === 'upcoming').sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const past     = bookings.filter((b) => b.status !== 'upcoming').sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  return (
    <>
      <div className="flex flex-col gap-8">
        <Section title="Upcoming">
          {upcoming.length === 0
            ? (
              <EmptyState
                icon={<CalendarDays size={18} aria-hidden="true" />}
                title="No meetups booked yet"
                description="Your upcoming meetups will show here with the date, place, and a way to message your companion."
                action={{ href: '/explore', label: 'Find a companion →' }}
              />
            )
            : upcoming.map((b) => {
                const c = getCompanion(b.companionId);
                if (!c) return null;
                return (
                  <UpcomingCard
                    key={b.id}
                    booking={b}
                    companion={c}
                    cancelTarget={cancelTarget}
                    onCancelRequest={setCancelTarget}
                    onCancelConfirm={doCancel}
                    onCancelDismiss={() => setCancelTarget(null)}
                  />
                );
              })
          }
        </Section>

        <Section title="Past">
          {past.length === 0
            ? <EmptyState compact title="No past meetups yet" />
            : past.map((b) => {
                const c = getCompanion(b.companionId);
                if (!c) return null;
                return (
                  <PastCard
                    key={b.id}
                    booking={b}
                    companion={c}
                    onReview={setReviewTarget}
                  />
                );
              })
          }
        </Section>
      </div>

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSaved={() => { setReviewTarget(null); refresh(); }}
        />
      )}
    </>
  );
}

// Section: renders title + stagger container for child cards
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const reduced = useEffectiveReducedMotion();
  return (
    <section>
      <h2 className="font-sans font-semibold text-sm mb-3 tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>
        {title}
      </h2>
      <motion.div
        className="flex flex-col gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden:  {},
          visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } },
        }}
      >
        {children}
      </motion.div>
    </section>
  );
}

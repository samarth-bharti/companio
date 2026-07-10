'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { getBookings, updateBooking, addNotification } from '@/lib/appState';
import { getCompanion } from '@/lib/data/companions';
import type { Booking } from '@/lib/appState';
import { ReviewModal } from './ReviewModal';
import { UpcomingCard, PastCard, cardVariant } from './BookingCard';
import { calm, stagger } from '@/lib/motion';

export function BookingsPanel() {
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  useEffect(() => { setBookings(getBookings()); }, []);
  const refresh = () => setBookings(getBookings());

  const doCancel = (id: string) => {
    updateBooking(id, { status: 'cancelled' });
    addNotification({ title: 'Booking cancelled', body: 'Your meetup was cancelled. Full refund within 7 days.' });
    setCancelTarget(null);
    refresh();
  };

  const upcoming = bookings.filter((b) => b.status === 'upcoming').sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const past     = bookings.filter((b) => b.status !== 'upcoming').sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  return (
    <>
      <div className="flex flex-col gap-8">
        <Section title="Upcoming">
          {upcoming.length === 0
            ? (
              <Empty>
                No upcoming meetups yet.{' '}
                <a href="/explore" className="underline font-medium" style={{ color: 'var(--color-azure-deep)' }}>
                  Find a companion →
                </a>
              </Empty>
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
            ? <Empty>No past meetups yet.</Empty>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      variants={cardVariant}
      className="font-sans text-sm"
      style={{ color: 'var(--color-ink-muted)' }}
    >
      {children}
    </motion.p>
  );
}

'use client';

import { CalendarCheck, CheckCircle2, Star } from 'lucide-react';
import { CountUp } from '@/components/motion/CountUp';
import { calm } from '@/lib/motion';
import { useCompanionDashboard } from '@/lib/useCompanionDashboard';

/**
 * Three numbers a companion can actually be shown truthfully.
 *
 * This used to display "Profile views: 320" and "Response rate: 98%" — neither
 * of which is recorded anywhere in the schema, so both were literals in this
 * file, identical for every companion who ever logged in. The rating was a
 * hardcoded 4.9 for the same reason.
 *
 * If profile views and response rate matter, they need to be measured first.
 * Until then, upcoming meetups, completed meetups and the real rating are what
 * we have — and they come from booking rows.
 */

function Tile({
  icon: Icon,
  label,
  iconColor,
  children,
  ariaLabel,
}: {
  icon: typeof Star;
  label: string;
  iconColor: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center text-center"
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid rgba(46,107,255,0.1)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      <Icon size={18} style={{ color: iconColor }} className="mb-2" aria-hidden="true" />
      <p
        className="font-display font-bold leading-none mb-1"
        style={{ fontSize: '1.75rem', color: 'var(--color-ink)' }}
        aria-label={ariaLabel}
      >
        {children}
      </p>
      <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        {label}
      </p>
    </div>
  );
}

const PLACEHOLDER = (
  <span aria-hidden="true" style={{ opacity: 0.25 }}>
    —
  </span>
);

export function CompanionDashStats() {
  const state = useCompanionDashboard();

  // Illustrative, for the signed-out marketing preview only.
  const preview = { upcoming: 2, completed: 34, rating: 4.9, reviewCount: 41 };
  const live = state.status === 'live' ? state.data : null;

  const upcoming = live ? live.earnings.upcomingBookings : state.status === 'preview' ? preview.upcoming : null;
  const completed = live ? live.earnings.completedBookings : state.status === 'preview' ? preview.completed : null;
  const rating = live ? live.profile.rating : state.status === 'preview' ? preview.rating : null;
  const reviews = live ? live.profile.reviewCount : state.status === 'preview' ? preview.reviewCount : null;

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">Performance stats</h2>
      <div className="grid grid-cols-3 gap-4">
        <Tile icon={CalendarCheck} label="Upcoming meetups" iconColor="var(--color-azure)"
          ariaLabel={upcoming !== null ? `${upcoming} upcoming meetups` : undefined}>
          {upcoming === null ? PLACEHOLDER
            : <CountUp value={upcoming} duration={calm.slow.duration as number} className="tabular-nums" />}
        </Tile>

        <Tile icon={CheckCircle2} label="Meetups completed" iconColor="var(--color-emerald)"
          ariaLabel={completed !== null ? `${completed} meetups completed` : undefined}>
          {completed === null ? PLACEHOLDER
            : <CountUp value={completed} duration={calm.slow.duration as number} className="tabular-nums" />}
        </Tile>

        {/* Rating is not counted up: 4.9 would round to 5 on the way there. */}
        <Tile icon={Star} label={reviews ? `Avg of ${reviews} reviews` : 'Avg rating'} iconColor="var(--color-gold)"
          ariaLabel={rating !== null ? `${rating} average rating` : undefined}>
          {rating === null ? PLACEHOLDER : rating > 0 ? (
            <>
              {rating.toFixed(1)}
              <span style={{ color: 'var(--color-gold)' }}>★</span>
            </>
          ) : (
            <span className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>No reviews yet</span>
          )}
        </Tile>
      </div>
    </section>
  );
}

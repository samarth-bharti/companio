'use client';

import { MapPin, CalendarDays } from 'lucide-react';
import { useCompanionDashboard, type CompanionMeetup } from '@/lib/useCompanionDashboard';

/**
 * A companion's confirmed, upcoming meetups.
 *
 * This used to be "Pending requests" with Accept and Decline buttons over two
 * invented members, Arjun M. and Meera K. There is no such flow: `BookingStatus`
 * is `pending_payment | upcoming | completed | cancelled | refunded`. A booking
 * becomes `upcoming` the moment payment settles — nobody accepts it, and nothing
 * in the schema could record a decline. The buttons wrote a local notification
 * and changed nothing.
 *
 * If companions should be able to decline, that needs a status in the model
 * first. Until then, showing them what is actually booked is the honest version.
 */

const PREVIEW: CompanionMeetup[] = [
  { id: 'p1', activity: 'City Walk', dateISO: '2026-08-15', time: 'Morning · 7–9 AM', place: 'Carter Road', status: 'upcoming', memberFirstName: 'Arjun' },
  { id: 'p2', activity: 'Café Chat', dateISO: '2026-08-17', time: 'Afternoon · 3–5 PM', place: 'Prithvi Café', status: 'upcoming', memberFirstName: 'Meera' },
];

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="bookings-heading">
      <h2 id="bookings-heading" className="font-sans font-bold text-base mb-4" style={{ color: 'var(--color-ink)' }}>
        Upcoming meetups
      </h2>
      {children}
    </section>
  );
}

export function CompanionDashBookings() {
  const state = useCompanionDashboard();

  if (state.status === 'loading') {
    return (
      <Panel>
        <div
          className="rounded-2xl p-5 h-24"
          style={{ background: 'var(--color-surface)', border: '1.5px solid rgba(46,107,255,0.1)' }}
          aria-hidden="true"
        />
      </Panel>
    );
  }

  if (state.status === 'error') {
    return (
      <Panel>
        <p role="alert" className="font-sans text-sm rounded-2xl p-5"
          style={{ background: 'rgba(192,57,43,0.06)', border: '1.5px solid rgba(192,57,43,0.2)', color: '#C0392B' }}>
          {state.message}
        </p>
      </Panel>
    );
  }

  const meetups = state.status === 'live' ? state.data.upcoming : PREVIEW;

  if (meetups.length === 0) {
    return (
      <Panel>
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--color-surface)', border: '1.5px solid rgba(46,107,255,0.1)' }}
        >
          <CalendarDays size={22} className="mx-auto mb-2" style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
          <p className="font-sans text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
            No meetups booked yet.
          </p>
          <p className="font-sans text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
            Turn on &ldquo;Available now&rdquo; and keep your profile fresh — members see both.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="space-y-3">
        {meetups.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl p-5"
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid rgba(46,107,255,0.1)',
              boxShadow: 'var(--shadow-1)',
            }}
          >
            <p className="font-sans font-bold text-sm mb-1" style={{ color: 'var(--color-ink)' }}>
              {m.memberFirstName}
              <span
                className="ml-2 font-normal text-xs px-2 py-0.5 rounded-pill"
                style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
              >
                {m.activity}
              </span>
            </p>
            <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              {formatDate(m.dateISO)} · {m.time}
            </p>
            <p className="font-sans text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              <MapPin size={11} aria-hidden="true" />
              {m.place}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

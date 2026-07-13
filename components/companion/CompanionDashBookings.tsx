'use client';

import { useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { useCompanionDashboard, type CompanionMeetup } from '@/lib/useCompanionDashboard';

/**
 * A companion's confirmed, upcoming meetups — and, now, the ability to decline one.
 *
 * The history here is worth keeping. This panel originally showed "Pending
 * requests" with Accept and Decline buttons over two invented members, Arjun M.
 * and Meera K. No such flow existed: `BookingStatus` had no state for a decline,
 * so the buttons wrote a local notification and changed nothing. They were
 * removed, with a note saying the status had to exist first.
 *
 * It exists now. `BookingStatus.declined` is a real state, and
 * `POST /api/companion/bookings/:id/decline` returns the member's credit inside
 * the same transaction that sets it. So the button is back, and this time it
 * does what it says.
 *
 * A booking is only declinable while `upcoming` and unpaid-by-card. The server
 * enforces both; the UI merely reflects them.
 */

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

function MeetupCard({
  m,
  onDeclined,
}: {
  m: CompanionMeetup;
  onDeclined: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function decline() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/companion/bookings/${m.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          body.error === 'refund_not_supported'
            ? 'This meetup was paid by card. Contact support to cancel it.'
            : body.error === 'not_declinable'
              ? 'This meetup can no longer be declined.'
              : 'Something went wrong. Please try again.',
        );
        setBusy(false);
        return;
      }
      onDeclined();
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div
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

      {/* The same four digits the member is holding. They will ask; you answer. */}
      {m.meetupCode && (
        <div
          className="mt-2.5 rounded-md px-2.5 py-2"
          style={{ background: 'rgba(31,174,107,0.08)', border: '1px solid rgba(31,174,107,0.25)' }}
        >
          <p className="font-sans text-[10px] uppercase tracking-widest font-bold" style={{ color: '#157A4A' }}>
            Meetup code
          </p>
          <p
            className="font-display font-bold tabular-nums leading-none mt-0.5"
            style={{ fontSize: '1.25rem', letterSpacing: '0.14em', color: 'var(--color-ink)' }}
          >
            {m.meetupCode}
          </p>
          <p className="font-sans text-[11px] mt-1" style={{ color: 'var(--color-ink-muted)' }}>
            {m.memberFirstName} will ask for this when you meet.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 font-sans text-xs" style={{ color: '#C0392B' }}>
          {error}
        </p>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 h-11 px-4 rounded-pill font-sans font-semibold text-xs"
          style={{ color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.14)' }}
        >
          Can&apos;t make it
        </button>
      ) : (
        <div className="mt-3">
          <p className="font-sans text-xs mb-2" style={{ color: 'var(--color-ink-muted)' }}>
            {m.memberFirstName} will be told, and their included meetup returned. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="h-11 px-4 rounded-pill font-sans font-semibold text-xs disabled:opacity-60"
              style={{ color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.14)' }}
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={decline}
              disabled={busy}
              className="h-11 px-4 rounded-pill font-sans font-bold text-xs text-white disabled:opacity-60"
              style={{ background: '#C0392B' }}
            >
              {busy ? 'Declining…' : 'Decline meetup'}
            </button>
          </div>
        </div>
      )}
    </div>
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
        <p
          role="alert"
          className="font-sans text-sm rounded-2xl p-5"
          style={{ background: 'rgba(192,57,43,0.06)', border: '1.5px solid rgba(192,57,43,0.2)', color: '#C0392B' }}
        >
          {state.message}
        </p>
      </Panel>
    );
  }

  // Signed out, or not a companion. This used to render two invented meetups
  // with real-looking member names. There is nothing to preview: a meetup list
  // is by definition private to the companion it belongs to.
  if (state.status === 'preview') {
    return (
      <Panel>
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--color-surface)', border: '1.5px solid rgba(46,107,255,0.1)' }}
        >
          <CalendarDays size={22} className="mx-auto mb-2" style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
          <p className="font-sans text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
            Sign in as a companion to see your meetups.
          </p>
          <p className="font-sans text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
            Members&apos; bookings are private, so there is nothing to show here until you do.
          </p>
        </div>
      </Panel>
    );
  }

  const meetups = state.data.upcoming;

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
          <MeetupCard key={m.id} m={m} onDeclined={state.refresh} />
        ))}
      </div>
    </Panel>
  );
}

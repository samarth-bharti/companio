'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { addNotification } from '@/lib/appState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type BookingStatus = 'pending' | 'accepted' | 'declined';

interface MockRequest {
  id: string;
  member: string;
  activity: string;
  date: string;
  time: string;
  area: string;
  rate: number;
}

const MOCK: MockRequest[] = [
  { id: 'req1', member: 'Arjun M.', activity: 'City Walk', date: 'Sat, 14 Jun', time: 'Morning · 7-9 AM', area: 'Bandra West', rate: 499 },
  { id: 'req2', member: 'Meera K.', activity: 'Café Chat', date: 'Sun, 15 Jun', time: 'Afternoon · 3-5 PM', area: 'Juhu', rate: 499 },
];

export function CompanionDashBookings() {
  const [statuses, setStatuses] = useState<Record<string, BookingStatus>>({});

  const respond = (id: string, action: 'accepted' | 'declined') => {
    setStatuses((s) => ({ ...s, [id]: action }));
    const req = MOCK.find((r) => r.id === id);
    if (!req) return;
    addNotification({
      title: action === 'accepted' ? 'Booking accepted' : 'Booking declined',
      body:
        action === 'accepted'
          ? `You confirmed ${req.member}'s ${req.activity} on ${req.date}.`
          : `You declined ${req.member}'s request.`,
    });
  };

  return (
    <section aria-labelledby="bookings-heading">
      <h2
        id="bookings-heading"
        className="font-sans font-bold text-base mb-4"
        style={{ color: 'var(--color-ink)' }}
      >
        Pending requests
      </h2>

      <div className="space-y-3">
        {MOCK.map((req) => {
          const status = statuses[req.id];
          return (
            <div
              key={req.id}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid rgba(46,107,255,0.1)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-sans font-bold text-sm mb-1" style={{ color: 'var(--color-ink)' }}>
                    {req.member}
                    <span
                      className="ml-2 font-normal text-xs px-2 py-0.5 rounded-pill"
                      style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
                    >
                      {req.activity}
                    </span>
                  </p>
                  <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    {req.date} · {req.time}
                  </p>
                  <p className="font-sans text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                    <MapPin size={11} aria-hidden="true" />
                    {req.area} · ₹{req.rate}
                  </p>
                </div>

                {status && status !== 'pending' ? (
                  <StatusChip status={status} />
                ) : (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="cta"
                      onClick={() => respond(req.id, 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => respond(req.id, 'declined')}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: 'accepted' | 'declined' }) {
  const isAccepted = status === 'accepted';
  return (
    <span
      className="inline-flex items-center px-3 py-1.5 rounded-pill font-sans text-xs font-semibold shrink-0"
      style={{
        background: isAccepted ? 'rgba(31,174,107,0.1)' : 'rgba(90,99,120,0.08)',
        color: isAccepted ? '#157A4A' : 'var(--color-ink-muted)',
      }}
    >
      {isAccepted ? 'Accepted' : 'Declined'}
    </span>
  );
}

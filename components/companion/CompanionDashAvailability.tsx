'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['Morning', 'Afternoon', 'Evening'];

const makeKey = (d: number, s: number) => `${d}-${s}`;

// Default available: Mon–Fri afternoons + weekends mornings
const DEFAULT_AVAIL = new Set<string>([
  makeKey(0, 1), makeKey(1, 1), makeKey(2, 1), makeKey(3, 1), makeKey(4, 1),
  makeKey(5, 0), makeKey(5, 1), makeKey(6, 0), makeKey(6, 1),
]);

export function CompanionDashAvailability() {
  const [available, setAvailable] = useState(DEFAULT_AVAIL);

  const toggle = (key: string) => {
    setAvailable((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <section aria-labelledby="avail-heading">
      <h2
        id="avail-heading"
        className="font-sans font-bold text-base mb-1"
        style={{ color: 'var(--color-ink)' }}
      >
        Availability
      </h2>
      <p className="font-sans text-xs mb-4" style={{ color: 'var(--color-ink-muted)' }}>
        Members see when you&apos;re open. Toggle to update.
      </p>

      <div
        className="rounded-2xl p-5 overflow-x-auto"
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid rgba(46,107,255,0.1)',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        {/* Header row */}
        <div className="grid grid-cols-[4.5rem_repeat(7,1fr)] gap-1.5 mb-2 min-w-[420px]">
          <div />
          {DAYS.map((d) => (
            <p
              key={d}
              className="font-sans text-xs font-semibold text-center"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              {d}
            </p>
          ))}
        </div>

        {/* Slot rows */}
        {SLOTS.map((slot, si) => (
          <div key={slot} className="grid grid-cols-[4.5rem_repeat(7,1fr)] gap-1.5 mb-1.5 min-w-[420px]">
            <p
              className="font-sans text-xs self-center pr-1"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              {slot}
            </p>
            {DAYS.map((_, di) => {
              const key = makeKey(di, si);
              const on = available.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${DAYS[di]} ${slot}, ${on ? 'available' : 'unavailable'}`}
                  onClick={() => toggle(key)}
                  className={cn(
                    'h-9 w-full rounded-lg transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2',
                  )}
                  style={{
                    background: on ? 'rgba(46,107,255,0.12)' : 'rgba(46,107,255,0.03)',
                    border: `1px solid ${on ? 'var(--color-azure)' : 'rgba(46,107,255,0.1)'}`,
                    minHeight: 44,
                  }}
                />
              );
            })}
          </div>
        ))}

        <p className="font-sans text-xs mt-3" style={{ color: 'var(--color-ink-muted)' }}>
          Blue = available. Changes apply to future bookings only.
        </p>
      </div>
    </section>
  );
}

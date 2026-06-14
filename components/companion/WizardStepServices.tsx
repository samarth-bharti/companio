'use client';

import { useId } from 'react';
import { CITIES } from '@/lib/data/cities';
import { cn } from '@/lib/utils';

const ACTIVITIES = [
  'City Walk',
  'Gym Buddy',
  'Café Chat',
  'Live Events',
  'Elder Company',
  'City Help',
  'Museum Visit',
  'Park Stroll',
] as const;

const RATE_MIN = 299;
const RATE_MAX = 999;
const RATE_DEFAULT = 499;

export interface ServicesData {
  activities: string[];
  rate: number;
  city: string;
}

interface Props {
  data: ServicesData;
  onChange: (patch: Partial<ServicesData>) => void;
}

export function WizardStepServices({ data, onChange }: Props) {
  const sliderId = useId();
  const cityName = CITIES.find((c) => c.id === data.city)?.name ?? 'your city';
  const fillPct = ((data.rate - RATE_MIN) / (RATE_MAX - RATE_MIN)) * 100;

  const toggleActivity = (a: string) => {
    const next = data.activities.includes(a)
      ? data.activities.filter((x) => x !== a)
      : [...data.activities, a];
    onChange({ activities: next });
  };

  return (
    <div>
      <h2 className="font-display text-h2 mb-1" style={{ color: 'var(--color-ink)' }}>
        What do you enjoy doing?
      </h2>
      <p className="font-sans text-sm mb-8" style={{ color: 'var(--color-ink-muted)' }}>
        Members filter by activity, pick everything you genuinely enjoy.
      </p>

      {/* Activity tiles */}
      <fieldset className="mb-8">
        <legend className="font-sans text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
          Activities <span aria-hidden="true" style={{ color: '#C7161A' }}>*</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group">
          {ACTIVITIES.map((a) => {
            const active = data.activities.includes(a);
            return (
              <button
                key={a}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => toggleActivity(a)}
                className={cn(
                  'h-11 px-3 rounded-xl font-sans text-sm font-medium transition-all',
                  'min-w-[44px] focus-visible:outline-2',
                )}
                style={{
                  background: active ? 'rgba(46,107,255,0.1)' : 'rgba(46,107,255,0.04)',
                  border: `1.5px solid ${active ? 'var(--color-azure)' : 'rgba(46,107,255,0.15)'}`,
                  color: active ? 'var(--color-azure-deep)' : 'var(--color-ink-muted)',
                }}
              >
                {a}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Rate slider */}
      <div>
        <label
          htmlFor={sliderId}
          className="font-sans text-sm font-semibold block mb-1"
          style={{ color: 'var(--color-ink)' }}
        >
          Rate per meetup:{' '}
          <span style={{ color: 'var(--color-azure)', fontVariantNumeric: 'tabular-nums' }}>
            ₹{data.rate}
          </span>
        </label>
        <p className="font-sans text-xs mb-4" style={{ color: 'var(--color-ink-muted)' }}>
          Most companions in {cityName} charge ₹449-549
        </p>

        <div className="relative h-5 flex items-center">
          <div
            className="absolute inset-x-0 h-2 rounded-pill"
            style={{ top: '50%', transform: 'translateY(-50%)', background: 'rgba(46,107,255,0.12)' }}
          />
          <div
            className="absolute h-2 rounded-pill"
            style={{
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${fillPct}%`,
              background: 'var(--grad-aurora)',
              transition: 'width 0.1s ease',
            }}
          />
          <input
            id={sliderId}
            type="range"
            min={RATE_MIN}
            max={RATE_MAX}
            step={50}
            value={data.rate}
            onChange={(e) => onChange({ rate: Number(e.target.value) })}
            aria-valuetext={`₹${data.rate} per meetup`}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
          <div
            aria-hidden="true"
            className="absolute w-5 h-5 rounded-full pointer-events-none"
            style={{
              left: `calc(${fillPct}% - ${(fillPct / 100) * 20}px)`,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--color-azure)',
              boxShadow: 'var(--glow-azure)',
              transition: 'left 0.1s ease',
            }}
          />
        </div>

        <div className="flex justify-between mt-2">
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            ₹{RATE_MIN}
          </span>
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            ₹{RATE_MAX}
          </span>
        </div>

        <p className="font-sans text-xs mt-3" style={{ color: 'var(--color-ink-muted)' }}>
          You can change your rate any time from your dashboard.
        </p>
      </div>
    </div>
  );
}

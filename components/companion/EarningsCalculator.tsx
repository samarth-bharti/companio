'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { animate } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { cn } from '@/lib/utils';

const RATE = 499;
const WEEKS = 4.3;

interface Props {
  className?: string;
}

export function EarningsCalculator({ className }: Props) {
  const [meetups, setMeetups] = useState(6);
  const reduced = useEffectiveReducedMotion();
  const sliderId = useId();
  const displayRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<number | null>(null);

  const monthly = Math.round(meetups * RATE * WEEKS);
  const fillPct = ((meetups - 1) / 13) * 100;

  // Animate from previous value to new on slider change
  useEffect(() => {
    if (!displayRef.current) return;
    const prev = prevRef.current;
    prevRef.current = monthly;

    if (prev === null || reduced) {
      displayRef.current.textContent = `₹${monthly.toLocaleString('en-IN')}`;
      return;
    }

    // Snap to old value first, then animate to new
    displayRef.current.textContent = `₹${Math.round(prev).toLocaleString('en-IN')}`;
    const ctrl = animate(prev, monthly, {
      duration: 0.45,
      ease: 'easeOut',
      onUpdate(v) {
        if (displayRef.current)
          displayRef.current.textContent = `₹${Math.round(v).toLocaleString('en-IN')}`;
      },
    });
    return () => ctrl.stop();
  }, [monthly, reduced]);

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl p-8 md:p-10', className)}
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-2)' }}
    >
      <p
        className="font-sans text-sm font-semibold uppercase tracking-widest mb-2 relative z-10"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        Estimated monthly earnings
      </p>

      <span
        ref={displayRef}
        className="font-display leading-none tracking-tight mb-2 block relative z-10"
        style={{ fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', color: 'var(--color-ink)' }}
        aria-live="polite"
        aria-label={`₹${monthly.toLocaleString('en-IN')} estimated monthly`}
        suppressHydrationWarning
      >
        ₹{monthly.toLocaleString('en-IN')}
      </span>

      <p className="font-sans text-xs mb-8 relative z-10" style={{ color: 'var(--color-ink-muted)' }}>
        Estimate, varies by city &amp; demand. ₹{RATE}/meetup × {meetups}/week × 4.3 weeks.
      </p>

      {/* Slider */}
      <div className="relative z-10">
        <label
          htmlFor={sliderId}
          className="font-sans text-sm font-semibold block mb-3"
          style={{ color: 'var(--color-ink)' }}
        >
          Meetups per week:{' '}
          <span style={{ color: 'var(--color-azure)' }}>{meetups}</span>
        </label>

        <div className="relative h-5 flex items-center">
          {/* Track background */}
          <div
            className="absolute inset-x-0 h-2 rounded-pill"
            style={{ top: '50%', transform: 'translateY(-50%)', background: 'rgba(46,107,255,0.12)' }}
          />
          {/* Aurora fill */}
          <div
            className="absolute h-2 rounded-pill"
            style={{
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${fillPct}%`,
              background: 'var(--grad-aurora)',
              transition: reduced ? 'none' : 'width 0.1s ease',
            }}
          />
          {/* Actual interactive input — invisible over the custom track */}
          <input
            id={sliderId}
            type="range"
            min={1}
            max={14}
            step={1}
            value={meetups}
            onChange={(e) => setMeetups(Number(e.target.value))}
            aria-valuetext={`${meetups} meetups a week, ₹${monthly.toLocaleString('en-IN')}/month estimate`}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
          {/* Visual thumb */}
          <div
            aria-hidden="true"
            className="absolute w-5 h-5 rounded-full pointer-events-none"
            style={{
              left: `calc(${fillPct}% - ${(fillPct / 100) * 20}px)`,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--color-azure)',
              boxShadow: 'var(--glow-azure)',
              transition: reduced ? 'none' : 'left 0.1s ease',
            }}
          />
        </div>

        <div className="flex justify-between mt-2">
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            1/week
          </span>
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            14/week
          </span>
        </div>
      </div>
    </div>
  );
}

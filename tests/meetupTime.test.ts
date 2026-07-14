import { describe, it, expect } from 'vitest';
import { meetupStart, meetupStartISO } from '@/lib/meetupTime';

describe('meetupStart', () => {
  it('resolves the evening slot to 5pm IST, not UTC midnight', () => {
    const d = meetupStart('2026-07-15', 'Evening');
    // 17:00 IST == 11:30 UTC
    expect(d.toISOString()).toBe('2026-07-15T11:30:00.000Z');
  });

  it('resolves the morning slot to 7am IST', () => {
    expect(meetupStart('2026-07-15', 'Morning').toISOString()).toBe('2026-07-15T01:30:00.000Z');
  });

  it('resolves the afternoon slot to noon IST', () => {
    expect(meetupStart('2026-07-15', 'Afternoon').toISOString()).toBe('2026-07-15T06:30:00.000Z');
  });

  it('matches the slot inside a decorated display label', () => {
    expect(meetupStart('2026-07-15', 'Evening · 5-8 PM').toISOString()).toBe(
      '2026-07-15T11:30:00.000Z',
    );
  });

  it('never lands on midnight for an unknown slot — that would put a same-day meetup in the past', () => {
    const d = meetupStart('2026-07-15', 'whenever');
    expect(d.getUTCHours()).not.toBe(0);
    expect(d.toISOString()).toBe('2026-07-15T06:30:00.000Z'); // falls back to midday IST
  });

  it('is strictly later than the naive date-only parse the countdown used to do', () => {
    const naive = new Date('2026-07-15').getTime(); // UTC midnight — the old bug
    expect(meetupStart('2026-07-15', 'Evening').getTime()).toBeGreaterThan(naive);
  });

  it('meetupStartISO returns a parseable instant', () => {
    expect(() => new Date(meetupStartISO('2026-07-15', 'Evening')).toISOString()).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { bookingCreateBody, bookingPatchBody } from '@/lib/server/validation';

// A meetup is a future event. Before this rule, `dateISO` was only checked for
// SHAPE (`YYYY-MM-DD`), so a booking could be created for last Tuesday.
//
// That is not merely untidy. The cron auto-completes any `upcoming` booking
// whose date has passed — so a back-dated booking could be created and marked
// `completed` on the same day, without the meetup ever happening. A completed
// booking is what unlocks the review form and releases the companion payout.

const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const valid = {
  companionId: 'ananya',
  activity: 'Café Chat',
  time: '18:00',
  place: 'Bandra West',
  usedCredit: true,
};

describe('booking date must not be in the past', () => {
  it('accepts a future date', () => {
    expect(bookingCreateBody.safeParse({ ...valid, dateISO: day(3) }).success).toBe(true);
  });

  it("accepts today (the user's own timezone is ahead of UTC)", () => {
    expect(bookingCreateBody.safeParse({ ...valid, dateISO: day(0) }).success).toBe(true);
  });

  it('rejects yesterday', () => {
    const r = bookingCreateBody.safeParse({ ...valid, dateISO: day(-1) });
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toContain('past');
  });

  it('rejects a date years ago', () => {
    expect(bookingCreateBody.safeParse({ ...valid, dateISO: '2020-01-01' }).success).toBe(false);
  });

  it('still rejects a malformed date', () => {
    expect(bookingCreateBody.safeParse({ ...valid, dateISO: '15-06-2026' }).success).toBe(false);
    expect(bookingCreateBody.safeParse({ ...valid, dateISO: '2026-02-31' }).success).toBe(false);
  });

  it('applies the same rule to rescheduling', () => {
    expect(bookingPatchBody.safeParse({ dateISO: day(2) }).success).toBe(true);
    expect(bookingPatchBody.safeParse({ dateISO: day(-1) }).success).toBe(false);
  });

  it('leaves a patch with no date alone', () => {
    expect(bookingPatchBody.safeParse({ status: 'cancelled' }).success).toBe(true);
  });
});

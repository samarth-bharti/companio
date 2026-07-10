import { describe, it, expect } from 'vitest';
import {
  addCreditsBody, boolValueBody, userBody, bookingCreateBody, bookingPatchBody,
  favoriteToggleBody, messageAppendBody, notificationBody, planBody, applicationBody,
} from '@/lib/server/validation';

// A date that is always in the future. Frozen literals rot: this suite used
// '2026-06-15', which silently became a past date and then failed once bookings
// began rejecting past dates.
const FUTURE_DATE = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

const ok = (s: { success: boolean }) => s.success;

describe('addCreditsBody', () => {
  it('accepts a positive int', () => expect(ok(addCreditsBody.safeParse({ count: 5 }))).toBe(true));
  it('rejects zero', () => expect(ok(addCreditsBody.safeParse({ count: 0 }))).toBe(false));
  it('rejects negative', () => expect(ok(addCreditsBody.safeParse({ count: -1 }))).toBe(false));
  it('rejects non-integer', () => expect(ok(addCreditsBody.safeParse({ count: 1.5 }))).toBe(false));
  it('rejects missing', () => expect(ok(addCreditsBody.safeParse({}))).toBe(false));
});

describe('boolValueBody', () => {
  it('accepts a boolean', () => expect(ok(boolValueBody.safeParse({ value: true }))).toBe(true));
  it('rejects a string', () => expect(ok(boolValueBody.safeParse({ value: 'yes' }))).toBe(false));
});

describe('userBody', () => {
  it('accepts firstName only', () => expect(ok(userBody.safeParse({ firstName: 'Asha' }))).toBe(true));
  it('accepts firstName + city', () => expect(ok(userBody.safeParse({ firstName: 'Asha', city: 'mumbai' }))).toBe(true));
  it('rejects empty firstName', () => expect(ok(userBody.safeParse({ firstName: '' }))).toBe(false));
  it('rejects missing firstName', () => expect(ok(userBody.safeParse({}))).toBe(false));
});

describe('bookingCreateBody', () => {
  // pricePaid and review are no longer client-supplied (server-computed / gated).
  const valid = { companionId: 'ananya', activity: 'Walk', dateISO: FUTURE_DATE, time: 'AM', place: 'Bandra', usedCredit: false };
  it('accepts a full valid body', () => expect(ok(bookingCreateBody.safeParse(valid))).toBe(true));
  it('strips an unknown pricePaid field (not rejected, just ignored)', () => expect(ok(bookingCreateBody.safeParse({ ...valid, pricePaid: 49900 }))).toBe(true));
  it('rejects missing companionId', () => expect(ok(bookingCreateBody.safeParse({ ...valid, companionId: undefined }))).toBe(false));
  it('rejects missing usedCredit', () => expect(ok(bookingCreateBody.safeParse({ ...valid, usedCredit: undefined }))).toBe(false));
});

describe('bookingPatchBody', () => {
  it('accepts an empty patch', () => expect(ok(bookingPatchBody.safeParse({}))).toBe(true));
  it('accepts status=cancelled (only client-writable status)', () => expect(ok(bookingPatchBody.safeParse({ status: 'cancelled' }))).toBe(true));
  it('rejects status=completed (server-only)', () => expect(ok(bookingPatchBody.safeParse({ status: 'completed' }))).toBe(false));
  it('rejects an unknown status', () => expect(ok(bookingPatchBody.safeParse({ status: 'paid' }))).toBe(false));
});

describe('favoriteToggleBody', () => {
  it('accepts companionId', () => expect(ok(favoriteToggleBody.safeParse({ companionId: 'a' }))).toBe(true));
  it('rejects missing', () => expect(ok(favoriteToggleBody.safeParse({}))).toBe(false));
});

describe('messageAppendBody', () => {
  it('accepts me/them', () => expect(ok(messageAppendBody.safeParse({ from: 'them', text: 'hi' }))).toBe(true));
  it('rejects an unknown from', () => expect(ok(messageAppendBody.safeParse({ from: 'bot', text: 'hi' }))).toBe(false));
  it('rejects empty text', () => expect(ok(messageAppendBody.safeParse({ from: 'me', text: '' }))).toBe(false));
});

describe('notificationBody', () => {
  it('accepts title + body', () => expect(ok(notificationBody.safeParse({ title: 'a', body: 'b' }))).toBe(true));
  it('rejects empty title', () => expect(ok(notificationBody.safeParse({ title: '', body: 'b' }))).toBe(false));
});

describe('planBody', () => {
  it('accepts plus', () => expect(ok(planBody.safeParse({ plan: 'plus' }))).toBe(true));
  it('accepts null', () => expect(ok(planBody.safeParse({ plan: null }))).toBe(true));
  it('rejects another tier', () => expect(ok(planBody.safeParse({ plan: 'pro' }))).toBe(false));
});

describe('applicationBody', () => {
  const valid = { name: 'A', city: 'mumbai', activities: ['Walk'], rate: 50000, bio: 'hi', idUploaded: true, backgroundConsent: true, status: 'submitted' };
  it('accepts a valid application', () => expect(ok(applicationBody.safeParse(valid))).toBe(true));
  it('rejects a non-draft/submitted status', () => expect(ok(applicationBody.safeParse({ ...valid, status: 'approved' }))).toBe(false));
});

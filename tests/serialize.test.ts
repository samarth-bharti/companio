/* eslint-disable @typescript-eslint/no-explicit-any */
// `any` is used freely here: tests feed minimal hand-built rows in place of
// full Prisma model instances, which is the point of a unit test.
import { describe, it, expect } from 'vitest';
import {
  toWallet,
  toBooking,
  toMessage,
  toNotification,
  toCompanion,
} from '@/lib/server/serialize';

describe('toWallet', () => {
  it('maps credits and used', () => {
    expect(toWallet({ credits: 3, used: 1 })).toEqual({ credits: 3, used: 1 });
  });
});

describe('toBooking', () => {
  const base = {
    id: 'b1', userId: 'u1', companionId: 'ananya', activity: 'City Walk',
    dateISO: '2026-06-15', time: 'Morning', place: 'Bandra', status: 'upcoming',
    usedCredit: false, pricePaid: 49900, razorpayOrderId: null,
    razorpayPaymentId: null, updatedAt: new Date(),
  } as const;

  it('converts createdAt Date to epoch ms', () => {
    const d = new Date('2026-06-17T00:00:00Z');
    const b = toBooking({ ...base, review: null, createdAt: d } as any);
    expect(b.createdAt).toBe(d.getTime());
  });

  it('maps null review to undefined', () => {
    const b = toBooking({ ...base, review: null, createdAt: new Date() } as any);
    expect(b.review).toBeUndefined();
  });

  it('keeps a present review object', () => {
    const review = { stars: 5, text: 'great' };
    const b = toBooking({ ...base, review, createdAt: new Date() } as any);
    expect(b.review).toEqual(review);
  });
});

describe('toMessage', () => {
  const base = { id: 'm1', from: 'me', text: 'hi', kind: 'text', reactions: [] };

  it('converts BigInt ts to a number', () => {
    const m = toMessage({ ...base, ts: BigInt(1700000000000) } as any);
    expect(m).toEqual({ ...base, ts: 1700000000000 });
    expect(typeof m.ts).toBe('number');
  });

  // A sticker that comes back as 'text' renders as a small text bubble instead
  // of a large emoji — which is exactly what happened while the column was
  // missing and the POST route dropped `kind` on the floor.
  it('carries the sticker kind through', () => {
    const m = toMessage({ ...base, kind: 'sticker', text: '🎉', ts: BigInt(1) } as any);
    expect(m.kind).toBe('sticker');
  });

  it('carries reactions through', () => {
    const m = toMessage({ ...base, reactions: ['❤️', '😂'], ts: BigInt(1) } as any);
    expect(m.reactions).toEqual(['❤️', '😂']);
  });
});

describe('toNotification', () => {
  it('converts BigInt ts and keeps read flag', () => {
    const n = toNotification({
      id: 'n1', title: 'T', body: 'B', ts: BigInt(1700000000000), read: true,
    } as any);
    expect(n).toEqual({ id: 'n1', title: 'T', body: 'B', ts: 1700000000000, read: true });
  });
});

describe('toCompanion', () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: 'ananya', name: 'Ananya', firstName: 'Ananya', maskedName: 'Ana',
    city: 'mumbai', area: 'Bandra', age: 28, activities: [], languages: [],
    rating: 4.9, reviewCount: 124, ratePerMeeting: 499, bio: '', suggestions: [],
    photo: '', accent: '#000', sameGenderNote: false, topMatch: true,
    verified: true, availableNow: true, availability: 'Free now', distanceKm: 3,
    matchScore: 98, reviewsList: [], createdAt: new Date(), updatedAt: new Date(),
    ...over,
  });

  it('renames reviewCount to reviews and drops db-only fields', () => {
    const c = toCompanion(row() as any);
    expect(c.reviews).toBe(124);
    expect((c as any).reviewCount).toBeUndefined();
    expect((c as any).createdAt).toBeUndefined();
  });

  // It was rendered as "3.2 km away" and sorted the grid by default, and it is
  // an authored constant — not a distance from a member we cannot locate.
  it('does not ship distanceKm to the client', () => {
    expect((toCompanion(row({ distanceKm: 3 }) as any) as any).distanceKm).toBeUndefined();
  });

  // The "Verified" badge renders off this field and nothing else. It was once
  // stripped here while the cards drew a hardcoded tick, so every seeded profile
  // claimed an ID check none of them had passed. The badge must be able to be
  // false, and must reach the client to be false.
  it('carries `verified` through to the client, both ways', () => {
    expect(toCompanion(row({ verified: true }) as any).verified).toBe(true);
    expect(toCompanion(row({ verified: false }) as any).verified).toBe(false);
  });
});

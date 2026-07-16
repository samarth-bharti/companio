import { describe, it, expect } from 'vitest';
import { applyPaywall, redactCompanion, freePreviewIds } from '@/lib/server/redact';
import { toCompanion } from '@/lib/server/serialize';
import { blurredPhoto } from '@/lib/photo';
import type { Companion } from '@/lib/data/companions';

const make = (over: Partial<Companion>): Companion => ({
  id: 'x', name: 'Full Name', firstName: 'Full', maskedName: 'Ful···',
  city: 'Indore', area: 'Vijay Nagar',
  activities: ['City Walk'], languages: ['Hindi'],
  rating: 0, reviews: 0, ratePerMeeting: 499,
  bio: 'A real bio that the unlock is supposed to buy.',
  suggestions: ['One', 'Two', 'Three'],
  photo: 'https://images.unsplash.com/photo-1?w=480&q=80',
  accent: '#000',
  availableNow: false, availability: 'Available tomorrow',
  matchScore: 70,
  reviewsList: [{ name: 'A', city: 'Indore', stars: 5, text: 'Lovely' }],
  ...over,
});

describe('redactCompanion', () => {
  const locked = redactCompanion(make({}));

  // These four ARE the ₹199. They used to be served to anyone with curl.
  it('withholds everything the unlock is meant to buy', () => {
    expect(locked.name).toBe('Ful···');
    expect(locked.bio).toBe('');
    expect(locked.suggestions).toEqual([]);
    expect(locked.reviewsList).toEqual([]);
  });

  it('never sends the sharp photo', () => {
    expect(locked.photo).toContain('blur=');
    expect(locked.photo).not.toContain('q=80');
  });

  // A locked card still has to render something honest.
  it('keeps what a locked card legitimately shows', () => {
    expect(locked.city).toBe('Indore');
    expect(locked.area).toBe('Vijay Nagar');
    expect(locked.activities).toEqual(['City Walk']);
    expect(locked.languages).toEqual(['Hindi']);
  });
});

describe('blurredPhoto', () => {
  it('is idempotent — the card re-applying it cannot sharpen the server’s URL', () => {
    const once = blurredPhoto('https://images.unsplash.com/photo-1?w=480&q=80')!;
    expect(blurredPhoto(once)).toBe(once);
  });

  /**
   * This test used to assert the opposite — `expect(blurredPhoto(owned)).toBe(owned)`
   * — and called it "it cannot blur it, and must not pretend to". Handing back
   * the original does not decline to pretend; it serves the full-resolution
   * photo to someone who has not paid, and the only thing hiding the face is a
   * CSS filter the network tab ignores.
   *
   * That was survivable while every portrait was Unsplash stock of a stranger.
   * Real companions upload real faces to hosts that are not Unsplash, so the old
   * behaviour would publish them.
   */
  it('returns null for a host it cannot blur, rather than the sharp original', () => {
    expect(blurredPhoto('https://cdn.companio.in/real-photo.jpg')).toBeNull();
  });

  it('returns null for an empty photo rather than an empty URL', () => {
    expect(blurredPhoto('')).toBeNull();
  });

  it('actually destroys the image it does serve', () => {
    const out = blurredPhoto('https://images.unsplash.com/photo-1?w=1600&q=95')!;
    // The full-size request must not survive into the locked URL.
    expect(out).not.toContain('w=1600');
    expect(out).not.toContain('q=95');
    expect(out).toContain('blur=400');
  });
});

describe('redactCompanion + photos', () => {
  it('drops a photo it cannot blur instead of leaking it', () => {
    const c = make({ id: 'a', city: 'Mumbai', photo: 'https://cdn.companio.in/real.jpg' });
    expect(redactCompanion(c).photo).toBe('');
  });

  it('serves the blurred variant when the host can blur', () => {
    const c = make({ id: 'a', city: 'Mumbai', photo: 'https://images.unsplash.com/photo-1?w=480' });
    expect(redactCompanion(c).photo).toContain('blur=400');
  });
});

describe('freePreviewIds', () => {
  it('picks the flagged top match in each city', () => {
    const ids = freePreviewIds([
      make({ id: 'a', city: 'Mumbai', topMatch: true, matchScore: 10 }),
      make({ id: 'b', city: 'Mumbai', matchScore: 99 }),
      make({ id: 'c', city: 'Indore', topMatch: true }),
    ]);
    expect(ids).toEqual(new Set(['a', 'c']));
  });

  // Suspending the teaser must not leave a city with no preview at all.
  it('falls back to the best match when no one is flagged', () => {
    const ids = freePreviewIds([
      make({ id: 'a', city: 'Indore', matchScore: 60 }),
      make({ id: 'b', city: 'Indore', matchScore: 90 }),
    ]);
    expect(ids).toEqual(new Set(['b']));
  });
});

describe('applyPaywall', () => {
  const roster = [
    make({ id: 'teaser', city: 'Indore', topMatch: true }),
    make({ id: 'locked', city: 'Indore' }),
  ];

  it('gives a paid member everything', () => {
    const out = applyPaywall(roster, true);
    expect(out.map((c) => c.bio)).not.toContain('');
  });

  it('gives an unpaid viewer the free preview in full and nothing else', () => {
    const out = applyPaywall(roster, false);
    const teaser = out.find((c) => c.id === 'teaser')!;
    const locked = out.find((c) => c.id === 'locked')!;
    expect(teaser.bio).not.toBe('');
    expect(teaser.name).toBe('Full Name');
    expect(locked.bio).toBe('');
    expect(locked.name).toBe('Ful···');
  });
});

// ── The public shape is an allowlist ─────────────────────────────────────────
//
// toCompanion() used to spread the whole Prisma row (`{...rest} as Companion`)
// while the callers queried with no `select`. GET /api/companions therefore
// served `payoutUpi` — where a companion is PAID, normally embedding their phone
// number or legal name — to anonymous callers, in both the unlocked AND the
// redacted payload. These tests pass a row carrying the private columns and
// assert none of them survive.
describe('toCompanion never forwards a private column', () => {
  const PRIVATE = ['payoutUpi', 'banReason', 'suspended', 'bannedAt', 'hourlyRate', 'distanceKm', 'premium'];

  const dbRow = () => ({
    id: 'x', name: 'Real Person', firstName: 'Real', maskedName: 'Rea···',
    city: 'Mumbai', area: 'Bandra West', age: 30,
    activities: ['City Walk'], languages: ['Hindi'],
    rating: 0, reviewCount: 0, reviewsList: [],
    ratePerMeeting: 499, bio: 'bio', suggestions: [],
    photo: 'https://images.unsplash.com/photo-1', accent: '#2E6BFF',
    gender: null, sameGenderNote: null, topMatch: null, verified: true,
    availableNow: false, availability: 'Weekends', matchScore: 50,
    createdAt: new Date(), updatedAt: new Date(),
    // The columns that must never cross:
    payoutUpi: '9876543210@paytm',
    banReason: 'an operator note about a person',
    suspended: false, bannedAt: null, hourlyRate: 50000, distanceKm: 3.2, premium: false,
  });

  it('drops every private column from the public payload', () => {
    const pub = toCompanion(dbRow() as never) as unknown as Record<string, unknown>;
    for (const k of PRIVATE) expect(Object.keys(pub), `${k} leaked`).not.toContain(k);
  });

  it('never serves a payout UPI id, to anyone', () => {
    const pub = toCompanion(dbRow() as never);
    expect(JSON.stringify(pub)).not.toContain('9876543210@paytm');
    // And still not after redaction, which spreads the object.
    expect(JSON.stringify(redactCompanion(pub))).not.toContain('9876543210@paytm');
  });

  it('still forwards what the cards legitimately render', () => {
    const pub = toCompanion(dbRow() as never);
    expect(pub.verified).toBe(true);
    expect(pub.reviews).toBe(0);
    expect(pub.area).toBe('Bandra West');
  });
});

describe('redaction actually masks the name', () => {
  it('does not hand back firstName, which is what maskedName removes', () => {
    const c = make({ id: 'a', city: 'Mumbai', name: 'Ananya Iyer', firstName: 'Ananya', maskedName: 'Ana···' });
    const r = redactCompanion(c);
    expect(r.name).toBe('Ana···');
    // The bug: `firstName: 'Ananya'` survived, so the mask was decoration and
    // only the client's choice of field hid the name.
    expect(r.firstName).toBe('Ana···');
    expect(JSON.stringify(r)).not.toContain('Ananya');
  });
});

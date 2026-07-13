import { describe, it, expect } from 'vitest';
import { applyPaywall, redactCompanion, freePreviewIds } from '@/lib/server/redact';
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
  distanceKm: 5, matchScore: 70,
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
    const once = blurredPhoto('https://images.unsplash.com/photo-1?w=480&q=80');
    expect(blurredPhoto(once)).toBe(once);
  });

  it('leaves a non-Unsplash URL alone (it cannot blur it, and must not pretend to)', () => {
    const owned = 'https://cdn.companio.in/real-photo.jpg';
    expect(blurredPhoto(owned)).toBe(owned);
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

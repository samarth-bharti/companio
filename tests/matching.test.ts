import { describe, it, expect } from 'vitest';
import { scoreCompanion, rankCompanions, activitiesFor, languagesFor } from '@/lib/matching';
import type { Companion } from '@/lib/data/companions';

const base: Companion = {
  id: 'x', name: 'X Y', firstName: 'X', maskedName: 'X··',
  city: 'Indore', area: 'Vijay Nagar',
  activities: [], languages: [],
  rating: 0, reviews: 0, ratePerMeeting: 499,
  bio: '', suggestions: [], photo: '', accent: '#000',
  availableNow: false, availability: 'Available tomorrow',
  matchScore: 70, reviewsList: [],
};

const make = (over: Partial<Companion>): Companion => ({ ...base, ...over });

const answers = (over: Partial<{ activities: string[]; languages: string[] }> = {}) => ({
  activities: [] as string[],
  languages: [] as string[],
  ...over,
});

describe('quiz vocabulary → catalogue vocabulary', () => {
  it('maps quiz activity ids onto the labels companions actually list', () => {
    expect(activitiesFor(['gym'])).toContain('Gym Buddy');
    expect(activitiesFor(['cafe'])).toContain('Café Chat');
    expect(activitiesFor(['nonsense'])).toEqual([]);
  });

  it('maps quiz language ids onto companion language names', () => {
    expect(languagesFor(['marathi', 'english'])).toEqual(['Marathi', 'English']);
    expect(languagesFor(['klingon'])).toEqual([]);
  });
});

describe('scoreCompanion', () => {
  it('rewards covering more of what was asked for', () => {
    const both = make({ activities: ['Gym Buddy', 'Café Chat'] });
    const one = make({ activities: ['Gym Buddy'] });
    const a = answers({ activities: ['gym', 'cafe'] });
    expect(scoreCompanion(both, a)).toBeGreaterThan(scoreCompanion(one, a));
  });

  it('scores a companion who covers nothing asked for at zero', () => {
    const c = make({ activities: ['Museum'], languages: ['Tamil'] });
    expect(scoreCompanion(c, answers({ activities: ['gym'], languages: ['marathi'] }))).toBe(0);
  });

  it('scores a perfect cover at 100', () => {
    const c = make({ activities: ['Gym Buddy'], languages: ['Marathi'] });
    expect(scoreCompanion(c, answers({ activities: ['gym'], languages: ['marathi'] }))).toBe(100);
  });

  // A member who answered nothing gives us nothing to rank on. Inventing a
  // spread here is exactly what the authored matchScore did.
  it('is neutral, and equal, for everyone when nothing was asked', () => {
    const a = make({ activities: ['Gym Buddy'] });
    const b = make({ activities: ['Museum'] });
    expect(scoreCompanion(a, answers())).toBe(scoreCompanion(b, answers()));
  });

  it('ignores an axis the member left blank rather than penalising it', () => {
    const c = make({ activities: ['Gym Buddy'], languages: [] });
    // Asked only about activities, and they match — languages must not drag it down.
    expect(scoreCompanion(c, answers({ activities: ['gym'] }))).toBe(100);
  });
});

describe('rankCompanions', () => {
  const woman = make({ id: 'w', gender: 'female', activities: ['Museum'] });
  const man = make({ id: 'm', gender: 'male', activities: ['Gym Buddy'] });
  const undeclared = make({ id: 'u', activities: ['Gym Buddy'] });

  it('sorts by real fit', () => {
    const ranked = rankCompanions([woman, man], { ...answers({ activities: ['gym'] }), comfort: { sameGender: false, publicPlaces: false } });
    expect(ranked[0].id).toBe('m');
  });

  // The promise the quiz has always made and never kept.
  it('excludes other genders when same-gender is asked for', () => {
    const ranked = rankCompanions(
      [woman, man],
      { ...answers(), comfort: { sameGender: true, publicPlaces: false } },
      'female',
    );
    expect(ranked.map((c) => c.id)).toEqual(['w']);
  });

  // Showing someone whose gender we are guessing at is the failure this prevents.
  it('excludes a companion who never declared a gender', () => {
    const ranked = rankCompanions(
      [woman, undeclared],
      { ...answers(), comfort: { sameGender: true, publicPlaces: false } },
      'female',
    );
    expect(ranked.map((c) => c.id)).toEqual(['w']);
  });

  // A self-described or undisclosed member has no category to compare against.
  // We must not silently exclude everyone — we simply cannot narrow.
  it('does not filter when the member has no comparable gender', () => {
    const ranked = rankCompanions(
      [woman, man],
      { ...answers(), comfort: { sameGender: true, publicPlaces: false } },
      undefined,
    );
    expect(ranked).toHaveLength(2);
  });
});

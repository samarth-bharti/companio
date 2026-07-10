import { describe, it, expect } from 'vitest';
import { isAdult, ageInYears, parseDateOfBirth, MIN_AGE } from '@/lib/server/age';

const NOW = new Date('2026-07-10T12:00:00.000Z');

describe('ageInYears', () => {
  it('counts whole years', () => {
    expect(ageInYears(new Date('2000-07-10'), NOW)).toBe(26);
  });

  it('does not count a birthday that has not happened yet this year', () => {
    // The naive year subtraction says 18. They turn 18 tomorrow.
    expect(ageInYears(new Date('2008-07-11'), NOW)).toBe(17);
  });

  it('counts the birthday itself', () => {
    expect(ageInYears(new Date('2008-07-10'), NOW)).toBe(18);
  });
});

describe('isAdult', () => {
  it('is false for a missing date of birth — unknown age is not adult age', () => {
    expect(isAdult(null, NOW)).toBe(false);
    expect(isAdult(undefined, NOW)).toBe(false);
  });

  it('is false the day before the 18th birthday, true on it', () => {
    expect(isAdult(new Date('2008-07-11'), NOW)).toBe(false);
    expect(isAdult(new Date('2008-07-10'), NOW)).toBe(true);
  });

  it('is false for a date in the future', () => {
    expect(isAdult(new Date('2030-01-01'), NOW)).toBe(false);
  });

  it('is false for an invalid Date', () => {
    expect(isAdult(new Date('not-a-date'), NOW)).toBe(false);
  });

  it('rejects a typo\'d century that would otherwise read as a very old adult', () => {
    expect(isAdult(new Date('0198-05-04'), NOW)).toBe(false);
  });

  it('agrees with MIN_AGE', () => {
    const exactly = new Date(NOW);
    exactly.setFullYear(exactly.getFullYear() - MIN_AGE);
    expect(isAdult(exactly, NOW)).toBe(true);
  });
});

describe('parseDateOfBirth', () => {
  it('parses YYYY-MM-DD', () => {
    expect(parseDateOfBirth('1998-05-04')?.toISOString()).toBe('1998-05-04T00:00:00.000Z');
  });

  it('rejects anything that is not YYYY-MM-DD', () => {
    for (const bad of ['04-05-1998', '1998/05/04', '1998-5-4', '', 'yesterday']) {
      expect(parseDateOfBirth(bad)).toBeNull();
    }
  });

  it('rejects a date that does not exist, which Date would silently roll forward', () => {
    // new Date('2026-02-31') becomes 3 March. That must not pass.
    expect(parseDateOfBirth('2026-02-31')).toBeNull();
    expect(parseDateOfBirth('2026-13-01')).toBeNull();
  });

  it('accepts a real leap day', () => {
    expect(parseDateOfBirth('2000-02-29')).not.toBeNull();
  });
});

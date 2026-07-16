import { describe, it, expect } from 'vitest';
import { getAreaAnchor, normaliseArea, cityHasRealAreas } from '@/lib/data/areas';
import { getCity } from '@/lib/data/cities';
import { COMPANIONS } from '@/lib/data/companions';

describe('normaliseArea', () => {
  it('strips the direction suffix Companion.area carries', () => {
    expect(normaliseArea('Bandra West')).toBe('bandra');
    expect(normaliseArea('Andheri East')).toBe('andheri');
  });
  it('is case- and whitespace-insensitive', () => {
    expect(normaliseArea('  LOWER PAREL  ')).toBe('lower parel');
  });
  it('leaves an area with no suffix alone', () => {
    expect(normaliseArea('Colaba')).toBe('colaba');
    // "West" inside a name, not as a suffix, must survive.
    expect(normaliseArea('Westfield')).toBe('westfield');
  });
});

describe('getAreaAnchor', () => {
  it('returns null for a city we have not mapped, rather than a guess', () => {
    expect(getAreaAnchor('jaipur', 'C-Scheme')).toBeNull();
    expect(cityHasRealAreas('jaipur')).toBe(false);
  });

  it('returns null for an unknown area inside a mapped city', () => {
    expect(getAreaAnchor('mumbai', 'Atlantis')).toBeNull();
  });

  // The static catalogue is empty (see tests/catalogue.test.ts), so this is
  // vacuous today and kept for the day it isn't: anyone listing in Mumbai must
  // live in a neighbourhood the map can actually place.
  it('resolves every area our Mumbai companions live in', () => {
    for (const c of COMPANIONS.filter((x) => x.city === 'Mumbai')) {
      expect(getAreaAnchor('mumbai', c.area), `no anchor for "${c.area}"`).not.toBeNull();
    }
  });

  it('places every Mumbai anchor inside a sane box around the city', () => {
    // Guards a transposed lat/lng, or a stray decimal point, landing a
    // neighbourhood in the Arabian Sea.
    const city = getCity('mumbai');
    for (const c of COMPANIONS.filter((x) => x.city === 'Mumbai')) {
      const a = getAreaAnchor('mumbai', c.area)!;
      expect(Math.abs(a.lat - city.lat)).toBeLessThan(0.4); // ~44 km
      expect(Math.abs(a.lng - city.lng)).toBeLessThan(0.4);
    }
  });

  it('gives distinct neighbourhoods distinct anchors', () => {
    const bandra = getAreaAnchor('mumbai', 'Bandra West')!;
    const colaba = getAreaAnchor('mumbai', 'Colaba')!;
    // The old code hashed both to a cloud around the city centre. They are
    // ~17 km apart; anything under a couple of km means clustering broke.
    const dLat = Math.abs(bandra.lat - colaba.lat);
    expect(dLat).toBeGreaterThan(0.05);
  });

  it('is case-insensitive on the city id', () => {
    expect(getAreaAnchor('Mumbai', 'Bandra West')).toEqual(getAreaAnchor('mumbai', 'bandra'));
  });
});

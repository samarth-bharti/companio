import { describe, it, expect } from 'vitest';
import { getAreaAnchor, cityHasRealAreas } from '@/lib/data/areas';
import { CITIES, getCity, cityIdFromName } from '@/lib/data/cities';
import {
  COMPANIONS,
  companionsInCity,
  cityIsLive,
  topMatchIdFor,
  freeNowCountIn,
} from '@/lib/data/companions';

// The static catalogue is EMPTY, and these tests are most of what keeps it that
// way. It used to hold 22 invented people with stock portraits, which the
// explore grid served as the profiles a pass unlocks — i.e. Companio charged for
// access to people who could not be met.
//
// Real companions live in the `companions` table and arrive through an
// application and a hand-checked ID. Nothing may be authored back into
// lib/data/companions.ts.
//
// The per-companion invariants below (a real city, a mapped neighbourhood, no
// invented reputation) are vacuous today. They are kept deliberately: the moment
// somebody re-adds a profile, they stop being vacuous and start failing.

describe('the static companion catalogue', () => {
  /**
   * The one that matters. If this fails, someone has authored a person into the
   * codebase — read the header of lib/data/companions.ts before "fixing" it.
   */
  it('is empty: Companio does not ship invented people', () => {
    expect(COMPANIONS).toEqual([]);
  });

  it('leaves every city with no static supply, and says so', () => {
    for (const city of CITIES) {
      expect(cityIsLive(city.name), `${city.name}`).toBe(false);
      expect(companionsInCity(city.name)).toEqual([]);
      expect(freeNowCountIn(city.name)).toBe(0);
      // No supply means no teaser to unblur — an empty city must not point at a
      // profile that isn't there.
      expect(topMatchIdFor(city.name), `${city.name} offers a teaser`).toBeUndefined();
    }
  });
});

describe('invariants any future companion must satisfy', () => {
  it('has no fabricated reputation: nobody is rated before they are reviewed', () => {
    for (const c of COMPANIONS) {
      expect(c.reviews, `${c.id} claims reviews`).toBe(0);
      expect(c.rating, `${c.id} claims a rating`).toBe(0);
      expect(c.reviewsList, `${c.id} carries invented reviews`).toEqual([]);
    }
  });

  it('places every companion in a city we actually list', () => {
    for (const c of COMPANIONS) {
      expect(cityIdFromName(c.city), `unknown city "${c.city}" on ${c.id}`).toBeDefined();
    }
  });

  it('gives every companion a unique id', () => {
    const ids = COMPANIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('offers at most one top match per city, and always one where anyone lists', () => {
    for (const city of CITIES) {
      const flagged = companionsInCity(city.name).filter((c) => c.topMatch);
      expect(flagged.length, `${city.name} has ${flagged.length} top matches`).toBeLessThanOrEqual(1);

      // A locked visitor must always have exactly one unblurred profile to see;
      // otherwise a live city is a wall of blur with nothing to buy.
      if (cityIsLive(city.name)) {
        expect(topMatchIdFor(city.name), `${city.name} has no teaser`).toBeDefined();
      } else {
        expect(topMatchIdFor(city.name)).toBeUndefined();
      }
    }
  });

  it('never counts a companion towards a city they do not live in', () => {
    // The regression this pins: `localizeArea()` relabelled all 14 Mumbai
    // profiles into whichever city was selected.
    for (const city of CITIES) {
      for (const c of companionsInCity(city.name)) {
        expect(c.city).toBe(city.name);
      }
    }
    const total = CITIES.reduce((n, city) => n + companionsInCity(city.name).length, 0);
    expect(total).toBe(COMPANIONS.length);
  });

  it('reports free-now counts per city, not across the network', () => {
    for (const city of CITIES) {
      const expected = companionsInCity(city.name).filter((c) => c.availableNow).length;
      expect(freeNowCountIn(city.name)).toBe(expected);
    }
    expect(freeNowCountIn('Jaipur')).toBe(0);
  });
});

describe('map anchors', () => {
  // Neighbourhood geography is AUTHORED REFERENCE DATA, not supply: Bandra West
  // is at those coordinates whether or not anyone lists there. So the map keeps
  // its anchors while the catalogue is empty. What must stay true is the reverse
  // direction — nobody may list in a neighbourhood we cannot place on a map.
  const MAPPED_CITIES = ['Mumbai', 'Indore'];

  it('still maps the cities we have surveyed', () => {
    for (const name of MAPPED_CITIES) {
      expect(cityHasRealAreas(cityIdFromName(name)!), name).toBe(true);
    }
  });

  it('resolves an anchor for every companion, wherever they list', () => {
    for (const city of CITIES) {
      const cityId = cityIdFromName(city.name)!;
      for (const c of companionsInCity(city.name)) {
        expect(getAreaAnchor(cityId, c.area), `no anchor for "${c.area}" (${c.id})`).not.toBeNull();
      }
    }
  });

  it('keeps every anchor inside a sane box around its own city centre', () => {
    // Guards a transposed lat/lng, or a stray decimal, dropping a neighbourhood
    // into the Arabian Sea — or into the wrong city entirely.
    for (const name of MAPPED_CITIES) {
      const cityId = cityIdFromName(name)!;
      const city = getCity(cityId);
      for (const c of companionsInCity(name)) {
        const a = getAreaAnchor(cityId, c.area)!;
        expect(Math.abs(a.lat - city.lat), `${c.area} latitude`).toBeLessThan(0.4); // ~44 km
        expect(Math.abs(a.lng - city.lng), `${c.area} longitude`).toBeLessThan(0.4);
      }
    }
  });

  it('does not leak Mumbai anchors into Indore, or the reverse', () => {
    expect(getAreaAnchor('indore', 'Bandra West')).toBeNull();
    expect(getAreaAnchor('mumbai', 'Vijay Nagar')).toBeNull();
  });

  it('returns null for a city we have not mapped, rather than a guess', () => {
    expect(getAreaAnchor('jaipur', 'C-Scheme')).toBeNull();
    expect(cityHasRealAreas('jaipur')).toBe(false);
  });
});

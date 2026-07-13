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

// The catalogue and the map used to disagree by design: every city rendered the
// same fourteen Mumbai people, and only Mumbai had coordinates. These tests pin
// the invariant that replaced that — a city either has real companions in real,
// mapped neighbourhoods, or it has none and says so.

const LIVE_CITIES = ['Mumbai', 'Indore'];

describe('the companion catalogue', () => {
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

  it('marks exactly the live cities as live', () => {
    for (const city of CITIES) {
      expect(cityIsLive(city.name), `${city.name}`).toBe(LIVE_CITIES.includes(city.name));
    }
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

describe('map anchors track the catalogue', () => {
  it('maps the neighbourhoods of every live city, and only those', () => {
    for (const city of CITIES) {
      expect(cityHasRealAreas(city.id), `${city.name}`).toBe(cityIsLive(city.name));
    }
  });

  it('resolves an anchor for every companion, in every live city', () => {
    for (const name of LIVE_CITIES) {
      const cityId = cityIdFromName(name)!;
      const people = companionsInCity(name);
      expect(people.length).toBeGreaterThan(0);
      for (const c of people) {
        expect(getAreaAnchor(cityId, c.area), `no anchor for "${c.area}" (${c.id})`).not.toBeNull();
      }
    }
  });

  it('keeps every anchor inside a sane box around its own city centre', () => {
    // Guards a transposed lat/lng, or a stray decimal, dropping a neighbourhood
    // into the Arabian Sea — or into the wrong city entirely.
    for (const name of LIVE_CITIES) {
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

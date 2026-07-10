// lib/data/areas.ts
//
// Approximate centres for the neighbourhoods companions list.
//
// WHY: MapView used to jitter every companion around the CITY centre using a
// hash of their id. `area` was fed into the hash as a seed but never used
// geographically, so a companion labelled "Bandra West" and one labelled
// "Colaba" — 20 km apart in reality — landed in the same random cloud over
// downtown Mumbai. The map looked plausible and told you nothing.
//
// PRECISION: these are neighbourhood centroids good to roughly a kilometre.
// That is all the map needs, and all it should have: every companion is drawn
// as a 1.5 km privacy circle anchored here, never as a point, and never at
// anyone's real address. Sub-kilometre accuracy would be false precision.
//
// COVERAGE: Mumbai only, deliberately. It is the one city with real companion
// profiles (see lib/data/cities.ts — every other city re-skins the same people
// via localizeArea()). Inventing coordinates for neighbourhoods with no real
// companions in them would dress up fake data as real. Unmapped areas fall back
// to a deterministic offset from the city centre, exactly as before.

export interface AreaAnchor {
  lat: number;
  lng: number;
}

/** Keys are normalised: lower-case, no direction suffix. See normaliseArea(). */
const MUMBAI_AREAS: Record<string, AreaAnchor> = {
  bandra:        { lat: 19.0596, lng: 72.8295 },
  colaba:        { lat: 18.9067, lng: 72.8147 },
  andheri:       { lat: 19.1197, lng: 72.8468 },
  dadar:         { lat: 19.0178, lng: 72.8478 },
  powai:         { lat: 19.1176, lng: 72.9060 },
  juhu:          { lat: 19.1075, lng: 72.8263 },
  'lower parel': { lat: 18.9960, lng: 72.8302 },
  matunga:       { lat: 19.0270, lng: 72.8570 },
  versova:       { lat: 19.1340, lng: 72.8140 },
  'vile parle':  { lat: 19.0990, lng: 72.8470 },
  worli:         { lat: 19.0176, lng: 72.8170 },
  chembur:       { lat: 19.0522, lng: 72.9005 },
  malad:         { lat: 19.1860, lng: 72.8484 },
  fort:          { lat: 18.9345, lng: 72.8347 },
  khar:          { lat: 19.0700, lng: 72.8360 },
};

const CITY_AREAS: Record<string, Record<string, AreaAnchor>> = {
  mumbai: MUMBAI_AREAS,
};

/**
 * "Bandra West" → "bandra". Companion.area carries a direction suffix that the
 * anchor table doesn't (and shouldn't — the whole neighbourhood is inside one
 * privacy circle).
 */
export function normaliseArea(area: string): string {
  return area
    .toLowerCase()
    .replace(/\s+(east|west|north|south)$/i, '')
    .trim();
}

/**
 * The anchor for a companion's neighbourhood, or null when we have no verified
 * coordinates for it. Callers fall back to a city-centre offset — never to a
 * guessed coordinate.
 */
export function getAreaAnchor(cityId: string, area: string): AreaAnchor | null {
  const table = CITY_AREAS[cityId.toLowerCase()];
  if (!table) return null;
  return table[normaliseArea(area)] ?? null;
}

/** True when this city's neighbourhoods are really mapped, not approximated. */
export function cityHasRealAreas(cityId: string): boolean {
  return !!CITY_AREAS[cityId.toLowerCase()];
}

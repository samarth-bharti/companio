// The Companion shape, and helpers over a catalogue that is now EMPTY.
//
// THIS FILE USED TO CONTAIN 22 PEOPLE WHO DO NOT EXIST.
//
// Ananya, Rohan, Priya, Aarav, Zara and seventeen others: names, ages,
// neighbourhoods, bios about the hills past Rau, and Unsplash stock portraits.
// `prisma/seed.ts` upserted them into the `companions` table and the explore
// grid served them as the catalogue.
//
// The pass sells exactly one thing: the right to see a companion's photo and
// contact details. Selling that access to a stock photo is not a growth tactic
// or a placeholder — it is taking money for access to a person who cannot be
// met, and the first buyer discovers it the moment they send a message and
// nothing comes back.
//
// So the catalogue is empty, because that is the true state of the business:
// Companio has no companions yet. Supply comes from real applications through
// /become-a-companion, approved by hand in /admin/applications after an ID check
// — which is exactly what the home page has always promised ("No profile goes
// live until an ID check clears"). Cities with nobody in them show an empty
// state inviting the first companion.
//
// DO NOT re-add fictional profiles here, not even "just to demo it". If you need
// to see a populated grid, approve a real application in the admin panel, or
// insert rows into your own local database where they cannot reach a customer.
//
// The type and the helpers below stay: ~30 components import `Companion`, and
// the helpers are what the local/demo data client reads. Over an empty array
// they correctly answer "nobody".
//
// Bio, suggestions and activities are strictly platonic per §1.5.

export interface Companion {
  id: string;
  name: string;           // full name, shown when unlocked
  firstName: string;
  maskedName: string;     // first 3 letters + '···'
  city: string;
  area: string;
  age?: number;
  activities: string[];
  languages: string[];
  /** 0 until real reviews exist. Never render stars while `reviews === 0`. */
  rating: number;
  /** Count of real reviews. 0 for every seeded profile. */
  reviews: number;
  ratePerMeeting: number;
  bio: string;
  suggestions: string[];  // "What we'd do" — 3 city-specific ideas
  photo: string;          // Unsplash portrait URL
  accent: string;         // one of the four theme hex values
  /**
   * The companion's own gender. Drives the same-gender filter, which is a
   * comfort/safety promise the quiz has always made and nothing has ever kept —
   * because until now companions had no gender at all, on the row or in the type.
   *
   * Absent ⇒ undeclared ⇒ matches nobody who asked for same-gender company.
   * Guessing here would be worse than showing fewer people.
   */
  gender?: 'male' | 'female' | 'nonbinary';
  sameGenderNote?: boolean;
  topMatch?: boolean;     // at most one per city
  /**
   * Whether an operator has actually cleared this person's government ID.
   *
   * DATABASE-OWNED. It is deliberately absent from every authored entry below,
   * so the seed (which spreads authored fields into its update branch) can never
   * write it and re-verify someone an admin un-verified. Absent ⇒ not verified.
   *
   * The "Verified" badge renders off this and nothing else. It used to be
   * hardcoded markup on every card, which told members that 22 seeded profiles
   * had passed an ID check that none of them had been through.
   */
  verified?: boolean;
  availableNow: boolean;
  availability: string;    // e.g. "Free now" | "Free this evening" | …
  /**
   * NOT A DISTANCE FROM YOU. An authored constant, still in the database column
   * so the seed's shape is unchanged, but no longer part of the client type: it
   * was rendered as "3.2 km away" on every card and drove the DEFAULT "Nearest"
   * sort, and we have never known where any member is standing. The area is the
   * honest answer, and the area is real.
   */
  matchScore: number;      // authored fallback; the real score is lib/matching.ts
  reviewsList: {
    name: string;
    city: string;
    stars: number;
    text: string;
  }[];
}

// ── Dataset ───────────────────────────────────────────────────────────────────
//
// Empty, and meant to be. See the header. Real companions live in the
// `companions` table and arrive through the application + ID-check flow.

export const COMPANIONS: Companion[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
//
// These take a CITY NAME (`'Mumbai'`), matching `Companion.city`, not a City id.
// Callers holding an id should go through `getCity(id).name`.

export function getCompanion(id: string): Companion | undefined {
  return COMPANIONS.find((c) => c.id === id);
}

/** Everyone who actually lists in this city. Empty for cities we do not serve. */
export function companionsInCity(cityName: string): Companion[] {
  return COMPANIONS.filter((c) => c.city === cityName);
}

/** True when at least one companion lists here. */
export function cityIsLive(cityName: string): boolean {
  return COMPANIONS.some((c) => c.city === cityName);
}

/**
 * The one profile shown unblurred to locked visitors in this city — the teaser
 * that a pass buys the rest of. Falls back to the highest match score when no
 * profile in the city sets `topMatch`, so a new city is never all-blur.
 */
export function topMatchIdFor(cityName: string): string | undefined {
  const inCity = companionsInCity(cityName);
  if (!inCity.length) return undefined;
  const flagged = inCity.find((c) => c.topMatch);
  if (flagged) return flagged.id;
  return inCity.reduce((best, c) => (c.matchScore > best.matchScore ? c : best)).id;
}

/** How many companions in this city are marked free right now. */
export function freeNowCountIn(cityName: string): number {
  return companionsInCity(cityName).filter((c) => c.availableNow).length;
}

/**
 * The teaser profile for the default city.
 *
 * This was the string 'ananya' — a hard-coded pointer at one fictional Mumbai
 * profile, which is how the quiz once "matched" everybody to the same person no
 * matter what they answered (see lib/matching.ts). There is no default teaser
 * any more; ask topMatchIdFor(cityName), which answers from real supply.
 */
export const TOP_MATCH_ID: string | undefined = undefined;

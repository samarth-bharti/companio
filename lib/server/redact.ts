// lib/server/redact.ts
//
// THE PAYWALL, ON THE SERVER, WHERE A PAYWALL HAS TO LIVE.
//
// It used to be a CSS blur and a client-side redirect. `GET /api/companions`
// answered every request — signed in or not, paid or not — with the complete
// catalogue: full names, full bios, everything. `/companion/<id>` server-rendered
// the whole profile and then bounced you in a useEffect. So the ₹199 unlock
// protected nothing that `curl` could not read, and "8 blurred profiles" was a
// picture of a paywall rather than one.
//
// A member who has not unlocked now receives a redacted row. Not a hidden one —
// the card still needs a masked name, a city, an area, activities, languages —
// but the things being SOLD (the full name, the bio, the suggestions, the
// reviews) never leave the server.
//
// The exception is the free preview: one companion per city is fully visible, so
// there is something real to judge the unlock by. That is the teaser the explore
// grid has always shown unblurred.

import type { Companion } from '@/lib/data/companions';
import { blurredPhoto } from '@/lib/photo';

/**
 * The one companion per city who is free to see.
 *
 * Mirrors `topMatchIdFor` but reads the rows we actually served, not the seed
 * file — an admin who suspends the teaser must not leave the city with a preview
 * that no longer exists.
 */
export function freePreviewIds(companions: Companion[]): Set<string> {
  const byCity = new Map<string, Companion[]>();
  for (const c of companions) {
    const list = byCity.get(c.city);
    if (list) list.push(c);
    else byCity.set(c.city, [c]);
  }

  const ids = new Set<string>();
  for (const list of byCity.values()) {
    const flagged = list.find((c) => c.topMatch);
    const pick = flagged ?? list.reduce((best, c) => (c.matchScore > best.matchScore ? c : best));
    if (pick) ids.add(pick.id);
  }
  return ids;
}

/**
 * Strip everything the unlock is supposed to buy.
 *
 * What survives is what a locked card legitimately renders: who is roughly
 * nearby, what they do, what they speak. What does not survive is who they are.
 */
export function redactCompanion(c: Companion): Companion {
  return {
    ...c,
    name: c.maskedName,
    // `firstName` used to survive this. maskedName is "first 3 letters + ···",
    // so shipping firstName handed back precisely what the mask removed — and
    // the only thing hiding it was the client choosing to render maskedName
    // instead (ExploreClient: `unlocked ? firstName : maskedName`). That is the
    // same "the server sent it, the browser politely looked away" mistake as
    // CSS-blurring a sharp photo, which is what the header of this file exists
    // to warn about.
    firstName: c.maskedName,
    bio: '',
    suggestions: [],
    reviewsList: [],
    // '' when the photo cannot be blurred at its source. blurredPhoto() answers
    // null rather than handing back the original — a face we cannot destroy is a
    // face we do not send — and an empty string is how this type says "no photo"
    // to the card, which renders a placeholder for it.
    photo: blurredPhoto(c.photo) ?? '',
  };
}

/**
 * Apply the paywall to a list. `unlocked` members get everything; everyone else
 * gets their city's free preview in full and the rest redacted.
 */
export function applyPaywall(companions: Companion[], unlocked: boolean): Companion[] {
  if (unlocked) return companions;
  const free = freePreviewIds(companions);
  return companions.map((c) => (free.has(c.id) ? c : redactCompanion(c)));
}

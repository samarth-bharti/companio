'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Loads /api/companion/dashboard and reports, precisely, which of four worlds
 * the viewer is in. The distinction matters: this page shows a companion how
 * much money they are owed.
 *
 *   'loading' — nothing known yet. Render skeletons, never numbers.
 *   'preview' — 401/403. Not signed in, or not a companion. This is the public
 *               marketing preview. Illustrative figures are fine, and the page
 *               labels them as such.
 *   'live'    — real data for a real companion.
 *   'error'   — the request failed. Show the error. NEVER fall back to the
 *               preview figures: the old CompanionDashEarnings did exactly that,
 *               so a network blip showed a real companion "₹7,485 this month" —
 *               money they had not earned and would come asking for.
 *
 * Six panels render this page, so the request is shared: one fetch, one result,
 * broadcast to every subscriber. Without this the page would open with six
 * identical round trips.
 */

export interface CompanionMeetup {
  id: string;
  activity: string;
  dateISO: string;
  time: string;
  place: string;
  status: string;
  /** The 4 digits the member is also holding. Absent on pre-existing bookings. */
  meetupCode?: string;
  memberFirstName: string;
}

export interface CompanionDashboardData {
  profile: {
    id: string;
    name: string;
    firstName: string;
    city: string;
    area: string;
    bio: string;
    activities: string[];
    photo: string;
    hourlyRate: number;
    rating: number;
    reviewCount: number;
    verified: boolean;
    premium: boolean;
    availableNow: boolean;
    availability: string;
    payoutUpi: string | null;
    suspended: boolean;
  };
  earnings: {
    pendingPaise: number;
    paidPaise: number;
    totalPaise: number;
    upcomingBookings: number;
    completedBookings: number;
  };
  upcoming: CompanionMeetup[];
}

export type CompanionDashboardState =
  | { status: 'loading' }
  | { status: 'preview' }
  | { status: 'live'; data: CompanionDashboardData }
  | { status: 'error'; message: string };

// ── Shared, module-scoped store ──────────────────────────────────────────────

let current: CompanionDashboardState = { status: 'loading' };
let inFlight: Promise<void> | null = null;
const subscribers = new Set<(s: CompanionDashboardState) => void>();

function publish(next: CompanionDashboardState) {
  current = next;
  for (const fn of subscribers) fn(next);
}

async function load(): Promise<void> {
  try {
    const r = await fetch('/api/companion/dashboard');
    // Signed out, or a member rather than a companion: the marketing preview.
    if (r.status === 401 || r.status === 403) return publish({ status: 'preview' });
    if (!r.ok) {
      return publish({
        status: 'error',
        message:
          r.status === 404
            ? 'Your companion profile could not be found. Please contact support.'
            : 'We could not load your dashboard. Please refresh in a moment.',
      });
    }
    publish({ status: 'live', data: (await r.json()) as CompanionDashboardData });
  } catch {
    publish({ status: 'error', message: 'You appear to be offline. Your figures are not shown.' });
  }
}

/** Fetch once; concurrent callers await the same promise. */
function ensureLoaded(): Promise<void> {
  inFlight ??= load().finally(() => { inFlight = null; });
  return inFlight;
}

export function useCompanionDashboard(): CompanionDashboardState & { refresh: () => void } {
  const [state, setState] = useState<CompanionDashboardState>(current);

  useEffect(() => {
    subscribers.add(setState);
    setState(current);
    // Every panel asks, but they mount in the same commit, so `inFlight`
    // collapses them into one request. Asking unconditionally (rather than only
    // when `loading`) means navigating away and back re-reads fresh figures
    // instead of showing whatever the module last cached.
    void ensureLoaded();
    return () => { subscribers.delete(setState); };
  }, []);

  // A save elsewhere on the page invalidates every panel, so refresh re-fetches
  // once and broadcasts to all of them.
  const refresh = useCallback(() => { void ensureLoaded(); }, []);

  return { ...state, refresh };
}

/** Format paise as a plain rupee figure, e.g. 749500 → "7,495". */
export function rupeeFigure(paise: number): string {
  return Math.round(paise / 100).toLocaleString('en-IN');
}

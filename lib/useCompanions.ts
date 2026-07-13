'use client';

import { useEffect, useState } from 'react';
import type { Companion } from '@/lib/data/companions';

/**
 * The companion catalogue, from the database.
 *
 * The explore grid and the map used to import `COMPANIONS` from
 * `lib/data/companions.ts` and render it directly. That module is seed data: it
 * is what the `companions` table is *initialised* with, not what it *contains*.
 * Anything an admin did afterwards — suspending a profile, banning it, approving
 * a new applicant — was invisible to every visitor, because the grid was
 * rendering a JavaScript array compiled into the bundle.
 *
 * `GET /api/companions` applies `VISIBLE_COMPANION`, so suspended and banned
 * profiles never arrive here. When no DATABASE_URL is configured the route
 * returns the seed catalogue, which is the same data the table would hold.
 *
 * `error` is deliberately surfaced rather than swallowed into an empty list: a
 * grid that silently shows nothing when the database is down looks identical to
 * a city with no companions, and those must never be confused.
 */
export interface CompanionsState {
  companions: Companion[];
  loading: boolean;
  error: boolean;
}

export function useCompanions(): CompanionsState {
  const [state, setState] = useState<CompanionsState>({
    companions: [],
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/companions')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Companion[]>;
      })
      .then((companions) => {
        if (!cancelled) setState({ companions, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ companions: [], loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

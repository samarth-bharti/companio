'use client';

import { useEffect, useState } from 'react';

/**
 * Can this deployment create a real server session?
 *
 * The UI needs that answer to choose between the real sign-in flow and the
 * local demo. Getting it wrong in the demo direction is how the free-unlock
 * bypass worked, so treat "unknown" as "not yet decided" (keep buttons inert
 * while `loading`) rather than optimistically assuming either.
 *
 * Answered by /api/auth/capability, not next-auth's /api/auth/providers: the
 * latter 500s in production without NEXTAUTH_SECRET, which is precisely the
 * demo configuration we're trying to detect.
 *
 * The result is cached at module scope. It cannot change without a redeploy,
 * and NavUser + LoginForm both ask on the same page.
 */

export interface AuthCapability {
  loading: boolean;
  /** True when a real server session can be created and persisted. */
  configured: boolean;
}

let cached: boolean | undefined;
let inFlight: Promise<boolean> | undefined;

function fetchCapability(): Promise<boolean> {
  if (cached !== undefined) return Promise.resolve(cached);
  inFlight ??= fetch('/api/auth/capability')
    .then((r) => (r.ok ? r.json() : { configured: false }))
    .then((d: { configured?: boolean }) => {
      cached = !!d.configured;
      return cached;
    })
    .catch(() => {
      // Offline, or the route is missing. A demo build is the safe reading:
      // it never grants anything the server would have had to authorise.
      cached = false;
      return false;
    })
    .finally(() => { inFlight = undefined; });
  return inFlight;
}

export function useAuthCapability(): AuthCapability {
  const [state, setState] = useState<AuthCapability>(
    cached === undefined
      ? { loading: true, configured: false }
      : { loading: false, configured: cached },
  );

  useEffect(() => {
    if (cached !== undefined) return;
    let cancelled = false;
    fetchCapability().then((configured) => {
      if (!cancelled) setState({ loading: false, configured });
    });
    return () => { cancelled = true; };
  }, []);

  return state;
}

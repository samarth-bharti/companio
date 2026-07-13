'use client';

import { useEffect, useState } from 'react';

/**
 * Which sign-in methods can this deployment actually complete?
 *
 * The UI needs that answer so it only ever offers a method that ends in a real
 * server session. Getting it wrong optimistically is how the free-unlock bypass
 * worked, so treat "unknown" as "not yet decided" (keep buttons inert while
 * `loading`) rather than assuming either way.
 *
 * Answered by /api/auth/capability, not next-auth's /api/auth/providers: the
 * latter 500s in production without NEXTAUTH_SECRET, which is precisely the
 * misconfiguration we are trying to detect.
 *
 * The result is cached at module scope. It cannot change without a redeploy,
 * and NavUser + LoginForm both ask on the same page.
 */

export interface AuthCapability {
  loading: boolean;
  /** True when at least one method can create and persist a real session. */
  configured: boolean;
  /** Google OAuth is registered and can write a User row. */
  google: boolean;
  /** Email one-time codes can be minted, delivered, and verified. */
  emailOtp: boolean;
}

type Caps = Omit<AuthCapability, 'loading'>;

const NONE: Caps = { configured: false, google: false, emailOtp: false };

let cached: Caps | undefined;
let inFlight: Promise<Caps> | undefined;

function fetchCapability(): Promise<Caps> {
  if (cached !== undefined) return Promise.resolve(cached);
  inFlight ??= fetch('/api/auth/capability')
    .then((r) => (r.ok ? r.json() : NONE))
    .then((d: Partial<Caps>) => {
      cached = {
        configured: !!d.configured,
        google: !!d.google,
        emailOtp: !!d.emailOtp,
      };
      return cached;
    })
    .catch(() => {
      // Offline, or the route is missing. "No method works" is the safe reading:
      // it never grants anything the server would have had to authorise.
      cached = NONE;
      return NONE;
    })
    .finally(() => {
      inFlight = undefined;
    });
  return inFlight;
}

export function useAuthCapability(): AuthCapability {
  const [state, setState] = useState<AuthCapability>(
    cached === undefined ? { loading: true, ...NONE } : { loading: false, ...cached },
  );

  useEffect(() => {
    if (cached !== undefined) return;
    let cancelled = false;
    fetchCapability().then((caps) => {
      if (!cancelled) setState({ loading: false, ...caps });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

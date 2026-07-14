'use client';

import { useSession } from 'next-auth/react';

/**
 * "Can viewer-scoped data be read right now?"
 *
 * Viewer slices (`user`, `notifications`, `wallet`, `unlocked`, …) come from one
 * of two places depending on NEXT_PUBLIC_DATA_CLIENT:
 *
 *   local — localStorage. Readable by anyone, signed in or not. Always ready.
 *   http  — the API routes, every one of which requires a session and answers
 *           401 without one.
 *
 * So in http mode a signed-out visitor has nothing to read, and asking anyway is
 * not neutral: `Nav` sits in the root layout, so every public page fired
 * /api/user and /api/notifications for anonymous visitors and logged three 401s
 * to the console. In production those become Sentry events on every landing-page
 * hit, burying real errors in noise.
 *
 * Guard viewer reads with this instead. For a guest the correct answer is the
 * fallback — not a request.
 */

// Read at module scope: Next inlines NEXT_PUBLIC_* at build time, so this is a
// constant, not a per-render lookup.
const NEEDS_SESSION = process.env.NEXT_PUBLIC_DATA_CLIENT === 'http';

/**
 * Does the viewer's identity live in a server session (http mode), or in this
 * browser (local demo mode)? Not a hook — safe to call anywhere.
 */
export function viewerNeedsSession(): boolean {
  return NEEDS_SESSION;
}

export function useViewerReady(): boolean {
  // Always called — a hook may not be conditional. In local mode the result is
  // simply ignored.
  const { status } = useSession();
  if (!NEEDS_SESSION) return true;
  return status === 'authenticated';
}

/**
 * "Do we yet KNOW whether this visitor is signed in?"
 *
 * `useViewerReady()` collapses "still loading" and "definitely a guest" into one
 * `false`, which is right for deciding whether to fetch but wrong for deciding
 * what to paint. Explore defaulted its lock state to `locked`, so on every reload
 * a member who had paid ₹199 was shown the blurred paywall and an "Unlock to book"
 * button until next-auth resolved — being asked to buy something they already own.
 *
 * Gate the *render* on this and keep a skeleton until it is true. A paywall must
 * never be the default state of an unknown viewer.
 */
export function useViewerResolved(): boolean {
  const { status } = useSession();
  if (!NEEDS_SESSION) return true;
  return status !== 'loading';
}

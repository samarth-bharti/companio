'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { dataClient } from '@/lib/dataClient';
import { useData } from '@/lib/useData';
import { useViewerReady, useViewerResolved, viewerNeedsSession } from '@/lib/useViewerReady';
import { parseDateOfBirth, isAdult } from '@/lib/age';
import { ConfirmAge } from './ConfirmAge';

interface AccountGateProps {
  children: ReactNode;
  /** Pre-select a role on the register wizard (e.g. 'companion'). */
  as?: 'member' | 'companion';
  /** Short reason shown on the register screen explaining why an account is needed. */
  gate?: string;
}

function Spinner({ label }: { label: string }) {
  return (
    <main
      className="min-h-[70vh] flex items-center justify-center"
      style={{ background: 'var(--grad-hero-bg)' }}
    >
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--color-azure)', borderTopColor: 'transparent' }}
        role="status"
        aria-label={label}
      />
    </main>
  );
}

/**
 * Wraps a commitment step (booking, companion application) and requires:
 *   1. an account, and
 *   2. a confirmed date of birth showing the user is 18+.
 *
 * Browsing and the quiz stay frictionless — this only guards the "money /
 * documents / meeting a stranger" points of the funnel.
 *
 * (2) exists because Google OAuth supplies no date of birth, while
 * `POST /api/bookings` and `POST /api/application` refuse without one. Without
 * the ConfirmAge step in between, an OAuth user hits a 403 they cannot resolve.
 *
 * SSR-safe: `useData` returns the fallback until mounted, so the server and the
 * client's first render agree and we show a calm spinner rather than flashing
 * content at someone who is about to be redirected.
 */
export function AccountGate({ children, as, gate }: AccountGateProps) {
  const router = useRouter();

  // Don't ask the server who you are when the session already says "nobody".
  // The gate used to fetch /api/user unconditionally, so a signed-out visitor
  // fired a request that could only ever come back 401 — a wasted round-trip
  // before a redirect that the session had already decided. `enabled` on useData
  // exists for exactly this.
  const signedIn = useViewerReady();
  const sessionKnown = useViewerResolved();

  const { data: user, loading, refresh } = useData(
    'user',
    () => dataClient.getUser(),
    null,
    signedIn,
  );

  /**
   * "Still deciding" is not "signed out", and `loading` alone cannot express that.
   *
   * `loading` is read during render, and for exactly one render after the session
   * flips to authenticated it is still `false` — left over from the disabled read
   * — while `user` is still null. The redirect effect fires in that window and
   * bounces a signed-in member to /register. (Watched it happen: valid session,
   * /api/user returning 200, and the gate redirecting anyway.)
   *
   * So in http mode the SESSION decides, not the slice: authenticated means an
   * account exists — lib/auth.ts only issues a session for a row that is really
   * there — so if the user is not here yet, the answer is "wait", never "sign up".
   * Local demo mode has no session and falls back to the slice.
   */
  const undecided = viewerNeedsSession()
    ? !sessionKnown || (signedIn && !user)
    : loading;

  useEffect(() => {
    if (undecided || user) return;
    const next = window.location.pathname + window.location.search;
    const params = new URLSearchParams({ next });
    if (as) params.set('as', as);
    if (gate) params.set('gate', gate);
    router.replace(`/register?${params.toString()}`);
  }, [undecided, user, router, as, gate]);

  if (undecided) return <Spinner label="Checking your account" />;
  if (!user) return <Spinner label="Redirecting to sign up" />;

  // An absent date of birth is not an adult date of birth. Ask, don't assume.
  const dob = user.dateOfBirth ? parseDateOfBirth(user.dateOfBirth) : null;
  if (!isAdult(dob)) {
    return <ConfirmAge firstName={user.firstName} onConfirmed={refresh} />;
  }

  return <>{children}</>;
}

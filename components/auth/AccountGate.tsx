'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { dataClient } from '@/lib/dataClient';
import { useData } from '@/lib/useData';
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
  const { data: user, loading, refresh } = useData('user', () => dataClient.getUser(), null);

  useEffect(() => {
    if (loading || user) return;
    const next = window.location.pathname + window.location.search;
    const params = new URLSearchParams({ next });
    if (as) params.set('as', as);
    if (gate) params.set('gate', gate);
    router.replace(`/register?${params.toString()}`);
  }, [loading, user, router, as, gate]);

  if (loading) return <Spinner label="Checking your account" />;
  if (!user) return <Spinner label="Redirecting to sign up" />;

  // An absent date of birth is not an adult date of birth. Ask, don't assume.
  const dob = user.dateOfBirth ? parseDateOfBirth(user.dateOfBirth) : null;
  if (!isAdult(dob)) {
    return <ConfirmAge firstName={user.firstName} onConfirmed={refresh} />;
  }

  return <>{children}</>;
}

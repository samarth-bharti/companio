'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/journeyState';

interface AccountGateProps {
  children: ReactNode;
  /** Pre-select a role on the register wizard (e.g. 'companion'). */
  as?: 'member' | 'companion';
  /** Short reason shown on the register screen explaining why an account is needed. */
  gate?: string;
}

/**
 * Wraps a commitment step (booking, companion application) and requires a
 * demo account first. Browsing and the quiz stay frictionless — this only
 * guards the "money / documents" points of the funnel.
 *
 * SSR-safe: getUser() reads localStorage, so the check runs after mount.
 * While checking (or redirecting) it shows a calm spinner — no content flash.
 */
export function AccountGate({ children, as, gate }: AccountGateProps) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (getUser()) {
      setOk(true);
      return;
    }
    const next = window.location.pathname + window.location.search;
    const params = new URLSearchParams({ next });
    if (as) params.set('as', as);
    if (gate) params.set('gate', gate);
    router.replace(`/register?${params.toString()}`);
  }, [router, as, gate]);

  if (!ok) {
    return (
      <main
        className="min-h-[70vh] flex items-center justify-center"
        style={{ background: 'var(--grad-hero-bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-azure)', borderTopColor: 'transparent' }}
          role="status"
          aria-label="Checking your account"
        />
      </main>
    );
  }

  return <>{children}</>;
}

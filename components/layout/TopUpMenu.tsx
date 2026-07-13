'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Wallet } from 'lucide-react';
import { dataClient } from '@/lib/dataClient';
import { useData } from '@/lib/useData';

const PANEL_STYLE: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid rgba(46,107,255,0.14)',
  boxShadow: 'var(--shadow-lift)',
};

/**
 * TopUpMenu — wallet popover in the nav.
 *
 * v1 is unlock-only: the ₹199 unlock includes two meetings and there is nothing
 * further to buy, so this is a read-only balance view. The credit-pack purchase
 * flow was removed rather than left as a dead affordance; it returns with
 * Razorpay Route (see app/pricing/page.tsx for why).
 */
export function TopUpMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Spending a credit anywhere in the app re-reads this chip. It used to be a
  // one-shot mount read, so booking a meetup left the nav showing the old count
  // until a hard reload.
  const { data: wallet, loading } = useData('wallet', () => dataClient.getWallet(), {
    credits: 0,
    used: 0,
  });
  const credits = loading ? null : wallet.credits;

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [close]);

  const hasCredits = (credits ?? 0) > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Wallet"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill font-sans font-semibold text-sm transition-colors hover:bg-azure-tint focus-visible:outline-azure"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        <Wallet size={17} aria-hidden="true" />
        <span style={{ color: 'var(--color-ink)' }}>{credits ?? 0}</span>
      </button>

      {open && (
        <div role="region" aria-label="Your wallet" className="absolute right-0 top-12 w-72 rounded-2xl p-2 z-50" style={PANEL_STYLE}>
          <div className="px-3 pt-2 pb-1.5">
            <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>Your wallet</p>
            <p className="font-display font-bold text-lg" style={{ color: 'var(--color-ink)' }}>
              {credits ?? 0} meeting{credits === 1 ? '' : 's'} ready
            </p>
            <p className="font-sans text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
              {hasCredits
                ? 'Included with your unlock. Yours anytime, no expiry.'
                : "You've used both included meetings. More meetups are coming soon."}
            </p>
          </div>
          <Link
            href="/pricing"
            onClick={close}
            className="block px-3 py-2.5 mt-1 rounded-xl text-center font-sans text-sm font-semibold hover:bg-black/[.03] focus-visible:outline-azure"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            What&apos;s included &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { getWallet } from '@/lib/journeyState';
import { addCredits, addNotification } from '@/lib/appState';
import { CheckoutSheet, type CheckoutItem } from '@/components/pricing/CheckoutSheet';
import { type RazorpayIntent } from '@/lib/razorpayClient';

const PACKS = [
  { id: 'single', name: 'Single meetup', price: 499, credits: 1, detail: null },
  { id: 'five', name: '5-pack', price: 1999, credits: 5, detail: '₹400 / meetup · popular' },
  { id: 'ten', name: '10-pack', price: 2999, credits: 10, detail: 'Best value · ₹300 / meetup' },
] as const;

// Display id -> server CREDIT_PACKS key (for live Razorpay create-order).
const PACK_ID_MAP: Record<string, string> = { single: 'pack1', five: 'pack5', ten: 'pack10' };

const PANEL_STYLE: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid rgba(46,107,255,0.14)',
  boxShadow: 'var(--shadow-lift)',
};

/**
 * TopUpMenu — quick wallet + top-up popover in the nav (no separate page needed).
 * Shows the credit balance; opens a popover of packs; buying runs the shared
 * CheckoutSheet inline and adds credits. Full plans still live at /pricing.
 */
export function TopUpMenu() {
  const [credits, setCredits] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [order, setOrder] = useState<RazorpayIntent | undefined>(undefined);
  const pending = useRef<(typeof PACKS)[number] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setCredits(getWallet().credits), []);

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

  function buy(pack: (typeof PACKS)[number]) {
    pending.current = pack;
    setOrder({ kind: 'credits', packId: PACK_ID_MAP[pack.id] });
    setItem({
      label: pack.name,
      priceDisplay: `₹${pack.price.toLocaleString('en-IN')}`,
      detail: pack.detail ?? undefined,
    });
    setOpen(false);
  }

  function onPaid() {
    const pack = pending.current;
    if (!pack) return;
    addCredits(pack.credits);
    addNotification({
      title: 'Credits added',
      body: `${pack.credits} meetup credit${pack.credits > 1 ? 's' : ''} added to your wallet.`,
    });
    setCredits((c) => (c ?? 0) + pack.credits);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Wallet and top-up"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-pill font-sans font-semibold text-sm transition-colors hover:bg-azure-tint focus-visible:outline-azure"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        <Wallet size={17} aria-hidden="true" />
        <span style={{ color: 'var(--color-ink)' }}>{credits ?? 0}</span>
      </button>

      {open && (
        <div role="region" aria-label="Top up meetups" className="absolute right-0 top-12 w-72 rounded-2xl p-2 z-50" style={PANEL_STYLE}>
          <div className="px-3 pt-2 pb-1.5">
            <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>Your wallet</p>
            <p className="font-display font-bold text-lg" style={{ color: 'var(--color-ink)' }}>
              {credits ?? 0} meeting{credits === 1 ? '' : 's'} ready
            </p>
          </div>
          <ul>
            {PACKS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => buy(p)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-black/[.03] focus-visible:outline-azure text-left"
                >
                  <span>
                    <span className="block font-sans text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{p.name}</span>
                    {p.detail && <span className="block font-sans text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>{p.detail}</span>}
                  </span>
                  <span className="inline-flex items-center gap-1 font-sans text-sm font-bold shrink-0" style={{ color: 'var(--color-azure)' }}>
                    <Plus size={13} aria-hidden="true" />₹{p.price.toLocaleString('en-IN')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/pricing"
            onClick={close}
            className="block px-3 py-2.5 mt-1 rounded-xl text-center font-sans text-sm font-semibold hover:bg-black/[.03] focus-visible:outline-azure"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            View all plans &amp; Companio Plus →
          </Link>
        </div>
      )}

      <CheckoutSheet
        open={item !== null}
        item={item ?? { label: '', priceDisplay: '' }}
        order={order}
        onClose={() => setItem(null)}
        onPaid={onPaid}
      />
    </div>
  );
}

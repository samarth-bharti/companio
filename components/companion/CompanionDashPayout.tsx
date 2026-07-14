'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCompanionDashboard } from '@/lib/useCompanionDashboard';

/**
 * Where a companion gets paid.
 *
 * The old version showed a bank account ending 4521 that belonged to nobody, an
 * "Update" link that did nothing, a promise of "payouts every Monday" that no
 * code anywhere keeps, and a Save button that discarded the UPI id on unmount.
 *
 * What is true: an admin marks each CompanionPayout paid by hand, after the
 * meetup completes. So we ask for one UPI id, we store it, and we describe the
 * process as it actually works.
 */

/** Mirrors the server regex in app/api/companion/profile/route.ts. */
const UPI_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

export function CompanionDashPayout() {
  const state = useCompanionDashboard();
  const [upi, setUpi] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  const live = state.status === 'live' ? state.data : null;

  // Seed from the server value once it arrives, without clobbering typing.
  useEffect(() => {
    if (live?.profile.payoutUpi) setUpi(live.profile.payoutUpi);
  }, [live?.profile.payoutUpi]);

  const readOnly = state.status !== 'live';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = upi.trim();
    if (trimmed && !UPI_RE.test(trimmed)) {
      setError('That does not look like a UPI id. It should look like yourname@bank.');
      return;
    }

    setStatus('saving');
    try {
      const res = await fetch('/api/companion/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payoutUpi: trimmed }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('saved');
      state.refresh();
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('idle');
      setError('We could not save that. Please try again.');
    }
  }

  return (
    <section
      aria-labelledby="payout-heading"
      className="rounded-2xl p-5"
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid rgba(46,107,255,0.1)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      <h2 id="payout-heading" className="font-sans font-bold text-base mb-5" style={{ color: 'var(--color-ink)' }}>
        Payout settings
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="upi-id" className="font-sans text-sm font-semibold block mb-2" style={{ color: 'var(--color-ink)' }}>
            UPI ID
          </label>
          <input
            id="upi-id"
            type="text"
            inputMode="email"
            autoComplete="off"
            placeholder="yourname@upi"
            value={upi}
            disabled={readOnly || status === 'saving'}
            onChange={(e) => { setUpi(e.target.value); if (error) setError(null); }}
            className="w-full h-11 px-4 font-sans text-sm disabled:opacity-60"
            style={{
              border: `1.5px solid ${error ? '#C0392B' : 'rgba(46,107,255,0.2)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-ink)',
              background: 'var(--color-surface)',
              outline: 'none',
            }}
            aria-describedby={error ? 'upi-err' : 'upi-help'}
          />
          {error ? (
            <p id="upi-err" role="alert" className="mt-1.5 font-sans text-xs" style={{ color: '#C0392B' }}>
              {error}
            </p>
          ) : (
            <p id="upi-help" className="mt-1.5 font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              This is the only place we send your earnings. Leave it blank to remove it.
            </p>
          )}
        </div>

        <div
          className="flex items-start gap-2 mb-5 p-3 rounded-xl"
          style={{ background: 'rgba(46,107,255,0.05)', border: '1px solid rgba(46,107,255,0.14)' }}
        >
          <Info size={15} style={{ color: 'var(--color-azure-deep)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
            {/* Was: "After each completed meetup, your earnings appear under Owed to
                you." Not yet, they do not. Paid bookings are still closed
                (MARKETPLACE_PAYMENTS_ENABLED), and the only meetups that can happen
                today are the two included in a member's unlock — which create no
                payout row at all. A companion following this sentence would have
                completed a meetup, looked at "Owed to you", found ₹0, and concluded
                they had been cheated. The notification promised at the end of it is
                now actually sent (see markPayoutPaid in app/admin/actions.ts). */}
            Paid bookings are not open yet, so the meetups happening today are the two included
            in a member&rsquo;s unlock, and they do not earn you anything. Once paid bookings
            open, each completed meetup will show under <strong>Owed to you</strong>; we transfer
            it to this UPI id, the amount moves to <strong>Paid out</strong>, and we tell you when
            it goes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="cta" size="sm" disabled={readOnly || status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save payout details'}
          </Button>
          {status === 'saved' && (
            <span role="status" className="font-sans text-xs font-semibold" style={{ color: '#157A4A' }}>
              Saved.
            </span>
          )}
          {readOnly && state.status === 'preview' && (
            <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              Sign in as a companion to edit.
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

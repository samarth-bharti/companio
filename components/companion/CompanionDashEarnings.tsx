'use client';

import { CountUp } from '@/components/motion/CountUp';
import { calm } from '@/lib/motion';
import { useCompanionDashboard } from '@/lib/useCompanionDashboard';

// There used to be a PREVIEW array here — ₹1,996 owed, ₹7,485 paid out, ₹9,481
// lifetime — shown to any signed-out visitor. Money figures are not decoration.
// A companion who signed in on a second device and hit a 403 for a moment saw
// earnings they had not made. Every state but `live` now shows a dash.

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--color-surface)', border: '1.5px solid rgba(46,107,255,0.1)', boxShadow: 'var(--shadow-1)' }}
    >
      <p className="font-sans text-xs font-medium mb-2" style={{ color: 'var(--color-ink-muted)' }}>
        {label}
      </p>
      <p
        className="font-display font-bold leading-none"
        style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', color: 'var(--color-ink)' }}
      >
        {children}
      </p>
    </div>
  );
}

export function CompanionDashEarnings() {
  const state = useCompanionDashboard();

  if (state.status === 'error') {
    return (
      <section aria-labelledby="earnings-heading">
        <h2 id="earnings-heading" className="font-sans font-bold text-base mb-4" style={{ color: 'var(--color-ink)' }}>
          Earnings
        </h2>
        <p
          role="alert"
          className="rounded-2xl p-5 font-sans text-sm"
          style={{ background: 'rgba(192,57,43,0.06)', border: '1.5px solid rgba(192,57,43,0.2)', color: '#C0392B' }}
        >
          {state.message}
        </p>
      </section>
    );
  }

  // Never render a number we do not have. A skeleton is honest; a zero is not.
  const cards =
    state.status === 'live'
      ? [
          { label: 'Owed to you', value: Math.round(state.data.earnings.pendingPaise / 100) },
          { label: 'Paid out', value: Math.round(state.data.earnings.paidPaise / 100) },
          { label: 'Lifetime', value: Math.round(state.data.earnings.totalPaise / 100) },
        ]
      : null;

  return (
    <section aria-labelledby="earnings-heading">
      <h2 id="earnings-heading" className="font-sans font-bold text-base mb-4" style={{ color: 'var(--color-ink)' }}>
        Earnings
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {cards === null
          ? ['Owed to you', 'Paid out', 'Lifetime'].map((label) => (
              <Card key={label} label={label}>
                <span aria-hidden="true" style={{ opacity: 0.25 }}>₹—</span>
                <span className="sr-only">Loading</span>
              </Card>
            ))
          : cards.map((c) => (
              <Card key={c.label} label={c.label}>
                ₹
                <CountUp value={c.value} duration={calm.slow.duration as number} className="tabular-nums" />
              </Card>
            ))}
      </div>
      {state.status === 'live' && state.data.earnings.pendingPaise > 0 && !state.data.profile.payoutUpi && (
        <p className="mt-3 font-sans text-xs" style={{ color: '#B5791F' }}>
          You have earnings owed but no payout method. Add a UPI id below so we can pay you.
        </p>
      )}
    </section>
  );
}

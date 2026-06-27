'use client';

import { useEffect, useState } from 'react';
import { CountUp } from '@/components/motion/CountUp';
import { calm } from '@/lib/motion';

// Demo figures shown on the public preview (signed out / not a companion).
const DEMO = [
  { label: 'Today', value: 0 },
  { label: 'This week', value: 1996 },
  { label: 'This month', value: 7485 },
] as const;

interface RealEarnings {
  pendingPaise: number;
  paidPaise: number;
  totalPaise: number;
}

export function CompanionDashEarnings() {
  // null = still loading or no real data (fall back to demo); object = real.
  const [real, setReal] = useState<RealEarnings | null>(null);

  useEffect(() => {
    fetch('/api/companion/earnings')
      .then(async (r) => {
        if (!r.ok) return; // 401 signed out / 403 not a companion → keep demo
        const d = await r.json();
        setReal({ pendingPaise: d.pendingPaise, paidPaise: d.paidPaise, totalPaise: d.totalPaise });
      })
      .catch(() => {});
  }, []);

  const cards = real
    ? [
        { label: 'Owed to you', value: Math.round(real.pendingPaise / 100) },
        { label: 'Paid out', value: Math.round(real.paidPaise / 100) },
        { label: 'Lifetime', value: Math.round(real.totalPaise / 100) },
      ]
    : DEMO.map((c) => ({ label: c.label, value: c.value }));

  return (
    <section aria-labelledby="earnings-heading">
      <h2 id="earnings-heading" className="font-sans font-bold text-base mb-4" style={{ color: 'var(--color-ink)' }}>
        Earnings
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-5"
            style={{ background: 'var(--color-surface)', border: '1.5px solid rgba(46,107,255,0.1)', boxShadow: 'var(--shadow-1)' }}
          >
            <p className="font-sans text-xs font-medium mb-2" style={{ color: 'var(--color-ink-muted)' }}>
              {c.label}
            </p>
            <p className="font-display font-bold leading-none" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', color: 'var(--color-ink)' }}>
              ₹
              <CountUp value={c.value} duration={calm.slow.duration as number} className="tabular-nums" />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

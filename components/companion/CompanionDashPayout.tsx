'use client';

import { useState } from 'react';
import { Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CompanionDashPayout() {
  const [upi, setUpi] = useState('');

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
      <h2
        id="payout-heading"
        className="font-sans font-bold text-base mb-5"
        style={{ color: 'var(--color-ink)' }}
      >
        Payout settings
      </h2>

      {/* Bank account */}
      <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
        style={{ background: 'rgba(46,107,255,0.04)', border: '1px solid rgba(46,107,255,0.1)' }}>
        <Building2 size={18} style={{ color: 'var(--color-azure)', flexShrink: 0 }} aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-sans text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Bank account</p>
          <p className="font-sans text-sm tabular-nums" style={{ color: 'var(--color-ink-muted)' }}>
            ****&nbsp;****&nbsp;****&nbsp;4521
          </p>
        </div>
        <button
          type="button"
          className="ml-auto font-sans text-xs underline underline-offset-4 shrink-0"
          style={{ color: 'var(--color-azure-deep)' }}
        >
          Update
        </button>
      </div>

      {/* UPI */}
      <div className="mb-4">
        <label htmlFor="upi-id" className="font-sans text-sm font-semibold block mb-2"
          style={{ color: 'var(--color-ink)' }}>
          UPI ID (optional)
        </label>
        <input
          id="upi-id"
          type="text"
          placeholder="yourname@upi"
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
          className="w-full h-11 px-4 font-sans text-sm"
          style={{
            border: '1.5px solid rgba(46,107,255,0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-ink)',
            background: 'var(--color-surface)',
            outline: 'none',
          }}
        />
      </div>

      {/* Schedule */}
      <div className="flex items-center gap-2 mb-5 p-3 rounded-xl"
        style={{ background: 'rgba(31,174,107,0.06)', border: '1px solid rgba(31,174,107,0.15)' }}>
        <Calendar size={15} style={{ color: '#157A4A', flexShrink: 0 }} aria-hidden="true" />
        <p className="font-sans text-xs" style={{ color: '#157A4A' }}>
          Payouts every Monday, direct to your bank after each completed meetup.
        </p>
      </div>

      <Button variant="cta" size="sm">Save payout details</Button>
    </section>
  );
}

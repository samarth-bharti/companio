'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Report a companion. Posts to /api/reports; degrades gracefully when signed out
// (the API returns 401 and we nudge the user to sign in).

const REASONS = [
  'Inappropriate or non-platonic behaviour',
  'Did not show up',
  'Safety concern',
  'Fake or misleading profile',
  'Other',
];

export function ReportButton({ companionId, companionName }: { companionId: string; companionName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'signedout'>('idle');

  async function submit() {
    setState('sending');
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'companion', companionId, reason, detail }),
      });
      if (res.status === 401) return setState('signedout');
      if (!res.ok) return setState('idle');
      setState('done');
    } catch {
      setState('idle');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus-visible:outline-2"
      >
        <Flag size={13} aria-hidden="true" /> Report {companionName}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-labelledby="report-title"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              className="relative w-full sm:max-w-md bg-[var(--color-bg)] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              {state === 'done' ? (
                <div className="text-center py-4">
                  <p className="font-display font-black text-[var(--color-ink)] mb-2" style={{ fontSize: 'var(--text-h3)' }}>
                    Report received
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)] mb-5">
                    Our trust team reviews every report within 24 hours. Thank you for keeping Companio safe.
                  </p>
                  <Button variant="cta" size="lg" onClick={() => setOpen(false)} className="w-full">Done</Button>
                </div>
              ) : state === 'signedout' ? (
                <div className="text-center py-4">
                  <p className="text-sm text-[var(--color-ink-muted)] mb-5">Please sign in to file a report.</p>
                  <Button variant="cta" size="lg" onClick={() => (window.location.href = '/login')} className="w-full">Sign in</Button>
                </div>
              ) : (
                <>
                  <h2 id="report-title" className="font-display font-black text-[var(--color-ink)] mb-4" style={{ fontSize: 'var(--text-h3)' }}>
                    Report {companionName}
                  </h2>
                  <label className="block text-xs font-semibold text-[var(--color-ink-muted)] mb-1.5">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full mb-4 rounded-xl border border-[var(--color-ink)]/15 bg-white px-3 h-11 text-sm text-[var(--color-ink)]"
                  >
                    {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <label className="block text-xs font-semibold text-[var(--color-ink-muted)] mb-1.5">Details (optional)</label>
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="w-full mb-5 rounded-xl border border-[var(--color-ink)]/15 bg-white px-3 py-2 text-sm text-[var(--color-ink)] resize-none"
                    placeholder="What happened?"
                  />
                  <div className="flex gap-3">
                    <Button variant="ghost" size="lg" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                    <Button variant="cta" size="lg" disabled={state === 'sending'} onClick={submit} className="flex-[2]">
                      {state === 'sending' ? 'Sending…' : 'Submit report'}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

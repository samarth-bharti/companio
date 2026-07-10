'use client';

import Link from 'next/link';
import { useCompanionDashboard } from '@/lib/useCompanionDashboard';

/**
 * The dashboard's greeting and its honesty banner.
 *
 * The page used to greet every visitor as "Priya S." — a name in a template
 * literal — above a banner that read "Demo preview… no real data is stored."
 * Both were unconditional, so a real, signed-in companion looking at their real
 * earnings was told they were looking at a demo, and called Priya.
 *
 * Now the banner appears only in the preview state, and the name is the
 * companion's own.
 */
export function CompanionDashHeader() {
  const state = useCompanionDashboard();
  const live = state.status === 'live' ? state.data : null;

  return (
    <>
      {state.status === 'preview' && (
        <div
          className="w-full py-2.5 px-6 text-center font-sans text-sm font-medium"
          style={{
            background: 'rgba(46,107,255,0.08)',
            color: 'var(--color-azure-deep)',
            borderBottom: '1px solid rgba(46,107,255,0.1)',
          }}
          role="note"
        >
          Preview, this is what companions see. The figures below are illustrative.{' '}
          <Link href="/become-a-companion" className="underline underline-offset-2 font-semibold">
            Apply to become one →
          </Link>
        </div>
      )}

      {live?.profile.suspended && (
        <div
          className="w-full py-2.5 px-6 text-center font-sans text-sm font-semibold"
          style={{ background: 'rgba(192,57,43,0.08)', color: '#C0392B', borderBottom: '1px solid rgba(192,57,43,0.2)' }}
          role="alert"
        >
          Your profile is currently suspended and hidden from members. Please contact support.
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 pt-10">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="label-eyebrow mb-1" style={{ color: 'var(--color-azure)' }}>
              Companion dashboard
            </p>
            <h1 className="font-display text-h2 leading-tight" style={{ color: 'var(--color-ink)' }}>
              {live ? `Welcome back, ${live.profile.firstName}` : 'Companion dashboard'}
            </h1>
          </div>
          {live && (
            <Link
              href={`/companion/${live.profile.id}`}
              className="font-sans text-sm font-medium underline underline-offset-4"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              View your public profile →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

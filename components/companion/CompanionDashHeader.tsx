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
          {/* Was: "The figures below are illustrative." They are not — the invented
              preview numbers (₹1,996 owed, ₹7,485 paid out, a 4.9 rating from 41
              reviews) were deleted in an earlier round precisely because money and
              ratings are not decoration. Every figure on this page is now a dash
              until it is real, so the banner was left describing numbers that no
              longer exist. */}
          Preview, this is the dashboard companions get. Your own figures appear here once
          you are approved.{' '}
          <Link href="/become-a-companion" className="underline underline-offset-2 font-semibold">
            Apply to become one →
          </Link>
        </div>
      )}

      {/* A newly approved companion is hidden because they have no photo yet, not
          because anyone moderated them. Telling them to "contact support" for
          something they can fix themselves — and that we caused — is the wrong
          message on the first screen they ever see. */}
      {live?.profile.suspended && !live.profile.photo && (
        <div
          className="w-full py-2.5 px-6 text-center font-sans text-sm font-semibold"
          style={{ background: 'rgba(255,178,62,0.14)', color: '#8A5A00', borderBottom: '1px solid rgba(255,178,62,0.35)' }}
          role="status"
        >
          You&apos;re approved. Your profile goes live as soon as we add your photo — we&apos;ll
          email you when it does.
        </div>
      )}

      {live?.profile.suspended && !!live.profile.photo && (
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

import Link from 'next/link';
import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CompanionDashEarnings } from '@/components/companion/CompanionDashEarnings';
import { CompanionDashBookings } from '@/components/companion/CompanionDashBookings';
import { CompanionDashAvailability } from '@/components/companion/CompanionDashAvailability';
import { CompanionDashProfile } from '@/components/companion/CompanionDashProfile';
import { CompanionDashPayout } from '@/components/companion/CompanionDashPayout';
import { CompanionDashStats } from '@/components/companion/CompanionDashStats';

export const metadata: Metadata = {
  title: 'Companion Dashboard, Companio',
  description: 'Manage your bookings, availability, and earnings as a Companio companion.',
};

export default function CompanionDashboardPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-10" style={{ background: 'var(--color-bg)' }}>
        {/* Demo banner */}
        <div
          className="w-full py-2.5 px-6 text-center font-sans text-sm font-medium"
          style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)', borderBottom: '1px solid rgba(46,107,255,0.1)' }}
          role="note"
          aria-label="Demo preview"
        >
          Demo preview, this is what companions see. No real data is stored.
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <p className="label-eyebrow mb-1" style={{ color: 'var(--color-azure)' }}>
                Companion dashboard
              </p>
              <h1 className="font-display text-h2 leading-tight" style={{ color: 'var(--color-ink)' }}>
                Welcome back, Priya S.
              </h1>
            </div>
            <Link
              href="/become-a-companion/apply"
              className="font-sans text-sm font-medium underline underline-offset-4"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              View your public profile →
            </Link>
          </div>

          {/* Stats row */}
          <div className="mb-7">
            <CompanionDashStats />
          </div>

          {/* Earnings */}
          <div className="mb-7">
            <CompanionDashEarnings />
          </div>

          {/* Bookings + Availability */}
          <div className="grid lg:grid-cols-2 gap-6 mb-7">
            <CompanionDashBookings />
            <CompanionDashAvailability />
          </div>

          {/* Profile editor + Payout */}
          <div className="grid lg:grid-cols-2 gap-6">
            <CompanionDashProfile />
            <CompanionDashPayout />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

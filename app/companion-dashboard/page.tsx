import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { CompanionDashHeader } from '@/components/companion/CompanionDashHeader';
import { CompanionDashEarnings } from '@/components/companion/CompanionDashEarnings';
import { CompanionDashBookings } from '@/components/companion/CompanionDashBookings';
import { CompanionDashAvailability } from '@/components/companion/CompanionDashAvailability';
import { CompanionDashProfile } from '@/components/companion/CompanionDashProfile';
import { CompanionDashPayout } from '@/components/companion/CompanionDashPayout';
import { CompanionDashStats } from '@/components/companion/CompanionDashStats';
import { CompanionDashMessages } from '@/components/companion/CompanionDashMessages';

export const metadata: Metadata = {
  title: 'Companion Dashboard, Companio',
  description: 'Manage your bookings, availability, and earnings as a Companio companion.',
};

/**
 * Every panel below reads /api/companion/dashboard through useCompanionDashboard(),
 * which distinguishes loading / preview / live / error. Signed-out visitors see a
 * clearly-labelled preview; a real companion sees their own numbers; a failed
 * request shows an error rather than falling back to invented earnings.
 */
export default function CompanionDashboardPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-10" style={{ background: 'var(--color-bg)' }}>
        <CompanionDashHeader />

        <div className="max-w-5xl mx-auto px-6 pb-10">
          <div className="mb-7">
            <CompanionDashStats />
          </div>

          <div className="mb-7">
            <CompanionDashEarnings />
          </div>

          {/* Messages sit directly under earnings, above availability: a member
              waiting on a reply is the most time-sensitive thing on this page,
              and until now there was no way to answer them at all. */}
          <div className="mb-7">
            <CompanionDashMessages />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-7">
            <CompanionDashBookings />
            <CompanionDashAvailability />
          </div>

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

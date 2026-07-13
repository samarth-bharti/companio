import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { ApplyWizard } from '@/components/companion/ApplyWizard';
import { AccountGate } from '@/components/auth/AccountGate';

export const metadata: Metadata = {
  title: 'Apply to become a companion, Companio',
  description:
    'Apply to join Companio as a ID-checked companion. Set your own schedule, choose your activities, and earn fairly.',
};

export default function ApplyPage() {
  return (
    <>
      <Nav />
      <main
        id="main-content"
        className="flex-1"
        style={{ background: 'var(--color-bg)', minHeight: '70vh' }}
      >
        <AccountGate as="companion" gate="apply">
          <ApplyWizard />
        </AccountGate>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { SpinWheel } from '@/components/spin/SpinWheel';

export const metadata: Metadata = {
  title: 'Weekly spin · Companio',
  description: 'Spin once a week for a chance to win a discount on your next meetup.',
};

export default function SpinPage() {
  return (
    <>
      <Nav />
      <BackBar fallbackHref="/dashboard" />
      <main className="min-h-[70vh] bg-[var(--color-bg)] px-4 pb-24">
        <div className="max-w-lg mx-auto pt-10 flex flex-col items-center gap-8 text-center">
          <div>
            <h1
              className="font-black text-[var(--color-ink)] leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
            >
              Your weekly spin
            </h1>
            <p className="text-[var(--color-ink-muted)]" style={{ fontSize: 'var(--text-lead)' }}>
              One spin a week. Most spins win nothing — but a lucky few get a real
              discount on the one-time ₹199 unlock. No purchase needed.
            </p>
          </div>

          <SpinWheel />

          <p className="text-xs text-[var(--color-ink-muted)] max-w-sm">
            Prizes are discounts on the ₹199 unlock only, and expire 7 days after you
            win them. A win applies automatically at checkout. See our{' '}
            <a href="/terms#spin" className="underline underline-offset-2">spin terms</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

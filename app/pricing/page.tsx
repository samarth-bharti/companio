'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Check } from 'lucide-react';
import { dataClient } from '@/lib/dataClient';
import { WhatsIncludedAccordion } from '@/components/pricing/WhatsIncludedAccordion';
import { Button } from '@/components/ui/Button';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { Reveal } from '@/components/motion/Reveal';
import { DigitRoll } from '@/components/journey/DigitRoll';

/**
 * Pricing — v1 is unlock-only.
 *
 * Companio charges exactly one price: ₹199, once. It unlocks every verified
 * profile in the member's city and includes their first two meetings. No credit
 * packs, no subscription, nothing to pay to meet.
 *
 * The meetup credit packs and the Plus membership are deliberately NOT sold
 * here: both imply paying a companion out of money we collected, which makes
 * Companio a payment aggregator under RBI rules. Their cards and checkout sheet
 * were deleted rather than left dormant — an unmounted component that offers to
 * charge ₹299 is one careless import away from doing so.
 */

const INCLUDED = [
  'Every verified profile in your city, unblurred',
  'Your first 2 meetings, included, no expiry',
  'Chat with any companion before you meet',
  'In-app SOS and live location sharing',
  'Full refund within 7 days',
] as const;

export default function PricingPage() {
  const router = useRouter();
  // Hydration-safe: never read localStorage during SSR.
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    dataClient.getWallet()
      .then((w) => { if (!cancelled) setCredits(w.credits); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Nav />
      <BackBar fallbackHref="/" />
      <main className="min-h-[70vh] bg-[var(--color-bg)] px-4 pb-24">
        <div className="max-w-lg mx-auto pt-10 flex flex-col gap-8">

          {/* Wallet strip — only after hydration, only when meetings remain */}
          {credits !== null && credits > 0 && (
            <Reveal delay={0}>
              <div
                className="flex items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-azure-tint)] border border-[var(--color-azure)]/20 px-4 py-3"
                role="status"
                aria-label={`You have ${credits} meeting${credits !== 1 ? 's' : ''} ready`}
              >
                <Wallet size={16} className="text-[var(--color-azure)] shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-[var(--color-azure-deep)]">
                  You have{' '}
                  <DigitRoll value={credits} aria-label={String(credits)} />{' '}
                  meeting{credits !== 1 ? 's' : ''} ready
                </p>
              </div>
            </Reveal>
          )}

          {/* Heading */}
          <Reveal delay={0.05}>
            <div>
              <h1
                className="font-black text-[var(--color-ink)] leading-tight mb-2"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
              >
                One price. That&apos;s it.
              </h1>
              <p className="text-[var(--color-ink-muted)]" style={{ fontSize: 'var(--text-lead)' }}>
                No subscription. No auto-debit. Nothing to pay to meet.
              </p>
            </div>
          </Reveal>

          {/* The single offer */}
          <Reveal delay={0.14}>
            <div
              className="relative rounded-[var(--radius-lg)] border-2 border-[var(--color-azure)] bg-[var(--color-surface)] p-6 overflow-hidden"
              style={{ boxShadow: 'var(--shadow-2)' }}
            >
              <p className="label-eyebrow mb-2" style={{ color: 'var(--color-azure)' }}>
                Unlock everything
              </p>

              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="font-black text-[var(--color-ink)] leading-none"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '3.25rem' }}
                >
                  ₹199
                </span>
                <span className="text-sm text-[var(--color-ink-muted)]">once</span>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] mb-5">
                Your first 2 meetings included, worth ₹998.
              </p>

              <ul className="flex flex-col gap-2.5 mb-6">
                {INCLUDED.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <Check
                      size={17}
                      strokeWidth={2.4}
                      className="shrink-0 mt-0.5 text-[var(--color-emerald)]"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-[var(--color-ink)]">{line}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="cta"
                size="xl"
                className="w-full"
                onClick={() => router.push('/explore')}
              >
                See who&apos;s near you
              </Button>
              <p className="text-xs text-center mt-3 text-[var(--color-ink-muted)]">
                You&apos;ll unlock from any profile. Browsing is always free.
              </p>
            </div>
          </Reveal>

          {/* What's included */}
          <Reveal delay={0.24}>
            <WhatsIncludedAccordion />
          </Reveal>

          {/* Honest forward-looking note — no fake scarcity, no countdown */}
          <Reveal delay={0.32}>
            <p className="text-sm text-center leading-relaxed text-[var(--color-ink-muted)]">
              After your two included meetings, additional meetups aren&apos;t available
              just yet. We&apos;ll show you the price before anything is ever charged.
            </p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}

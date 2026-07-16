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
import { PASS_TIERS, PASS_TIER_ORDER, perMonthPaise, formatPaise } from '@/lib/money';

/**
 * Pricing — the pass, at four durations.
 *
 * Companio sells one thing: access to companion profiles. The tiers differ only
 * in how long that access lasts. Every price on this page is read from
 * PASS_TIERS, never typed — the page used to print "₹199" as a literal while the
 * server charged whatever lib/money.ts said, which is exactly how a member once
 * got quoted ₹159 and charged ₹159.20.
 *
 * Meetup credit packs and the Plus membership are deliberately NOT sold here:
 * both imply paying a companion out of money we collected, which makes Companio
 * a payment aggregator under RBI rules. Their cards and checkout sheet were
 * deleted rather than left dormant — an unmounted component that offers to
 * charge ₹299 is one careless import away from doing so.
 *
 * There is no countdown, no "was ₹X", no "only N left". The lifetime tier is the
 * anchor and it earns that on real arithmetic: its per-month cost against the
 * monthly tier is computed below, not asserted.
 */

const INCLUDED = [
  'Every profile in your city, unblurred',
  'Your first meeting, included',
  'Chat with any companion before you meet',
  'In-app SOS and live location sharing',
  'Full refund within 7 days',
] as const;

/** Sub-label for a tier. Lifetime has no per-month figure, so it doesn't get one. */
function perMonthLine(tierId: (typeof PASS_TIER_ORDER)[number]): string {
  const tier = PASS_TIERS[tierId];
  const pm = perMonthPaise(tier);
  if (pm === null) return 'Pay once. Never again.';
  return `${formatPaise(pm)} a month`;
}

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
      <main id="main-content" className="min-h-[70vh] bg-[var(--color-bg)] px-4 pb-24">
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
                One pass. Your choice of length.
              </h1>
              <p className="text-[var(--color-ink-muted)]" style={{ fontSize: 'var(--text-lead)' }}>
                No auto-renewal. No auto-debit. Nothing to pay to meet.
              </p>
            </div>
          </Reveal>

          {/* The ladder */}
          <Reveal delay={0.14}>
            <ul className="flex flex-col gap-3" aria-label="Pass options">
              {PASS_TIER_ORDER.map((id) => {
                const tier = PASS_TIERS[id];
                const isAnchor = id === 'passlife';
                return (
                  <li key={id}>
                    <div
                      className="relative flex items-center justify-between gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5"
                      style={{
                        border: isAnchor
                          ? '2px solid var(--color-azure)'
                          : '1.5px solid var(--color-hairline)',
                        boxShadow: isAnchor ? 'var(--shadow-2)' : 'none',
                      }}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--color-ink)]">{tier.label}</p>
                        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                          {perMonthLine(id)}
                        </p>
                      </div>
                      <span
                        className="font-black text-[var(--color-ink)] leading-none shrink-0"
                        style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}
                      >
                        {formatPaise(tier.amount)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          {/* What every tier includes — identical across the ladder, so it is
              stated once rather than repeated on four cards. */}
          <Reveal delay={0.2}>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6">
              <p className="label-eyebrow mb-3" style={{ color: 'var(--color-azure)' }}>
                Every pass includes
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
                You&apos;ll pick a pass from any profile. Browsing is always free.
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
              A pass lets you see and message companions. Meetups themselves
              aren&apos;t charged for, and additional meetups aren&apos;t available just
              yet. We&apos;ll show you the price before anything is ever charged.
            </p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}

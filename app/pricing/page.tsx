'use client';

import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { getWallet } from '@/lib/journeyState';
import { addCredits, getPlan, setPlan, addNotification } from '@/lib/appState';
import { PackCard, type Pack } from '@/components/pricing/PackCard';
import { WhatsIncludedAccordion } from '@/components/pricing/WhatsIncludedAccordion';
import { PlusCard } from '@/components/pricing/PlusCard';
import { CheckoutSheet, type CheckoutItem } from '@/components/pricing/CheckoutSheet';
import { type RazorpayIntent } from '@/lib/razorpayClient';
import { Button } from '@/components/ui/Button';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { Reveal } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { DigitRoll } from '@/components/journey/DigitRoll';

const PACKS: Pack[] = [
  {
    id: 'single',
    tier: '01',
    name: 'Single meetup',
    price: 499,
    credits: 1,
    perMeetup: null,
    ribbon: null,
  },
  {
    id: 'five',
    tier: '02',
    name: '5-pack',
    price: 1999,
    credits: 5,
    perMeetup: '₹400 per meetup',
    ribbon: 'Most popular',
  },
  {
    id: 'ten',
    tier: '03',
    name: '10-pack',
    price: 2999,
    credits: 10,
    perMeetup: 'Best value · ₹300 per meetup',
    ribbon: null,
  },
];

type SheetMode = { type: 'pack'; packId: string } | { type: 'plus' };

export default function PricingPage() {
  const [selected, setSelected] = useState<string>('five'); // recommended default
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>({ type: 'pack', packId: 'five' });

  // Hydration-safe: never read localStorage during SSR.
  const [credits, setCredits] = useState<number | null>(null);
  const [isPlusAlready, setIsPlusAlready] = useState(false);

  useEffect(() => {
    setCredits(getWallet().credits);
    setIsPlusAlready(getPlan() === 'plus');
  }, []);

  function openPackCheckout() {
    setSheetMode({ type: 'pack', packId: selected });
    setSheetOpen(true);
  }

  function openPlusCheckout() {
    setSheetMode({ type: 'plus' });
    setSheetOpen(true);
  }

  function handlePaid() {
    if (sheetMode.type === 'pack') {
      const pack = PACKS.find((p) => p.id === (sheetMode as { type: 'pack'; packId: string }).packId)!;
      addCredits(pack.credits);
      addNotification({
        title: 'Credits added',
        body: `${pack.credits} meetup credit${pack.credits > 1 ? 's' : ''} added to your wallet.`,
      });
      setCredits((prev) => (prev ?? 0) + pack.credits);
    } else {
      setPlan('plus');
      addNotification({
        title: 'Companio Plus activated',
        body: "You're now a Plus member — it's yours for good, no recurring charge.",
      });
      setIsPlusAlready(true);
    }
  }

  const selectedPack = PACKS.find((p) => p.id === selected)!;

  function getSheetItem(): CheckoutItem {
    if (sheetMode.type === 'pack') {
      const pack = PACKS.find((p) => p.id === (sheetMode as { type: 'pack'; packId: string }).packId)!;
      return {
        label: pack.name,
        priceDisplay: `₹${pack.price.toLocaleString('en-IN')}`,
        detail: pack.perMeetup ?? undefined,
      };
    }
    return { label: 'Companio Plus', priceDisplay: '₹299', detail: 'One-time, no recurring charge' };
  }

  // Map the display pack id to the server's CREDIT_PACKS key for live Razorpay.
  function getOrderIntent(): RazorpayIntent {
    if (sheetMode.type === 'pack') {
      const map: Record<string, string> = { single: 'pack1', five: 'pack5', ten: 'pack10' };
      return { kind: 'credits', packId: map[(sheetMode as { type: 'pack'; packId: string }).packId] };
    }
    return { kind: 'plus' };
  }

  return (
    <>
    <Nav />
    <BackBar fallbackHref="/" />
    <main className="min-h-[70vh] bg-[var(--color-bg)] px-4 pb-24">
      <div className="max-w-lg mx-auto pt-10 flex flex-col gap-8">

        {/* Wallet endowment strip — shown only after hydration, only when credits > 0 */}
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

        {/* Page heading */}
        <Reveal delay={0.05}>
          <div>
            <h1
              className="font-black text-[var(--color-ink)] leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
            >
              Top up your meetings
            </h1>
            <p className="text-[var(--color-ink-muted)]" style={{ fontSize: 'var(--text-lead)' }}>
              No expiry. Use them whenever you&apos;re ready.
            </p>
          </div>
        </Reveal>

        {/* Pack radiogroup — each card in its own Reveal for staggered cascade.
            TiltCard adds CSS-3D hover depth on desktop (pointer:fine only). */}
        <div role="radiogroup" aria-label="Choose a meetup credit pack" className="flex flex-col gap-3">
          {PACKS.map((pack, i) => (
            <Reveal key={pack.id} delay={0.12 + i * 0.09}>
              <TiltCard maxDeg={4}>
                <PackCard
                  pack={pack}
                  selected={selected === pack.id}
                  onSelect={() => setSelected(pack.id)}
                  recommended={pack.id === 'five'}
                />
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* Primary buy CTA */}
        <Reveal delay={0.38}>
          <Button variant="cta" size="xl" className="w-full" onClick={openPackCheckout}>
            Buy {selectedPack.name}, ₹{selectedPack.price.toLocaleString('en-IN')}
          </Button>
        </Reveal>

        {/* What's included accordion */}
        <Reveal delay={0.46}>
          <WhatsIncludedAccordion />
        </Reveal>

        {/* Companio Plus — anchored after packs with comparison line */}
        <Reveal delay={0.54}>
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-sm text-center text-[var(--color-ink-muted)]">
              A one-time membership with lower fees on every meetup — no subscription.
            </p>
            <PlusCard isPlus={isPlusAlready} onUpgrade={openPlusCheckout} />
          </div>
        </Reveal>
      </div>

      {/* Checkout sheet — rendered once, shown/hidden via open prop */}
      <CheckoutSheet
        open={sheetOpen}
        item={getSheetItem()}
        order={getOrderIntent()}
        onClose={() => setSheetOpen(false)}
        onPaid={handlePaid}
      />
    </main>
    <Footer />
    </>
  );
}

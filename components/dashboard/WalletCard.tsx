'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { CountUp } from '@/components/motion/CountUp';
import { spring } from '@/lib/motion';
import type { Wallet } from '@/lib/journeyState';

interface WalletCardProps {
  wallet: Wallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const reduced = useEffectiveReducedMotion();
  const { credits } = wallet;
  const worth = credits * 499;
  const totalPips = Math.max(credits, 2);

  return (
    <div
      className="rounded-lg p-6 relative overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-2)',
        border: '1.5px solid rgba(46,107,255,0.1)',
      }}
    >
      {/* Ghost numeral */}
      <span
        aria-hidden="true"
        className="absolute right-5 top-3 font-display font-bold select-none pointer-events-none"
        style={{
          fontSize: 'clamp(3.5rem, 9vw, 6rem)',
          letterSpacing: '-0.04em',
          color: 'rgba(46,107,255,0.06)',
          lineHeight: 1,
        }}
      >
        {credits}
      </span>

      <p
        className="font-sans text-xs font-semibold tracking-widest uppercase mb-3"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        Your meetings
      </p>

      {/* Pips — aria-hidden, real text below for SR */}
      <div className="flex gap-2.5 mb-4" aria-hidden="true">
        {Array.from({ length: totalPips }).map((_, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, scale: 0.3, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={reduced ? { duration: 0 } : { ...spring.stamp, delay: i * 0.09 }}
            className="inline-block rounded-full"
            style={{
              width: 16,
              height: 16,
              background: i < credits ? 'var(--color-azure)' : 'rgba(46,107,255,0.15)',
              boxShadow: i < credits ? '0 2px 6px rgba(46,107,255,0.35)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display font-bold" style={{ fontSize: 'var(--text-h3)', color: 'var(--color-ink)' }}>
          <CountUp value={credits} suffix=" remaining" />
        </span>
      </div>

      <p className="font-sans text-sm mb-1" style={{ color: 'var(--color-ink-muted)' }}>
        worth{' '}
        <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
          <CountUp value={worth} prefix="₹" />
        </span>
      </p>

      <p className="font-sans text-xs mb-5" style={{ color: 'var(--color-ink-muted)' }}>
        Yours anytime, no expiry.
      </p>

      {/* v1 is unlock-only — there is nothing to top up, so this links to the
          explanation rather than dangling a purchase that does not exist. */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/pricing"
          className="font-sans text-sm font-medium underline underline-offset-2 min-h-[44px] inline-flex items-center"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          What&apos;s included →
        </a>
      </div>

      {/* Screen-reader text equivalent */}
      <span className="sr-only">
        {credits} meetings remaining, worth ₹{worth}. Yours anytime, no expiry.
      </span>
    </div>
  );
}

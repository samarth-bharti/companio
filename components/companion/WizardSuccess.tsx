'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { spring } from '@/lib/motion';
import { Seal } from '@/components/ui/Seal';
import { VerificationTimeline } from './VerificationTimeline';

interface Props {
  name: string;
}

export function WizardSuccess({ name }: Props) {
  const reduced = useReducedMotion();
  const first = name.trim().split(' ')[0];

  // Celebratory confetti on first mount — guarded by reduced-motion preference.
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    // Delay slightly so the Seal pop-in plays first.
    const t = setTimeout(() => {
      if (cancelled) return;
      import('canvas-confetti').then((mod) => {
        if (cancelled) return;
        mod.default({
          particleCount: 130,
          spread: 80,
          origin: { y: 0.3 },
          colors: ['#2E6BFF', '#1FAE6B', '#8B5CF6', '#FFB23E'],
        });
      });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <motion.div
        className="flex justify-center mb-6"
        initial={reduced ? false : { scale: 0.3, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={reduced ? { duration: 0 } : spring.stamp}
      >
        <Seal size={80} label="Application submitted" />
      </motion.div>

      <motion.h2
        className="font-display text-h2 mb-3"
        style={{ color: 'var(--color-ink)' }}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0.2 }}
      >
        {first ? `You're in, ${first}.` : 'Application submitted.'}
      </motion.h2>

      <motion.p
        className="font-sans text-base mb-10"
        style={{ color: 'var(--color-ink-muted)' }}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0.3 }}
      >
        Your application is with our team. We&apos;ll work through each step below and notify
        you as soon as it clears.
      </motion.p>

      <div className="text-left mb-10">
        <VerificationTimeline activeStep={0} />
      </div>

      <Link
        href="/explore"
        className="inline-flex items-center justify-center h-12 px-7 rounded-pill font-sans font-bold text-base text-white"
        style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
      >
        While you wait, see how members experience Companio →
      </Link>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import Image from 'next/image';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { AuroraWipe } from '@/components/motion/AuroraWipe';
import { Button } from '@/components/ui/Button';
import { COMPANIONS, TOP_MATCH_ID } from '@/lib/data/companions';
import { spring, stagger } from '@/lib/motion';

interface ResultRevealProps {
  name: string;
  /** Called after the AuroraWipe covers (push route there). */
  onNavigate: () => void;
}

const topMatch = COMPANIONS.find((c) => c.id === TOP_MATCH_ID)!;
const otherCompanions = COMPANIONS.filter((c) => c.id !== TOP_MATCH_ID).slice(0, 6);

/**
 * ResultReveal — dark→light result screen with MilestoneSeal, top-match card,
 * blurred mini-grid, and AuroraWipe CTA.
 */
export function ResultReveal({ name, onNavigate }: ResultRevealProps) {
  const reduced = useEffectiveReducedMotion();
  const [wipeActive, setWipeActive] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-16"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Seal + headline */}
      <div className="flex flex-col items-center gap-4 mb-10 text-center">
        <MilestoneSeal
          label={`We found 14 companions for you, ${name || 'there'}.`}
          sub="Here's who fits best."
          size={80}
          withConfetti
        />
      </div>

      {/* Top-match card */}
      <motion.div
        className="w-full max-w-sm mb-8"
        initial={reduced ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...spring.soft, delay: 0.2 }}
      >
        <div
          className="relative rounded-lg overflow-hidden"
          style={{ boxShadow: 'var(--shadow-lift)' }}
        >
          {/* Gold "Top match" ribbon */}
          <div
            className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-pill text-xs font-semibold"
            style={{
              background: 'var(--color-gold)',
              color: 'var(--color-ink)',
            }}
          >
            Top companion
          </div>

          <div className="relative h-56">
            <Image
              src={topMatch.photo}
              alt={`${topMatch.firstName}, companion in ${topMatch.area}`}
              fill
              sizes="(max-width: 480px) 100vw, 384px"
              className="object-cover"
            />
          </div>

          <div className="px-4 py-4" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                {topMatch.name}
              </span>
              <span className="text-xs font-medium" style={{ color: '#157A4A' }}>
                ★ {topMatch.rating} ({topMatch.reviews})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {topMatch.activities.map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded-pill text-xs"
                  style={{
                    background: 'var(--color-azure-tint)',
                    color: 'var(--color-azure-deep)',
                    border: '1px solid rgba(46,107,255,0.18)',
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
              {topMatch.bio.slice(0, 100)}…
            </p>
          </div>
        </div>
      </motion.div>

      {/* Blurred mini-grid — 13 more */}
      <div className="w-full max-w-sm mb-3">
        <p className="text-xs mb-2.5 font-medium" style={{ color: 'var(--color-ink-muted)' }}>
          + 13 companions matched to your activities
        </p>
        <motion.div
          className="grid grid-cols-4 gap-1.5"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...spring.soft, delay: 0.35 }}
        >
          {otherCompanions.map((c, i) => (
            <motion.div
              key={c.id}
              className="relative aspect-square rounded-md overflow-hidden"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...spring.soft, delay: 0.4 + i * stagger.tight }}
            >
              <Image
                src={c.photo}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                style={{ filter: 'blur(8px) saturate(1.1)', transform: 'scale(1.1)' }}
                aria-hidden="true"
              />
              {/* lock icon overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(20,26,46,0.35)' }}
                aria-hidden="true"
              >
                <span style={{ fontSize: '0.9rem' }}>🔒</span>
              </div>
            </motion.div>
          ))}
          {/* Filler slot "and more" */}
          <div
            className="relative aspect-square rounded-md flex items-center justify-center text-xs font-semibold"
            style={{
              background: 'var(--color-azure-tint)',
              color: 'var(--color-azure-deep)',
            }}
          >
            +7
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        className="mt-6"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.55 }}
      >
        <Button
          variant="aurora"
          size="xl"
          onClick={() => {
            if (reduced) { onNavigate(); return; }
            setWipeActive(true);
          }}
        >
          Meet your companions →
        </Button>
      </motion.div>

      {wipeActive && (
        <AuroraWipe
          onCovered={onNavigate}
          onDone={() => setWipeActive(false)}
        />
      )}
    </div>
  );
}

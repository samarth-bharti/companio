'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import Image from 'next/image';
import Link from 'next/link';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { AuroraWipe } from '@/components/motion/AuroraWipe';
import { Button } from '@/components/ui/Button';
import type { Companion } from '@/lib/data/companions';
import { spring, stagger } from '@/lib/motion';

interface ResultRevealProps {
  name: string;
  city: string;
  /** The real ranked matches for this member, in this city. May be empty. */
  matches: Companion[];
  /** Called after the AuroraWipe covers (push route there). */
  onNavigate: () => void;
}

/**
 * The result of the quiz — the actual result, for once.
 *
 * This screen used to be a fixed set of claims. It announced "We found 14
 * companions for you" whatever city you picked (Indore has 8; Jaipur has none),
 * revealed the same hardcoded Mumbai companion as everyone's top match whatever
 * they answered, offered "+13 companions matched to your activities" that were
 * matched to nothing, and printed "★ 0 (0)" because it rendered a rating field
 * that is zero for every unreviewed profile.
 *
 * Every number below is now counted, and the companion shown is the one who
 * actually ranked first. When the city has nobody, it says that.
 */
export function ResultReveal({ name, city, matches, onNavigate }: ResultRevealProps) {
  const reduced = useEffectiveReducedMotion();
  const [wipeActive, setWipeActive] = useState(false);

  const top = matches[0];
  const others = matches.slice(1);
  const preview = others.slice(0, 7);

  // No companions in the chosen city. There is nothing to reveal, and inventing
  // a match would be the whole problem this page had.
  if (!top) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-16 text-center" style={{ background: 'var(--color-bg)' }}>
        <MilestoneSeal
          label={`Thanks, ${name || 'there'}.`}
          sub={`We're not live in ${city} yet.`}
          size={80}
        />
        <p className="mt-6 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
          Nobody lists in {city} so far, so we have no one to introduce you to. We would
          rather tell you that than show you someone who isn&rsquo;t there.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="cta" size="xl" onClick={onNavigate}>
            Browse another city →
          </Button>
          <Link
            href="/become-a-companion"
            className="text-sm font-semibold underline underline-offset-2"
            style={{ color: 'var(--color-azure-deep)' }}
          >
            Or be the first companion in {city}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 py-16"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Seal + headline — the real count, in the real city. */}
      <div className="flex flex-col items-center gap-4 mb-10 text-center">
        <MilestoneSeal
          label={
            matches.length === 1
              ? `We found one companion for you, ${name || 'there'}.`
              : `We found ${matches.length} companions in ${city}, ${name || 'there'}.`
          }
          sub="Here's who fits best."
          size={80}
          withConfetti
        />
      </div>

      {/* Top-match card — whoever actually ranked first. */}
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
          <div
            className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-pill text-xs font-semibold"
            style={{ background: 'var(--color-gold)', color: 'var(--color-ink)' }}
          >
            Top match
          </div>

          <div className="relative h-56">
            <Image
              src={top.photo}
              alt={`${top.firstName}, companion in ${top.area}`}
              fill
              sizes="(max-width: 480px) 100vw, 384px"
              className="object-cover"
            />
          </div>

          <div className="px-4 py-4" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                {top.name}
              </span>
              {/* Never print stars for a profile nobody has reviewed. The old
                  card rendered "★ 0 (0)" on every single companion. */}
              {top.reviews > 0 ? (
                <span className="text-xs font-medium" style={{ color: '#157A4A' }}>
                  ★ {top.rating.toFixed(1)} ({top.reviews})
                </span>
              ) : (
                <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  New
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {top.activities.map((a) => (
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
              {top.bio.slice(0, 100)}…
            </p>
          </div>
        </div>
      </motion.div>

      {/* The rest — counted, not claimed. */}
      {others.length > 0 && (
        <div className="w-full max-w-sm mb-3">
          <p className="text-xs mb-2.5 font-medium" style={{ color: 'var(--color-ink-muted)' }}>
            + {others.length} more {others.length === 1 ? 'companion' : 'companions'} in {city}
          </p>
          <motion.div
            className="grid grid-cols-4 gap-1.5"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...spring.soft, delay: 0.35 }}
          >
            {preview.map((c, i) => (
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
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(20,26,46,0.35)' }}
                  aria-hidden="true"
                >
                  <span style={{ fontSize: '0.9rem' }}>🔒</span>
                </div>
              </motion.div>
            ))}
            {others.length > preview.length && (
              <div
                className="relative aspect-square rounded-md flex items-center justify-center text-xs font-semibold"
                style={{ background: 'var(--color-azure-tint)', color: 'var(--color-azure-deep)' }}
              >
                +{others.length - preview.length}
              </div>
            )}
          </motion.div>
        </div>
      )}

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
        <AuroraWipe onCovered={onNavigate} onDone={() => setWipeActive(false)} />
      )}
    </div>
  );
}

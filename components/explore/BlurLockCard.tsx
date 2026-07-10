'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Lock, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TiltCard } from '@/components/motion/TiltCard';
import { spring } from '@/lib/motion';
import type { Companion } from '@/lib/data/companions';

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium bg-white/85 text-ink"
      style={{ border: '1.5px solid rgba(46,107,255,0.2)' }}
    >
      {children}
    </span>
  );
}

export function BlurLockCard({
  companion,
  onUnlockClick,
}: {
  companion: Companion;
  onUnlockClick: (c: Companion) => void;
}) {
  const shouldReduce = useEffectiveReducedMotion();

  // Privacy: fetch a tiny, server-blurred version (Unsplash transform) so the
  // full-resolution photo never reaches the browser — a CSS-only blur of the
  // real image can be removed in DevTools. A light CSS blur just smooths it.
  const lockedSrc = `${companion.photo}${companion.photo.includes('?') ? '&' : '?'}w=64&blur=1000&q=30`;

  return (
    <TiltCard maxDeg={4}>
      <motion.button
        type="button"
        onClick={() => onUnlockClick(companion)}
        aria-label={`Unlock ${companion.maskedName}'s full profile`}
        className={cn(
          'relative w-full text-left rounded-[var(--radius-lg)] overflow-hidden bg-surface',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure',
        )}
        style={{ boxShadow: 'var(--shadow-1)' }}
        whileHover="hovered"
        variants={{ hovered: { scale: shouldReduce ? 1 : 1.01 } }}
        transition={spring.snappy}
      >
        {/* Portrait — blurred photo layer */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <Image
            src={lockedSrc}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, (max-width:1280px) 33vw, 25vw"
            className="object-cover"
            style={{ filter: 'blur(8px) saturate(1.05)', transform: 'scale(1.06)' }}
          />

          {/* 2.4s diagonal shimmer sweep — CSS animation instead of framer-motion
              repeat:Infinity; compositor handles all 13 locked cards at once with
              zero JS overhead. Disabled automatically by reduced-motion in globals.css. */}
          {!shouldReduce && (
            <div
              className="absolute top-0 bottom-0 w-1/4 pointer-events-none"
              style={{
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                transform: 'skewX(-15deg)',
                animation: 'companio-shimmer 2.8s cubic-bezier(0.16,1,0.3,1) infinite',
              }}
              aria-hidden="true"
            />
          )}

          {/* Frosted lock chip — scales 1.05 when card is hovered (variant propagation) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-sm font-medium bg-white/70 backdrop-blur-md text-ink"
              style={{ border: '1.5px solid rgba(46,107,255,0.3)' }}
              variants={{ hovered: { scale: shouldReduce ? 1 : 1.05 } }}
              transition={spring.snappy}
            >
              <Lock size={14} aria-hidden="true" />
              Tap to unlock
            </motion.div>
          </div>
        </div>

        {/* Crisp un-blurred info below photo */}
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="text-base font-semibold text-ink leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {companion.maskedName}
            </span>
            <BadgeCheck size={16} className="text-azure shrink-0" aria-hidden="true" />
            <span className="sr-only">Verified</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip>{companion.area} · {companion.city}</Chip>
            <Chip>★ {companion.rating} ({companion.reviews})</Chip>
            {companion.activities.slice(0, 1).map((act) => (
              <Chip key={act}>{act}</Chip>
            ))}
          </div>
        </div>
      </motion.button>
    </TiltCard>
  );
}

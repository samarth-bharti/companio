'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Companion } from '@/lib/data/companions';
import { spring } from '@/lib/motion';

interface MapViewProps {
  companions: Companion[];
  unlocked: boolean;
  onBook: (c: Companion) => void;
  onUnlockClick: (c: Companion) => void;
}

/**
 * Two independent djb2-variant hashes → deterministic (x%, y%) per area name.
 * Different seeds so x and y are uncorrelated even on short strings.
 */
function areaToPos(area: string): { x: number; y: number } {
  let hx = 5381, hy = 1103;
  for (let i = 0; i < area.length; i++) {
    const c = area.charCodeAt(i);
    hx = (((hx << 5) + hx) ^ c) | 0;
    hy = (((hy << 5) + hy) ^ (c * 37)) | 0;
  }
  // Keep 15–82% / 12–76% to stay away from edges
  return {
    x: 15 + (Math.abs(hx) % 67),
    y: 12 + (Math.abs(hy) % 64),
  };
}

/** Small per-id offset so companions in the same area scatter instead of stacking. */
function idScatter(id: string): { dx: number; dy: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x3ff;
  return { dx: (h % 9) - 4, dy: (Math.floor(h / 9) % 9) - 4 };
}

// ── Pin popover ───────────────────────────────────────────────────────────────

function PinPopover({
  companion, isLocked, reduced, onAction, onClose,
}: {
  companion: Companion;
  isLocked: boolean;
  reduced: boolean;
  onAction: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-64"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)',
        border: '1.5px solid rgba(46,107,255,0.14)',
        borderRadius: '14px',
        boxShadow: '0 8px 32px -8px rgba(20,26,46,0.18)',
        zIndex: 10,
      }}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
          <Image
            src={companion.photo}
            alt={isLocked ? '' : companion.firstName}
            fill
            className="object-cover"
            style={isLocked ? { filter: 'blur(8px)', transform: 'scale(1.1)' } : {}}
            sizes="56px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                {isLocked ? companion.maskedName : companion.firstName}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                {companion.area} · {companion.distanceKm} km
              </p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose}
              className="p-1 rounded-full hover:bg-black/5 transition-colors flex-shrink-0">
              <X size={13} style={{ color: 'var(--color-ink-muted)' }} />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {companion.availableNow && !isLocked ? (
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-emerald)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: 'var(--color-emerald)' }} />
                Free now
              </span>
            ) : !isLocked ? (
              <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>{companion.availability}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onAction}
            className="mt-2 w-full py-1.5 rounded-pill text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            style={{ background: 'var(--grad-cta)' }}
          >
            {isLocked ? 'Unlock profile' : 'Book a walk'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Map View ──────────────────────────────────────────────────────────────────

export function MapView({ companions, unlocked, onBook, onUnlockClick }: MapViewProps) {
  const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCompanion = companions.find((c) => c.id === activeId) ?? null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          height: 'clamp(400px, 58vh, 580px)',
          background: 'linear-gradient(135deg, #e8f0ff 0%, #f3eeff 45%, #e6f8f0 100%)',
          border: '1.5px solid rgba(46,107,255,0.10)',
          boxShadow: 'var(--shadow-1)',
        }}
        onClick={(e) => { if (e.currentTarget === e.target) setActiveId(null); }}
      >
        {/* Subtle grid lines — decorative city-map feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(46,107,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(46,107,255,0.08) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
          aria-hidden="true"
        />

        {/* City label */}
        <div
          className="absolute top-4 left-4 px-3 py-1.5 rounded-pill text-xs font-semibold"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(46,107,255,0.16)',
            color: 'var(--color-azure)',
          }}
        >
          {companions[0]?.city ?? 'Mumbai'}, {companions.length} companions shown
        </div>

        {/* Companion pins */}
        {companions.map((c) => {
          const base = areaToPos(c.area);
          const off = idScatter(c.id);
          const x = Math.min(Math.max(base.x + off.dx, 8), 88);
          const y = Math.min(Math.max(base.y + off.dy, 8), 83);
          const isLocked = !unlocked && !c.topMatch;
          const isActive = activeId === c.id;

          return (
            <motion.button
              key={c.id}
              type="button"
              aria-label={`${isLocked ? 'Locked companion' : c.firstName} in ${c.area}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(isActive ? null : c.id);
              }}
              className="absolute focus-visible:outline focus-visible:outline-2 focus-visible:outline-azure rounded-full"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              whileHover={reduced ? {} : { scale: 1.12 }}
              animate={{ scale: isActive ? 1.18 : 1 }}
              transition={spring.snappy}
            >
              <div
                className="relative w-10 h-10 rounded-full overflow-hidden"
                style={{
                  boxShadow: isActive
                    ? `0 0 0 2.5px var(--color-azure), 0 0 0 4px rgba(46,107,255,0.18), 0 4px 12px rgba(0,0,0,0.18)`
                    : `0 0 0 2px ${c.accent}, 0 2px 8px rgba(0,0,0,0.14)`,
                }}
              >
                <Image
                  src={c.photo}
                  alt=""
                  fill
                  className="object-cover"
                  style={isLocked ? { filter: 'blur(5px) saturate(0.5)', transform: 'scale(1.1)' } : {}}
                  sizes="40px"
                />
                {c.availableNow && !isLocked && (
                  <span
                    className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-white"
                    style={{ background: 'var(--color-emerald)' }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </motion.button>
          );
        })}

        {/* Pin popover */}
        <AnimatePresence>
          {activeCompanion && (
            <PinPopover
              key={activeCompanion.id}
              companion={activeCompanion}
              isLocked={!unlocked && !activeCompanion.topMatch}
              reduced={!!reduced}
              onAction={() => {
                setActiveId(null);
                if (!unlocked && !activeCompanion.topMatch) onUnlockClick(activeCompanion);
                else onBook(activeCompanion);
              }}
              onClose={() => setActiveId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

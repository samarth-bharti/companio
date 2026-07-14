'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { X, Columns2 } from 'lucide-react';
import type { Companion } from '@/lib/data/companions';
import { RatingBadge } from '@/components/companion/RatingBadge';
import { spring } from '@/lib/motion';

interface CompareTrayProps {
  compareIds: string[];
  companions: Companion[];
  quizDone: boolean;
  onToggle: (id: string) => void;
  onClear: () => void;
}

// ── Compare Modal ─────────────────────────────────────────────────────────────

function CompareModal({
  companions,
  quizDone,
  onClose,
}: {
  companions: Companion[];
  quizDone: boolean;
  onClose: () => void;
}) {
  const reduced = useEffectiveReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<Element | null>(null);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]),a,[tabindex]:not([tabindex="-1"])',
    ));
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [onClose]);

  useEffect(() => {
    prevFocusRef.current = document.activeElement;
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button')?.focus(), 60);
    return () => {
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
      (prevFocusRef.current as HTMLElement | null)?.focus();
    };
  }, [handleKey]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: 'rgba(20,26,46,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        transition={spring.snappy}
        style={{
          background: 'var(--color-bg)',
          boxShadow: '0 24px 64px -16px rgba(20,26,46,0.28)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{
            background: 'var(--color-bg)',
            borderColor: 'rgba(46,107,255,0.10)',
          }}
        >
          <p id="compare-title" className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
            Comparing {companions.length} companions
          </p>
          <button
            type="button"
            aria-label="Close comparison"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors focus-visible:outline focus-visible:outline-2"
            style={{ outlineColor: 'var(--color-azure)' }}
          >
            <X size={16} style={{ color: 'var(--color-ink-muted)' }} />
          </button>
        </div>

        {/* Columns */}
        <div className={`grid gap-4 p-6 ${companions.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {companions.map((c) => (
            <div key={c.id} className="flex flex-col gap-3">
              {/* Photo */}
              <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <Image
                  src={c.photo}
                  alt={c.firstName}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 50vw, 33vw"
                />
                {/* Availability dot */}
                {c.availableNow && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-pill"
                    style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(31,174,107,0.35)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-emerald)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-emerald)' }}>Free now</span>
                  </div>
                )}
              </div>
              {/* Name + badge */}
              <div>
                <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                  {c.firstName}
                </p>
                {/* "X km away" was an authored constant, not a distance from
                    anyone. We know the member's city, never their location. */}
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                  {c.area} · {c.city}
                </p>
              </div>
              {/* Stats */}
              <div className="flex flex-wrap gap-1.5">
                {/* This rendered "★ 0 (0)" for a companion nobody has reviewed yet
                    — in the one screen built for weighing companions against each
                    other, where "0 stars" reads as *rated badly*, not *new*. The
                    card behind this modal already got it right; this was the last
                    place still formatting a star row by hand. RatingBadge exists so
                    an unreviewed companion reads as "New", everywhere, at once. */}
                <span className="px-2 py-1 rounded-pill text-xs font-medium bg-white/60"
                  style={{ border: '1.5px solid rgba(46,107,255,0.2)', color: 'var(--color-ink-muted)' }}>
                  <RatingBadge rating={c.rating} reviews={c.reviews} />
                </span>
                {quizDone && (
                  <span className="px-2 py-1 rounded-pill text-xs font-semibold"
                    style={{ background: 'rgba(122,79,224,0.12)', border: '1.5px solid rgba(122,79,224,0.25)', color: 'var(--color-violet)' }}>
                    {c.matchScore}% match
                  </span>
                )}
              </div>
              {/* Availability */}
              <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                <span className="font-medium" style={{ color: 'var(--color-ink)' }}>Availability: </span>
                {c.availability}
              </p>
              {/* Top activities */}
              <div className="flex flex-wrap gap-1">
                {c.activities.map((a) => (
                  <span key={a} className="px-2 py-0.5 rounded-pill text-xs"
                    style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure)', border: '1px solid rgba(46,107,255,0.15)' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Compare Tray ──────────────────────────────────────────────────────────────

export function CompareTray({
  compareIds, companions, quizDone, onToggle, onClear,
}: CompareTrayProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const reduced = useEffectiveReducedMotion();

  const selected = compareIds
    .map((id) => companions.find((c) => c.id === id))
    .filter(Boolean) as Companion[];

  if (selected.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="compare-tray"
          className="fixed bottom-6 left-1/2 z-40"
          style={{ transform: 'translateX(-50%)' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={spring.snappy}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px -8px rgba(20,26,46,0.22)',
              border: '1.5px solid rgba(46,107,255,0.15)',
            }}
          >
            {/* Avatar chips */}
            <div className="flex items-center -space-x-2">
              {selected.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Remove ${c.firstName} from comparison`}
                  onClick={() => onToggle(c.id)}
                  className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white hover:ring-red-200 transition-all focus-visible:outline focus-visible:outline-2"
                  style={{ outlineColor: 'var(--color-azure)' }}
                >
                  <Image src={c.photo} alt={c.firstName} fill className="object-cover" sizes="36px" />
                </button>
              ))}
              {/* Empty slot indicators */}
              {Array.from({ length: Math.max(0, 3 - selected.length) }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center"
                  style={{ background: 'rgba(46,107,255,0.08)', border: '1.5px dashed rgba(46,107,255,0.25)' }}
                  aria-hidden="true"
                >
                  <span className="text-xs" style={{ color: 'rgba(46,107,255,0.4)' }}>+</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selected.length < 2}
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-semibold text-white transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
              >
                <Columns2 size={14} aria-hidden />
                Compare ({selected.length})
              </button>
              <button
                type="button"
                aria-label="Clear comparison"
                onClick={onClear}
                className="p-2 rounded-full hover:bg-black/5 transition-colors focus-visible:outline focus-visible:outline-2"
                style={{ outlineColor: 'var(--color-azure)' }}
              >
                <X size={14} style={{ color: 'var(--color-ink-muted)' }} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <CompareModal
            companions={selected}
            quizDone={quizDone}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

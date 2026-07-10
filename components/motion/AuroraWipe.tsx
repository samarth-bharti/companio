'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';

interface AuroraWipeProps {
  /** Fires mid-wipe (screen fully covered) — do the route push here. */
  onCovered: () => void;
  /** Fires when the wipe has fully exited (safe to unmount). */
  onDone?: () => void;
}

/**
 * AuroraWipe — full-screen aurora gradient sweep used for the two narrative
 * route hops (quiz → explore). Mount it to start the wipe: it slides up to
 * cover the screen, calls onCovered (push the route there), then slides away.
 * Reduced motion: a quick opacity dip instead of the sweep.
 */
export function AuroraWipe({ onCovered, onDone }: AuroraWipeProps) {
  // SSR-safe: framer's useReducedMotion() is false on the server but true on the
  // client's first render, so branching markup on it fails hydration. This hook
  // returns false until mounted.
  const reduced = useEffectiveReducedMotion();

  useEffect(() => {
    const cover = setTimeout(onCovered, reduced ? 120 : 480);
    const done = setTimeout(() => onDone?.(), reduced ? 400 : 1150);
    return () => {
      clearTimeout(cover);
      clearTimeout(done);
    };
  }, [onCovered, onDone, reduced]);

  if (reduced) {
    return (
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-[9990] pointer-events-none"
        style={{ background: 'var(--grad-aurora)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.4, times: [0, 0.3, 0.7, 1] }}
      />
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[9990] pointer-events-none"
      style={{ background: 'var(--grad-aurora)' }}
      initial={{ y: '100%' }}
      animate={{ y: ['100%', '0%', '0%', '-100%'] }}
      transition={{ duration: 1.1, times: [0, 0.42, 0.58, 1], ease: [0.7, 0, 0.3, 1] }}
    />
  );
}

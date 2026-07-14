'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraWipe } from '@/components/motion/AuroraWipe';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { dataClient } from '@/lib/dataClient';

interface WelcomeOverlayProps {
  name?: string;
}

/**
 * WelcomeOverlay — plays ONCE per visitor (guarded by KEY_WELCOMED in localStorage).
 *
 * Sequence:
 *   1. AuroraWipe entrance sweep (self-animating, calls onDone at ~1150ms)
 *   2. MilestoneSeal + confetti at z-50 over the page
 *   3. Dismissed when seal's onDone fires (confetti completion) OR safety
 *      setTimeout (~1800ms) — whichever comes first. Reduced-motion safe:
 *      AuroraWipe fires onDone at 400ms; MilestoneSeal/Confetti fire onDone
 *      immediately in reduced-motion mode.
 */
export function WelcomeOverlay({ name }: WelcomeOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'wipe' | 'seal'>('idle');
  // Captured from the same read that decides whether to play, so the greeting
  // cannot fall back to "friend" just because the member lives on the server.
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const dismissedRef = useRef(false);
  const safetyRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate on mount (client only — SSR always returns 'idle').
  //
  // Through dataClient, NOT lib/journeyState directly. journeyState reads
  // localStorage, and in http mode — which is every real deployment — the member
  // lives in Postgres and localStorage is empty. So `getUser()` was always null,
  // the overlay never reached the 'wipe' phase, and the welcome moment simply did
  // not exist in production. Both sign-in paths redirect to `?welcome=1` to
  // trigger it; nothing has ever been listening.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [user, welcomed] = await Promise.all([
        dataClient.getUser(),
        dataClient.getWelcomed(),
      ]);
      if (cancelled || !user || welcomed) return;

      // Mark first, play second: the flag is what stops this replaying on every
      // visit, and it must be set even if the animation is cut short.
      void dataClient.setWelcomed(true);
      setLoadedName(user.firstName ?? null);
      setPhase('wipe');
    })();

    return () => { cancelled = true; };
  }, []);

  // Cleanup safety timer on unmount.
  useEffect(() => {
    return () => {
      if (safetyRef.current) clearTimeout(safetyRef.current);
    };
  }, []);

  /** Called when AuroraWipe.onDone fires — aurora is fully off-screen. */
  function enterSeal() {
    setPhase('seal');
    // Safety: always dismiss even if Confetti.onDone never fires.
    safetyRef.current = setTimeout(dismiss, 1800);
  }

  /** Idempotent dismiss — ref-guarded to handle both safety and onDone paths. */
  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setPhase('idle');
  }

  if (phase === 'idle') return null;

  const displayName = name || loadedName || 'friend';

  return (
    <>
      {/* AuroraWipe self-animates; no AnimatePresence needed (has no exit variant). */}
      {phase === 'wipe' && (
        <AuroraWipe onCovered={() => {}} onDone={enterSeal} />
      )}

      {/* Seal fades out on dismiss via AnimatePresence exit. */}
      <AnimatePresence>
        {phase === 'seal' && (
          <motion.div
            key="welcome-seal"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.32, ease: [0.7, 0, 0.84, 0] }}
          >
            <MilestoneSeal
              label={`Welcome, ${displayName}`}
              withConfetti
              onDone={dismiss}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

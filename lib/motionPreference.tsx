'use client';

/**
 * Motion preference — single source of truth for "should animations play?".
 *
 * Why this exists: the OS-level `prefers-reduced-motion` (e.g. Windows
 * "animation effects off") makes the whole site appear static. This lets the
 * user FORCE motion on regardless of the OS, via a visible toggle.
 *
 * - `forceMotion` defaults to OFF: we respect the OS preference. Someone who has
 *   asked their operating system to reduce motion has asked us too, and
 *   journey-spec §0.4 calls that contract non-negotiable. It previously
 *   defaulted ON, and `MotionToggle` was never rendered anywhere, so the site
 *   overrode `prefers-reduced-motion` for every visitor with no way to opt out.
 * - When ON (user opts in via MotionToggle): wraps the tree in
 *   <MotionConfig reducedMotion="never"> (framer ignores the OS) AND adds
 *   `.force-motion` to <html> (bypassing the CSS override in globals.css).
 * - When OFF: framer gets "user" and the CSS override applies — the OS wins.
 * - Non-framer consumers (Lottie, Spline, Lenis) call useEffectiveReducedMotion().
 *
 * Nothing may branch *rendered markup* on framer's own useReducedMotion(): it
 * returns false on the server and the OS value on the client's first render,
 * which fails hydration. Use useEffectiveReducedMotion() — it returns false
 * until mounted, so both sides agree.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

const STORAGE_KEY = 'companio_force_motion';

interface MotionPrefCtx {
  forceMotion: boolean;
  setForceMotion: (v: boolean) => void;
  toggle: () => void;
  mounted: boolean;
}

const Ctx = createContext<MotionPrefCtx>({
  forceMotion: false,
  setForceMotion: () => {},
  toggle: () => {},
  mounted: false,
});

export function MotionPreferenceProvider({ children }: { children: React.ReactNode }) {
  // Default OFF — respect the OS. Visitors who have not asked for reduced motion
  // are unaffected (systemReduced is false for them), so this costs nothing
  // visually and restores the accessibility contract for those who have.
  const [forceMotion, setForceMotionState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '0') setForceMotionState(false);
      else if (stored === '1') setForceMotionState(true);
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('force-motion', forceMotion);
    try {
      localStorage.setItem(STORAGE_KEY, forceMotion ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [forceMotion]);

  const setForceMotion = useCallback((v: boolean) => setForceMotionState(v), []);
  const toggle = useCallback(() => setForceMotionState((v) => !v), []);

  return (
    <Ctx.Provider value={{ forceMotion, setForceMotion, toggle, mounted }}>
      <MotionConfig reducedMotion={forceMotion ? 'never' : 'user'}>{children}</MotionConfig>
    </Ctx.Provider>
  );
}

export function useMotionPreference() {
  return useContext(Ctx);
}

/**
 * For non-framer-motion consumers (Lottie / Spline / Lenis).
 * Returns true only when we SHOULD reduce motion: i.e. force is off AND the OS
 * asks for reduced motion. Pre-hydration it returns false (motion-on default).
 */
export function useEffectiveReducedMotion(): boolean {
  const { forceMotion, mounted } = useMotionPreference();
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReduced(mq.matches);
    const on = () => setSystemReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  if (!mounted) return false;
  return !forceMotion && systemReduced;
}

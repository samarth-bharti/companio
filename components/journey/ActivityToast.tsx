'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { X } from 'lucide-react';
import { spring } from '@/lib/motion';

const SESSION_KEY = 'companio_activity_toast';
const SHOW_DELAY_MS = 4000;
const DISMISS_MS = 6000;

const MESSAGES = [
  'Rohan just booked a Cubbon Park walk in Bengaluru.',
  'Aisha and her companion met for chai in Pune this morning.',
  'A morning-run meetup just wrapped up at Marine Drive.',
] as const;

// Deterministic-ish pick: changes every 20 minutes, avoids Math.random each render
function pickMessage(): string {
  return MESSAGES[Math.floor(new Date().getMinutes() / 20) % MESSAGES.length];
}

/**
 * ActivityToast — one-per-session muted social-proof toast (spec §8.4).
 *
 * Mount on /explore and /dashboard. Fires once per browser session via
 * sessionStorage guard, appears after 4 s, auto-dismisses after 6 s.
 * Dismissible via an accessible × button (44px target).
 */
export function ActivityToast() {
  const [visible, setVisible] = useState(false);
  // Picked in effect, not initializer — server and client renders must agree.
  const [message, setMessage] = useState<string>(MESSAGES[0]);
  const reduced = useEffectiveReducedMotion();

  // Session guard + show after delay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    setMessage(pickMessage());
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible]);

  const variants = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.18 } },
        exit:    { opacity: 0, transition: { duration: 0.18 } },
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0,  transition: spring.soft },
        exit:    {
          opacity: 0, y: 8,
          transition: { type: 'tween' as const, duration: 0.18, ease: [0.7, 0, 0.84, 0] as [number, number, number, number] },
        },
      };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 max-w-xs"
          style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(46,107,255,0.15)',
            boxShadow: 'var(--shadow-2)',
          }}
        >
          {/* Live dot — decorative fill, not text, so --color-emerald fill is fine */}
          <span
            aria-hidden="true"
            className="shrink-0 w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--color-emerald)' }}
          />

          <p
            className="text-sm flex-1 leading-snug"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            {message}
          </p>

          <button
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
            className="shrink-0 inline-flex items-center justify-center rounded-md transition-colors"
            style={{
              width: 44,
              height: 44,
              color: 'var(--color-ink-muted)',
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

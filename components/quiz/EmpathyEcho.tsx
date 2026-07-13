'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import { Button } from '@/components/ui/Button';

interface EmpathyEchoProps {
  /** The Lora italic reply line. */
  line: string;
  /** Called when the echo is finished (auto-timer or explicit Next). */
  onDone: () => void;
}

/**
 * EmpathyEcho — Companio's reply after each quiz answer.
 * Full motion: typing dots 600ms → Lora line fades in → auto-advance after 1.2s.
 * Reduced motion: line appears immediately + explicit Next button.
 */
export function EmpathyEcho({ line, onDone }: EmpathyEchoProps) {
  const reduced = useEffectiveReducedMotion();

  useEffect(() => {
    if (reduced) return;
    // dots: 600ms, line fade-in: 400ms, hold: 1200ms
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [reduced, onDone, line]);

  if (reduced) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-start gap-4"
      >
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1rem',
            lineHeight: 1.65,
            color: 'var(--color-ink)',
          }}
        >
          {line}
        </p>
        <Button variant="ghost" size="sm" onClick={onDone} className="self-start">
          Next →
        </Button>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Companio says: ${line}`}
      className="flex flex-col items-start gap-3"
    >
      {/* Typing dots — animate out after 600ms */}
      <motion.div
        className="flex items-center gap-1 px-3 py-2 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(46,107,255,0.14)',
          boxShadow: 'var(--shadow-1)',
        }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.9, times: [0, 0.1, 0.72, 1] }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-ink-muted)' }}
            animate={{ y: [0, -4, 0] }}
            transition={{
              repeat: Infinity,
              duration: 0.55,
              delay: i * 0.14,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Lora italic reply — appears at 0.6s delay */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.65 }}
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '1rem',
          lineHeight: 1.65,
          color: 'var(--color-ink)',
        }}
      >
        {line}
      </motion.p>
    </div>
  );
}

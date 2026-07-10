'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { X } from 'lucide-react';
import { updateBooking, addNotification } from '@/lib/appState';
import { calm, spring } from '@/lib/motion';
import type { Booking } from '@/lib/appState';

interface ReviewModalProps {
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}

export function ReviewModal({ booking, onClose, onSaved }: ReviewModalProps) {
  const [stars, setStars]         = useState(0);
  const [hovered, setHovered]     = useState(0); // which star is hovered (0 = none)
  const [text, setText]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = useEffectiveReducedMotion();

  // Focus trap + ESC + restore focus on unmount
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const el = dialogRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, input, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) return;
    setSubmitting(true);
    updateBooking(booking.id, { review: { stars, text } });
    addNotification({ title: 'Thanks for your review!', body: `Your ${stars}-star review has been saved.` });
    setTimeout(() => { setSubmitting(false); onSaved(); }, 400);
  };

  // Highlight level: hovered takes precedence over selected
  const highlight = hovered > 0 ? hovered : stars;

  return (
    <>
      {/* Backdrop — aria-hidden so SR sees only the dialog */}
      <div
        className="fixed inset-0 z-50"
        aria-hidden="true"
        style={{ background: 'rgba(20,26,46,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-title"
          className="w-full max-w-md rounded-lg p-6 pointer-events-auto"
          style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lift)' }}
          initial={{ opacity: 0, scale: reduced ? 1 : 0.94, y: reduced ? 0 : 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 }}
          transition={calm.base}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="review-title" className="font-display font-bold text-lg" style={{ color: 'var(--color-ink)' }}>
              Rate your meetup
            </h2>
            <motion.button
              onClick={onClose}
              aria-label="Close"
              whileTap={reduced ? {} : { scale: 0.9 }}
              transition={spring.snappy}
              className="inline-flex items-center justify-center rounded-md transition-colors"
              style={{ width: 44, height: 44, color: 'var(--color-ink-muted)' }}
            >
              <X size={18} aria-hidden="true" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit}>
            <fieldset className="mb-4 border-0 p-0">
              <legend className="font-sans text-sm mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                How was your {booking.activity}?
              </legend>
              <div role="radiogroup" aria-label="Star rating" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    className="cursor-pointer"
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                  >
                    <input
                      type="radio"
                      name="stars"
                      value={n}
                      checked={stars === n}
                      onChange={() => setStars(n)}
                      className="sr-only"
                    />
                    {/* Scale pop on hover/select via framer-motion; color via CSS transition */}
                    <motion.span
                      className="inline-flex items-center justify-center text-3xl"
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        color: n <= highlight ? 'var(--color-gold)' : 'rgba(90,99,120,0.25)',
                        filter: n <= highlight ? 'drop-shadow(0 1px 3px rgba(255,178,62,0.5))' : 'none',
                        transition: 'color 0.15s ease, filter 0.15s ease',
                      }}
                      whileHover={reduced ? {} : { scale: 1.2 }}
                      whileTap={reduced ? {} : { scale: 0.88 }}
                      animate={n === stars && !reduced ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={spring.snappy}
                      aria-hidden="true"
                    >
                      ★
                    </motion.span>
                  </label>
                ))}
              </div>
            </fieldset>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              rows={3}
              className="w-full rounded-md px-3 py-2 text-sm font-sans resize-none mb-5"
              style={{
                border: '1.5px solid rgba(90,99,120,0.2)',
                color: 'var(--color-ink)',
                background: 'var(--color-bg)',
                outline: 'none',
              }}
            />

            <motion.button
              type="submit"
              disabled={stars === 0 || submitting}
              whileTap={reduced ? {} : { scale: 0.97 }}
              transition={spring.snappy}
              className="w-full min-h-[44px] rounded-pill font-semibold text-sm text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--grad-cta)' }}
            >
              {submitting ? 'Saving…' : 'Submit review'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </>
  );
}

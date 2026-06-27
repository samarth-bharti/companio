'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, MapPin, Users, Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Non-skippable safety acknowledgement shown right before a booking is confirmed.
// IT Act / intermediary good-practice: surface real-world meetup safety and make
// the user actively confirm they've read it (checkbox gates the confirm button).

const POINTS = [
  { icon: MapPin, text: 'Meet in a public place for your first few meetups.' },
  { icon: Users, text: 'Tell a friend or family member where you’ll be and when.' },
  { icon: Flag, text: 'Use in-app SOS, report or block anytime if anything feels off.' },
];

export function SafetyAckModal({
  open,
  companionFirstName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  companionFirstName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [ack, setAck] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<Element | null>(null);

  // Focus trap + Escape, matching UnlockSheet/CheckoutSheet. Without this,
  // keyboard / screen-reader users can tab straight past this safety gate to the
  // page behind it.
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ));
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement;
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('input,button')?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
      (prevFocusRef.current as HTMLElement | null)?.focus();
    };
  }, [open, handleKey]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="safety-ack-title"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <motion.div
            ref={panelRef}
            className="relative w-full sm:max-w-md bg-[var(--color-bg)] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldCheck size={22} className="text-[var(--color-emerald)] shrink-0" aria-hidden="true" />
              <h2
                id="safety-ack-title"
                className="font-display font-black text-[var(--color-ink)]"
                style={{ fontSize: 'var(--text-h3)' }}
              >
                Before you meet {companionFirstName}
              </h2>
            </div>

            <ul className="flex flex-col gap-3 mb-5">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon size={18} className="text-[var(--color-azure)] shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-[var(--color-ink-muted)]">{text}</span>
                </li>
              ))}
            </ul>

            <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-azure)]"
              />
              <span className="text-sm text-[var(--color-ink)]">
                I’ve read these safety tips and understand Companio meetups are
                strictly platonic.
              </span>
            </label>

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={onClose} className="flex-1">
                Back
              </Button>
              <Button
                variant="cta"
                size="lg"
                disabled={!ack}
                onClick={onConfirm}
                className="flex-[2]"
              >
                Confirm meetup
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

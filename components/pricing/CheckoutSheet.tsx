'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spring, durations, calm } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { PaymentMethodTiles } from '@/components/explore/PaymentMethodTiles';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { payWithRazorpay, type RazorpayIntent } from '@/lib/razorpayClient';

type PayState = 'idle' | 'processing' | 'success';

export interface CheckoutItem {
  label: string;
  priceDisplay: string;
  detail?: string;
}

interface CheckoutSheetProps {
  open: boolean;
  item: CheckoutItem | null;
  onClose: () => void;
  /** Caller handles addCredits/setPlan/addNotification — called synchronously on pay success. */
  onPaid: () => void;
  /**
   * What is being bought, for live Razorpay. When omitted (or when Razorpay
   * isn't configured) the sheet runs the local demo animation instead — so
   * existing callers keep working unchanged.
   */
  order?: RazorpayIntent;
}

const LABEL_ID = 'checkout-sheet-label';

/**
 * Brief two-phase labor illusion shown during payment processing.
 * Phase 1 (~700 ms): "Securing your payment…"
 * Phase 2 (~500 ms): "Confirming…"
 * Both phases describe real-ish steps — no fake countdowns or fake numbers.
 */
const PROCESSING_PHASES = [
  { label: 'Securing your payment…', duration: 700 },
  { label: 'Confirming…',            duration: 500 },
] as const;

export function CheckoutSheet({ open, item, onClose, onPaid, order }: CheckoutSheetProps) {
  const reduced = useEffectiveReducedMotion();
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(null);
  const [pay, setPay] = useState<PayState>('idle');
  const [payError, setPayError] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState<string>(PROCESSING_PHASES[0].label);
  const [isMd, setIsMd] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<Element | null>(null);
  const payTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Synchronous double-submit guard (setPay is async; covers the reduced-motion
  // path too, which calls onPaid immediately).
  const payingRef = useRef(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const els = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a,[tabindex]:not([tabindex="-1"])'
        )
      );
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    },
    [onClose]
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width:768px)');
    setIsMd(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement;
      document.documentElement.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKey);
      setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button')?.focus(), 60);
    } else {
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
      (prevFocusRef.current as HTMLElement | null)?.focus();
      // Clear any running pay timers when sheet closes mid-flow.
      payTimers.current.forEach(clearTimeout);
      payTimers.current = [];
      payingRef.current = false;
      setTimeout(() => {
        setPay('idle');
        setSel(null);
        setProcessingLabel(PROCESSING_PHASES[0].label);
      }, 300);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  // Cleanup pay timers on unmount.
  useEffect(() => {
    return () => { payTimers.current.forEach(clearTimeout); };
  }, []);

  // Local demo simulation — the original two-phase labor illusion (~1.2s).
  // Used whenever live Razorpay isn't wired, so demo mode is unchanged.
  function runDemoPay() {
    setProcessingLabel(PROCESSING_PHASES[0].label);
    if (reduced) {
      setPay('success');
      onPaid();
      return;
    }
    payTimers.current.forEach(clearTimeout);
    payTimers.current = [
      setTimeout(() => setProcessingLabel(PROCESSING_PHASES[1].label), PROCESSING_PHASES[0].duration),
      setTimeout(() => {
        setPay('success');
        onPaid();
      }, PROCESSING_PHASES[0].duration + PROCESSING_PHASES[1].duration),
    ];
  }

  async function doPay() {
    if (payingRef.current || !sel) return;
    payingRef.current = true;
    setPayError(null);
    setPay('processing');

    // No order intent supplied -> always demo (backward compatible).
    if (!order) { runDemoPay(); return; }

    const result = await payWithRazorpay(order);
    // 'unconfigured' = this build has no publishable key, so there is no
    // gateway that could have charged anyone; the demo animation is the whole
    // product. Every other outcome is a real gateway outcome and must NOT
    // fall through to the demo, which grants the benefit for free.
    if (result === 'unconfigured') { runDemoPay(); return; }
    if (result === 'success') { setPay('success'); onPaid(); return; }
    payingRef.current = false;
    setPay('idle');
    if (result === 'auth_required') setPayError('Please sign in to complete this purchase.');
    else if (result === 'unavailable') setPayError('Payments are temporarily unavailable. Please try again shortly.');
    else if (result === 'failed') setPayError("That payment didn't go through. You have not been charged.");
  }

  // Contextual seal label — clearer than "Done!".
  const sealLabel = item?.label?.includes('Plus')
    ? 'Companio Plus active'
    : `${item?.label ?? 'Purchase'} added`;

  const slideIn = isMd ? { scale: 0.96, y: 12, opacity: 0 } : { y: '100%' };
  const slideOut = isMd ? { scale: 0.96, y: 12, opacity: 0 } : { y: '100%' };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="bd" className="fixed inset-0 z-40"
            style={{ background: 'rgba(20,18,42,.55)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: durations.fast }}
            onClick={onClose} aria-hidden="true" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center pointer-events-none">
            <motion.div ref={panelRef} key="panel"
              role="dialog" aria-modal="true" aria-labelledby={LABEL_ID}
              initial={reduced ? { opacity: 0 } : slideIn}
              animate={reduced ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : slideOut}
              transition={reduced ? { duration: durations.fast } : spring.soft}
              className={cn(
                'pointer-events-auto w-full max-h-[92dvh] overflow-y-auto',
                'bg-[var(--color-surface)] [box-shadow:var(--shadow-lift)]',
                'rounded-t-[var(--radius-lg)] md:max-w-md md:rounded-[var(--radius-lg)]',
                'px-5 pt-4 pb-8 flex flex-col gap-5'
              )}>

              {/* Header */}
              <div className="flex items-center justify-between -mb-1">
                <p id={LABEL_ID} className="font-semibold text-[var(--color-ink)]">
                  {pay === 'success' ? 'Payment successful' : 'Review & pay'}
                </p>
                <button type="button" onClick={onClose} aria-label="Close checkout"
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-azure)] focus-visible:outline-offset-1">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              {pay !== 'success' ? (
                <>
                  {item && (
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-azure-tint)] border border-[var(--color-azure)]/15 px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-[var(--color-ink)]">{item.label}</p>
                        {item.detail && <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{item.detail}</p>}
                      </div>
                      <p className="font-black shrink-0 text-[var(--color-ink)]"
                        style={{ fontFamily: 'var(--font-display)' }}>{item.priceDisplay}</p>
                    </div>
                  )}

                  <PaymentMethodTiles selected={sel} onSelect={setSel} />

                  {payError && (
                    <p role="alert" className="text-xs text-center" style={{ color: '#C0392B' }}>
                      {payError}
                    </p>
                  )}

                  <div aria-live="polite" aria-atomic="true">
                    <Button variant="cta" size="xl" className="w-full"
                      onClick={doPay} disabled={pay !== 'idle' || !sel}>
                      {pay === 'idle' && `Pay ${item?.priceDisplay ?? ''}`}
                      {pay === 'processing' && (
                        <span className="flex items-center gap-2">
                          {reduced ? (
                            <Loader2 size={18} aria-hidden="true" />
                          ) : (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                              className="inline-block"
                              aria-hidden="true"
                            >
                              <Loader2 size={18} />
                            </motion.span>
                          )}
                          {/* Labor illusion: phase label fades in/out via AnimatePresence */}
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={processingLabel}
                              initial={{ opacity: 0, y: 3 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -3 }}
                              transition={calm.fast}
                            >
                              {processingLabel}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-[var(--color-ink-muted)]">
                    Secured by Razorpay · Full refund in 7 days if you change your mind.
                  </p>
                </>
              ) : (
                /* Success state — spring.stamp seal + confetti as the single kinetic payoff */
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <MilestoneSeal
                      label={sealLabel}
                      sub={item?.priceDisplay}
                      size={80}
                      withConfetti
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[var(--color-ink)]">{item?.label}</p>
                    <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                      {item?.priceDisplay} · no expiry
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    <Button variant="cta" size="lg" className="w-full"
                      onClick={() => { onClose(); router.push('/explore'); }}>
                      Find a companion →
                    </Button>
                    <Button variant="ghost" size="md" className="w-full"
                      onClick={() => { onClose(); router.push('/dashboard'); }}>
                      View wallet →
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { X, Lock, BadgeCheck, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { PaymentMethodTiles } from "./PaymentMethodTiles";
import { UnlockBenefits } from "./UnlockBenefits";
import { payWithRazorpay } from "@/lib/razorpayClient";

type PayState = "idle" | "processing" | "success";
const HEADLINE_ID = "unlock-sheet-headline";

/**
 * THE UNLOCK IS GRANTED BY THE SERVER, OR NOT AT ALL.
 *
 * This sheet used to hold a `runDemoPay()` that waited 450 ms and then called
 * onSuccess(), which wrote the unlock flag to localStorage. It was reachable
 * whenever payWithRazorpay() returned 'unconfigured' — and a 401 from an
 * unauthenticated visitor once mapped to exactly that. A keyed production build
 * would have given every visitor a free ₹199 unlock.
 *
 * The lesson generalises: a fallback that grants a paid benefit must not exist.
 * When there is no gateway we say there is no gateway. `onSuccess` now fires
 * only after `payWithRazorpay` returns 'success', which means the server
 * verified an HMAC signature and settled the purchase itself.
 */
export function UnlockSheet({
  open, seedName, city, count, isGuest = false, onRequireAccount, onClose, onSuccess,
}: {
  open: boolean; seedName: string; city: string;
  count: number; isGuest?: boolean; onRequireAccount?: () => void;
  onClose: () => void; onSuccess: () => void;
}) {
  const reduced = useEffectiveReducedMotion();
  const [sel, setSel] = useState<string | null>(null);
  const [pay, setPay] = useState<PayState>("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<Element | null>(null);
  // Synchronous double-submit guard + tracked timers. setPay is async, so a fast
  // double-click would otherwise schedule onSuccess twice (double unlock/credit).
  const payingRef = useRef(false);
  const payTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key !== "Tab" || !panelRef.current) return;
    const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
    ));
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement;
      document.documentElement.style.overflow = "hidden";
      document.addEventListener("keydown", handleKey);
      setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button")?.focus(), 60);
    } else {
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
      (prevFocusRef.current as HTMLElement | null)?.focus();
      // Closing cancels any in-flight payment timers and re-arms the guard.
      payTimers.current.forEach(clearTimeout);
      payTimers.current = [];
      payingRef.current = false;
      setPayError(null);
      setTimeout(() => { setPay("idle"); setSel(null); }, 300);
    }
    return () => { document.removeEventListener("keydown", handleKey); };
  }, [open, handleKey]);

  // Unmount-only safety: never let a scheduled onSuccess fire after teardown.
  useEffect(() => () => { payTimers.current.forEach(clearTimeout); }, []);

  function fail(message: string) {
    payingRef.current = false;
    setPay("idle");
    setPayError(message);
  }

  async function doPay() {
    if (payingRef.current) return;
    if (!sel) return; // a payment method must be chosen first
    payingRef.current = true;
    setPayError(null);
    setPay("processing");

    const result = await payWithRazorpay({ kind: "unlock" });

    switch (result) {
      case "success":
        // The server verified the signature and flipped User.unlocked. Only now.
        setPay("success");
        payTimers.current.push(setTimeout(() => onSuccess(), 450));
        return;
      case "auth_required":
        // Live gateway, but the server has no session for this visitor. Send
        // them to sign in rather than pretending the payment worked.
        payingRef.current = false;
        setPay("idle");
        onRequireAccount?.();
        return;
      case "dismissed":
        payingRef.current = false;
        setPay("idle");
        return;
      case "unconfigured":
        fail("Payments are not enabled on this deployment yet, so the unlock cannot be purchased.");
        return;
      case "unavailable":
        fail("Payments are temporarily unavailable. Please try again shortly.");
        return;
      default:
        fail("That payment didn't go through. You have not been charged.");
    }
  }

  // matchMedia in effect, not render — server and first client pass must agree.
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width:768px)");
    setIsMd(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="bd" className="fixed inset-0 z-40"
            style={{ background: "rgba(20,18,42,.55)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={onClose} aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center pointer-events-none">
            <motion.div
              ref={panelRef}
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={HEADLINE_ID}
              initial={reduced ? { opacity: 0 } : isMd ? { scale: 0.96, y: 12, opacity: 0 } : { y: "100%" }}
              animate={reduced ? { opacity: 1 } : isMd ? { scale: 1, y: 0, opacity: 1 } : { y: 0 }}
              exit={reduced ? { opacity: 0 } : isMd ? { scale: 0.96, y: 12, opacity: 0 } : { y: "100%" }}
              transition={reduced ? { duration: 0.18 } : spring.soft}
              className={cn(
                "pointer-events-auto w-full max-h-[92dvh] overflow-y-auto",
                "bg-[var(--color-surface)] [box-shadow:var(--shadow-lift)]",
                "rounded-t-[var(--radius-lg)] md:max-w-md md:rounded-[var(--radius-lg)]",
                "px-5 pt-4 pb-8 flex flex-col gap-5"
              )}
            >
              <div className="flex justify-end -mb-1">
                <button type="button" onClick={onClose} aria-label="Close"
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-azure)] focus-visible:outline-offset-1">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <UnlockBenefits seedName={seedName} city={city} count={count} headlineId={HEADLINE_ID} />
              {/* Guests create an account first — don't show payment UI yet, it
                  reads as "pay now" and conflicts with the account step. */}
              {!isGuest && <PaymentMethodTiles selected={sel} onSelect={setSel} />}
              <div aria-live="polite" aria-atomic="true">
                {isGuest ? (
                  <Button variant="cta" size="xl" className="w-full" onClick={() => onRequireAccount?.()}>
                    Create a free account to unlock →
                  </Button>
                ) : (
                <Button variant="cta" size="xl" className="w-full" onClick={doPay} disabled={pay !== "idle" || !sel}>
                  {pay === "idle" && "Pay ₹199, unlock everything."}
                  {pay === "processing" && (
                    <span className="flex items-center gap-2">
                      {reduced
                        ? <Loader2 size={18} className="inline-block" aria-hidden="true" />
                        : <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="inline-block" aria-hidden="true"><Loader2 size={18} /></motion.span>
                      }
                      Processing…
                    </span>
                  )}
                  {pay === "success" && (
                    <span className="flex items-center gap-2">
                      <Check size={18} aria-hidden="true" />Unlocked!
                    </span>
                  )}
                </Button>
                )}
                {!isGuest && !sel && pay === "idle" && (
                  <p className="mt-2 text-xs text-center text-[var(--color-ink-muted)]">
                    Select a payment method to continue
                  </p>
                )}
                {isGuest && (
                  <p className="mt-2 text-xs text-center text-[var(--color-ink-muted)]">
                    Step 1: free account · Step 2: pay ₹199 (one-time, no subscription)
                  </p>
                )}
                {payError && (
                  <p role="alert" className="mt-2 text-xs text-center" style={{ color: '#C0392B' }}>
                    {payError}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-xs text-[var(--color-ink-muted)] text-center">
                  Didn&rsquo;t find anyone you&rsquo;d like to meet? Full refund in 7 days.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                  <Lock size={12} aria-hidden="true" /><span>Secured by Razorpay</span>
                </div>
              </div>
              {/* Only ever state what v1 actually sells. Additional paid meetups
                  are not purchasable yet, so we do not quote a price for them. */}
              <p className="text-xs text-[var(--color-ink-muted)] text-center leading-relaxed">
                One payment, no subscription. Your 2 included meetups never expire.
              </p>
              <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-black/[.03] p-3">
                <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[var(--color-azure)]" aria-hidden="true" />
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Every companion completes government-ID verification before their profile goes
                  live. Meetups are strictly platonic and happen in public places.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

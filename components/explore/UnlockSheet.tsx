"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Lock, BadgeCheck, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { PaymentMethodTiles } from "./PaymentMethodTiles";
import { UnlockBenefits } from "./UnlockBenefits";

type PayState = "idle" | "processing" | "success";
const HEADLINE_ID = "unlock-sheet-headline";

export function UnlockSheet({
  open, seedName, city, count, onClose, onSuccess,
}: {
  open: boolean; seedName: string; city: string;
  count: number; onClose: () => void; onSuccess: () => void;
}) {
  const reduced = useReducedMotion();
  const [sel, setSel] = useState<string | null>(null);
  const [pay, setPay] = useState<PayState>("idle");
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<Element | null>(null);

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
      setTimeout(() => { setPay("idle"); setSel(null); }, 300);
    }
    return () => { document.removeEventListener("keydown", handleKey); };
  }, [open, handleKey]);

  function doPay() {
    if (pay !== "idle") return;
    setPay("processing");
    setTimeout(() => { setPay("success"); setTimeout(onSuccess, 450); }, reduced ? 0 : 900);
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
              <PaymentMethodTiles selected={sel} onSelect={setSel} />
              <div aria-live="polite" aria-atomic="true">
                <Button variant="cta" size="xl" className="w-full" onClick={doPay} disabled={pay !== "idle"}>
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
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-xs text-[var(--color-ink-muted)] text-center">
                  Didn&rsquo;t find anyone you&rsquo;d like to meet? Full refund in 7 days.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                  <Lock size={12} aria-hidden="true" /><span>Secured by Razorpay</span>
                </div>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] text-center leading-relaxed">
                After your 2 included meetings, each meetup is ₹499. We&rsquo;ll always show the price before you book.
              </p>
              <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-black/[.03] p-3">
                <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[var(--color-azure)]" aria-hidden="true" />
                <p className="text-sm text-[var(--color-ink-muted)]">
                  <span style={{ fontFamily: "var(--font-serif)" }} className="italic">
                    &ldquo;Verification meant my family was relaxed about it too.&rdquo;
                  </span>
                  {" "}, Meena T., Delhi
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

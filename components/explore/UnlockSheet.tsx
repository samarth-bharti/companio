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
import { payWithRazorpay, testCheckoutEnabled } from "@/lib/razorpayClient";
import {
  PASS_TIERS,
  PASS_TIER_ORDER,
  applyDiscount,
  formatPaise,
  perMonthPaise,
  type PassTierId,
} from "@/lib/money";

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
  // Which pass they are buying. Defaults to the entry month: pre-selecting the
  // ₹1999 lifetime tier would be charging four figures to anyone who taps Pay
  // without reading, which is not a growth tactic, it is a chargeback.
  const [tier, setTier] = useState<PassTierId>('pass1m');
  const [pay, setPay] = useState<PayState>("idle");
  const [payError, setPayError] = useState<string | null>(null);
  // An unspent spin win. The server applies it when it fixes the order amount;
  // this only mirrors it, so the member can see the price they will actually pay
  // before they commit. The wheel was awarding discounts nobody could spend.
  const [discountPct, setDiscountPct] = useState(0);
  // Discount code state. `codeAmountPaise` is what the SERVER said the price
  // becomes — never computed here, so a tampered client cannot invent a price.
  // create-order looks the code up again anyway and ignores whatever we think.
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [codeAmountPaise, setCodeAmountPaise] = useState<number | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeChecking, setCodeChecking] = useState(false);
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

  // Look up the member's live spin win each time the sheet opens — it can expire.
  useEffect(() => {
    if (!open || isGuest) return;
    let cancelled = false;
    fetch('/api/spin')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setDiscountPct(d?.reward?.discountPct ?? 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, isGuest]);

  // Exactly what the server will charge, to the paise. Quoting a rounded rupee
  // figure here meant offering "Pay ₹159" and billing ₹159.20.
  // Price after the spin win, then after a discount code. The server recomputes
  // both when it fixes the order amount — this only mirrors them so the member
  // can see what they will actually pay before committing.
  const basePaise = PASS_TIERS[tier].amount;
  const spinPrice = applyDiscount(basePaise, discountPct);
  const finalPaise = codeAmountPaise ?? spinPrice;
  const payPrice = formatPaise(finalPaise);

  // Whether this deployment hands the unlock out for free. Asked of the server,
  // and shown loudly — a free unlock that looks like a paid one is how a "test"
  // build quietly becomes the live one.
  const [testMode, setTestMode] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void testCheckoutEnabled().then((v) => { if (!cancelled) setTestMode(v); });
    return () => { cancelled = true; };
  }, [open]);

  function fail(message: string) {
    payingRef.current = false;
    setPay("idle");
    setPayError(message);
  }

  /**
   * Ask the server what this code does to the price. Preview only — it reserves
   * nothing and spends nothing, and create-order re-validates the code from the
   * database when the real order is made. Nothing here is trusted.
   */
  async function applyCode() {
    const code = codeInput.trim();
    if (!code || codeChecking) return;
    setCodeChecking(true);
    setCodeError(null);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, passTier: tier }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        amountPaise?: number;
        message?: string;
      };
      if (!res.ok || !data.ok || typeof data.amountPaise !== 'number') {
        setAppliedCode(null);
        setCodeAmountPaise(null);
        setCodeError(data.message ?? "That code isn't valid.");
        return;
      }
      setAppliedCode(data.code ?? code.toUpperCase());
      setCodeAmountPaise(data.amountPaise);
      setCodeError(null);
    } catch {
      setCodeError('We could not check that code. Please try again.');
    } finally {
      setCodeChecking(false);
    }
  }

  function clearCode() {
    setAppliedCode(null);
    setCodeAmountPaise(null);
    setCodeError(null);
    setCodeInput('');
  }

  /**
   * Switching tier drops any applied code.
   *
   * `codeAmountPaise` is a server-quoted price for ONE tier. Keeping it across a
   * switch would show the ₹199 discounted price on the ₹1999 card — the member
   * would authorise what they read, and the gateway would charge what the server
   * recomputed. Re-typing the code is a smaller cost than that surprise.
   */
  function pickTier(next: PassTierId) {
    if (next === tier) return;
    setTier(next);
    if (appliedCode || codeAmountPaise !== null) clearCode();
  }

  async function doPay() {
    if (payingRef.current) return;
    if (!sel) return; // a payment method must be chosen first
    payingRef.current = true;
    setPayError(null);
    setPay("processing");

    // The code goes to the server as a STRING. The server prices it; we never
    // send an amount.
    const result = await payWithRazorpay({
      kind: "unlock",
      passTier: tier,
      ...(appliedCode ? { discountCode: appliedCode } : {}),
    });

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
      case "discount_invalid":
        // The code was fine when we previewed it and is not fine now — it expired,
        // or someone else took its last use. Clear it so the member sees the real
        // price rather than a discount that no longer exists.
        clearCode();
        fail("That discount code is no longer valid. The price has been updated — you have not been charged.");
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
              {/* basePaise, not the component's own idea of the price: the tier
                  lives here, so the headline has to be told which one is
                  selected or it silently quotes the ₹199 month for all four. */}
              <UnlockBenefits seedName={seedName} city={city} count={count} headlineId={HEADLINE_ID} basePaise={basePaise} discountPct={discountPct} />
              {/* Guests create an account first — don't show payment UI yet, it
                  reads as "pay now" and conflicts with the account step. */}
              {/* Loud on purpose. A free unlock that looks like a paid one is
                  how a test build quietly becomes the live one. */}
              {!isGuest && testMode && (
                <div
                  className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-3"
                  style={{
                    background: 'rgba(255,178,62,0.12)',
                    border: '1px solid rgba(255,178,62,0.45)',
                  }}
                  role="status"
                >
                  <span aria-hidden="true">🧪</span>
                  <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-ink)' }}>
                    <strong>Test mode.</strong> No payment gateway is connected, so this button
                    unlocks everything for free and no money is taken. Adding Razorpay keys
                    switches this off automatically.
                  </p>
                </div>
              )}
              {/* The ladder. Guests don't choose a tier yet — they create an
                  account first, and picking a price before there is anything to
                  charge it to reads as "pay now". Every price here comes from
                  PASS_TIERS, so what is on the button is what the server bills. */}
              {!isGuest && (
                <fieldset className="mb-3 min-w-0">
                  <legend className="label-eyebrow mb-2" style={{ color: 'var(--color-azure)' }}>
                    Choose your pass
                  </legend>
                  <div className="flex flex-col gap-2">
                    {PASS_TIER_ORDER.map((id) => {
                      const t = PASS_TIERS[id];
                      const active = id === tier;
                      const pm = perMonthPaise(t);
                      return (
                        <label
                          key={id}
                          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 cursor-pointer min-w-0"
                          style={{
                            background: active ? 'rgba(46,107,255,0.06)' : 'transparent',
                            border: `1.5px solid ${active ? 'var(--color-azure)' : 'rgba(0,0,0,0.12)'}`,
                          }}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="radio"
                              name="pass-tier"
                              value={id}
                              checked={active}
                              onChange={() => pickTier(id)}
                              className="shrink-0 accent-[var(--color-azure)]"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[var(--color-ink)]">
                                {t.label}
                              </span>
                              <span className="block text-xs text-[var(--color-ink-muted)]">
                                {pm === null ? 'Pay once. Never again.' : `${formatPaise(pm)} a month`}
                              </span>
                            </span>
                          </span>
                          <span className="text-sm font-bold shrink-0 text-[var(--color-ink)]">
                            {formatPaise(t.amount)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {/* Discount code. /admin/discounts could already mint codes; until now
                  nothing on the site would accept one. Guests never see it — a code
                  is applied to an order, and a guest has no order. */}
              {!isGuest && (
                <div className="mb-3">
                  {appliedCode ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm"
                         style={{ background: 'rgba(31,174,107,0.08)', color: '#157A4A' }}>
                      <span>
                        Code <strong>{appliedCode}</strong> applied — you pay {payPrice}.
                      </span>
                      <button
                        type="button"
                        onClick={clearCode}
                        className="text-xs font-semibold underline underline-offset-2 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void applyCode(); } }}
                        placeholder="Discount code"
                        aria-label="Discount code"
                        autoComplete="off"
                        maxLength={32}
                        className="flex-1 min-w-0 h-11 px-3 rounded-xl border text-sm uppercase"
                        style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                      />
                      <button
                        type="button"
                        onClick={() => void applyCode()}
                        disabled={!codeInput.trim() || codeChecking}
                        className="h-11 px-4 rounded-xl text-sm font-semibold shrink-0 disabled:opacity-40"
                        style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
                      >
                        {codeChecking ? 'Checking…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {codeError && (
                    <p role="status" className="mt-1.5 text-xs" style={{ color: 'var(--color-danger)' }}>
                      {codeError}
                    </p>
                  )}
                </div>
              )}
              {!isGuest && <PaymentMethodTiles selected={sel} onSelect={setSel} />}
              <div aria-live="polite" aria-atomic="true">
                {isGuest ? (
                  <Button variant="cta" size="xl" className="w-full" onClick={() => onRequireAccount?.()}>
                    Create a free account to unlock →
                  </Button>
                ) : (
                <Button variant="cta" size="xl" className="w-full" onClick={doPay} disabled={pay !== "idle" || !sel}>
                  {pay === "idle" && `Pay ${payPrice}, unlock everything.`}
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
                    Step 1: free account · Step 2: choose a pass from {formatPaise(PASS_TIERS.pass1m.amount)} (no auto-renewal)
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

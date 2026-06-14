"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Smartphone, Wallet, CreditCard, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring, durations } from "@/lib/motion";

type Method = { id: string; label: string; bg: string; border: string; Icon: LucideIcon };

const METHODS: Method[] = [
  { id: "gpay",    label: "GPay",    bg: "rgba(66,133,244,.08)", border: "rgba(66,133,244,.25)", Icon: Smartphone },
  { id: "phonepe", label: "PhonePe", bg: "rgba(95,37,159,.08)",  border: "rgba(95,37,159,.25)",  Icon: Wallet },
  { id: "paytm",   label: "Paytm",   bg: "rgba(0,46,114,.06)",   border: "rgba(0,46,114,.20)",   Icon: CreditCard },
];

export function PaymentMethodTiles({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [cardOpen, setCardOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="UPI payment method">
        {METHODS.map(({ id, label, bg, border, Icon }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 min-h-[56px]",
                "rounded-[var(--radius-md)] px-2 py-3 cursor-pointer transition-all duration-150",
                "focus-visible:outline-2 focus-visible:outline-[var(--color-azure)] focus-visible:outline-offset-2",
                active && "ring-2 ring-[var(--color-azure)]"
              )}
              style={{
                background: bg,
                border: `1.5px solid ${active ? "var(--color-azure)" : border}`,
              }}
            >
              <Icon size={16} className="text-[var(--color-ink-muted)]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[var(--color-ink)] leading-none">
                {label}
              </span>
              <AnimatePresence>
                {active && (
                  <motion.span
                    key="chk"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={reduced ? { duration: 0 } : spring.snappy}
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--color-azure)] flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Check size={10} strokeWidth={3} className="text-white" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Pay by card disclosure */}
      <div>
        <button
          type="button"
          aria-expanded={cardOpen}
          aria-controls="card-form-section"
          onClick={() => setCardOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-azure)] focus-visible:outline-offset-1 rounded px-0.5"
        >
          <CreditCard size={13} aria-hidden="true" />
          Pay by card →
        </button>

        <AnimatePresence initial={false}>
          {cardOpen && (
            <motion.div
              id="card-form-section"
              key="card"
              initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: durations.base, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-3">
                {(["Card number", "MM / YY", "CVV"] as const).map((lbl) => (
                  <input
                    key={lbl}
                    type="text"
                    disabled
                    placeholder={lbl}
                    aria-label={lbl}
                    className="w-full h-11 px-3 rounded-[var(--radius-sm)] border border-[var(--color-ink-muted)]/30 text-sm text-[var(--color-ink-muted)] bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                ))}
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Demo, card flow mocked
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { type LucideIcon } from "lucide-react";
import { Users, CalendarHeart, ShieldCheck } from "lucide-react";
import { stagger } from "@/lib/motion";
import { UNLOCK_AMOUNT, applyDiscount, formatPaise } from "@/lib/money";

type BenefitRow = {
  Icon: LucideIcon;
  text: (city: string, total: number) => string;
};

const ROWS: BenefitRow[] = [
  {
    Icon: Users,
    text: (city, total) => `Every profile in ${city}, all ${total}, unblurred.`,
  },
  {
    Icon: CalendarHeart,
    text: () => "2 meetings included, yours to use anytime, no expiry.",
  },
  {
    Icon: ShieldCheck,
    text: () => "One-time. No subscription. No auto-debit.",
  },
];

export function UnlockBenefits({
  seedName,
  city,
  count,
  headlineId,
  discountPct = 0,
}: {
  seedName: string;
  city: string;
  count: number;
  headlineId: string;
  /** An unspent spin win. The wheel's prize is a discount on exactly this. */
  discountPct?: number;
}) {
  const reduced = useEffectiveReducedMotion();
  const total = count + 1;
  // The same paise math the server bills on — not a rupee approximation of it.
  const hasDiscount = discountPct > 0;
  const fullPrice = formatPaise(UNLOCK_AMOUNT);
  const payPrice = formatPaise(applyDiscount(UNLOCK_AMOUNT, discountPct));

  return (
    <div className="flex flex-col gap-4">
      {/* Item 1: Headline + sub */}
      <div>
        <h2
          id={headlineId}
          className="text-[var(--color-ink)] leading-snug"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)" }}
        >
          Unlock {seedName}&rsquo;s profile + {count} others in {city}.
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
          One step. You&rsquo;re 30 seconds away.
        </p>
      </div>

      {/* Item 2: Price anchor + benefit rows */}
      <div className="flex flex-col gap-3">
        <div className="relative flex items-end gap-3">
          {/* Big price — struck through when a spin win is being applied. */}
          {hasDiscount && (
            <span
              className="relative leading-none font-semibold text-[var(--color-ink-muted)] line-through"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem" }}
            >
              {fullPrice}
            </span>
          )}
          <span
            className="relative leading-none font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "3rem",
              color: hasDiscount ? 'var(--color-emerald)' : 'var(--color-ink)',
            }}
          >
            {payPrice}
          </span>
          {/* Context line */}
          <p className="pb-1 text-sm text-[var(--color-ink-muted)] leading-snug">
            {hasDiscount ? (
              <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>
                {discountPct}% spin win applied
              </span>
            ) : (
              <>
                2 meetings included · worth <span className="line-through">₹998</span>
              </>
            )}
          </p>
        </div>

        {/* Benefit rows with stagger entrance */}
        <div className="flex flex-col gap-2.5">
          {ROWS.map(({ Icon, text }, i) => (
            <motion.div
              key={i}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { delay: i * stagger.tight, duration: 0.3, ease: [0.16, 1, 0.3, 1] }
              }
              className="flex items-start gap-2.5"
            >
              <Icon
                size={15}
                className="mt-0.5 shrink-0 text-[var(--color-azure)]"
                aria-hidden="true"
              />
              <span className="text-sm text-[var(--color-ink)]">{text(city, total)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

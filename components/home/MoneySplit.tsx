"use client";

import { useRef } from "react";
import { motion, useInView } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

export function MoneySplit() {
  const barRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useEffectiveReducedMotion();

  // Trigger bar growth when section enters view — calm tween, not bouncy
  const isInView = useInView(barRef, { once: true, amount: 0.6 });

  const barTransition = {
    duration: shouldReduce ? 0.01 : 1.4,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  };

  return (
    <section
      className="py-24"
      style={{ background: "var(--color-navy)" }}
      aria-labelledby="money-heading"
    >
      <div className="max-w-4xl mx-auto px-6">
        <Reveal className="text-center mb-14">
          <p className="label-eyebrow mb-3" style={{ color: "var(--color-brass)" }}>
            Transparency
          </p>
          <h2
            id="money-heading"
            className="font-display text-h2"
            style={{ color: "var(--color-paper)" }}
          >
            85% goes to your companion. We show you every rupee.
          </h2>
          <p className="text-lead mt-4 max-w-xl mx-auto" style={{ color: "var(--color-edge)" }}>
            No hidden cuts. You see the split before you pay. Money is held
            safely and released only after you meet.
          </p>
        </Reveal>

        {/* Animated split bar */}
        <div ref={barRef} className="mb-8">
          {/* Bar track */}
          <div
            className="w-full h-10 rounded-full overflow-hidden"
            style={{ background: "var(--color-navy-strong)" }}
            role="img"
            aria-label="85% of the fee goes to the companion, 15% to the platform"
          >
            <motion.div
              className="h-full flex"
              initial={{ width: "0%" }}
              animate={{ width: isInView ? "100%" : "0%" }}
              transition={barTransition}
            >
              {/* Brass — companion share */}
              <div
                className="h-full flex items-center justify-center"
                style={{ width: "85%", background: "var(--color-brass)" }}
              >
                <span className="font-sans font-bold text-sm text-white drop-shadow-sm">
                  Companion
                </span>
              </div>
              {/* Azure — platform share */}
              <div
                className="h-full flex items-center justify-center flex-1"
                style={{ background: "var(--color-azure)" }}
              >
                <span className="font-sans font-bold text-xs text-white drop-shadow-sm">
                  Us
                </span>
              </div>
            </motion.div>
          </div>

          {/* Labels below bar */}
          <div className="flex justify-between mt-3 px-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-display text-h2 font-semibold"
                style={{ color: "var(--color-brass)" }}
              >
                <CountUp value={85} suffix="%" duration={1.4} />
              </span>
              <span className="text-sm font-sans" style={{ color: "var(--color-edge)" }}>
                Companion
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-sans" style={{ color: "var(--color-edge)" }}>
                Platform
              </span>
              <span
                className="font-display text-h2 font-semibold"
                style={{ color: "var(--color-azure)" }}
              >
                <CountUp value={15} suffix="%" duration={1.4} />
              </span>
            </div>
          </div>
        </div>

        {/* Trust line */}
        <Reveal className="text-center">
          <p className="text-sm font-sans" style={{ color: "var(--color-edge)" }}>
            Payments processed via{" "}
            <span className="font-semibold">
              Razorpay
            </span>{" "}
            · Full refund within 7 days
          </p>
        </Reveal>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/motion/Reveal";
import { ParallaxLayer } from "@/components/motion/ParallaxLayer";
import { Seal } from "@/components/ui/Seal";

const TRUST_LINES = [
  "Free to browse",
  "Pay only when you book",
  "Full refund in 7 days",
];

export function FinalCta() {
  const shouldReduce = useEffectiveReducedMotion();
  const sealRef = useRef<HTMLDivElement>(null);
  const [sealInView, setSealInView] = useState(false);

  useEffect(() => {
    const el = sealRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setSealInView(entry.isIntersecting),
      { rootMargin: '100px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      style={{ background: "var(--grad-sky)" }}
      className="relative py-32 overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Soft ambient glow behind the CTA */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="w-[600px] h-[300px] rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--color-azure)" }}
        />
      </div>

      {/* Faint rotating seal — CSS spin, paused when off-screen. */}
      <ParallaxLayer
        depth={0.08}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          ref={sealRef}
          className="opacity-[0.04]"
          style={{
            animation: shouldReduce ? 'none' : 'companio-seal-spin 40s linear infinite',
            animationPlayState: sealInView ? 'running' : 'paused',
          }}
        >
          <Seal size={420} decorative />
        </div>
      </ParallaxLayer>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <Reveal>
          {/* Social proof nudge */}
          <p className="font-sans text-sm font-semibold text-ink-muted mb-4">
            Join{" "}
            <span style={{ color: "var(--color-navy)" }}>12,000+ members</span>{" "}
            across India
          </p>

          <p className="label-eyebrow text-brass-ink mb-4">Get started</p>
          <h2
            id="final-cta-heading"
            className="font-display text-h1 text-navy mb-5"
          >
            Your first stamp is waiting.
          </h2>
          <p className="text-lead text-ink-muted mb-10 max-w-md mx-auto">
            Real company, on your terms, warm, verified, and strictly platonic.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="flex flex-col items-center gap-5">
            <MagneticButton maxShift={8}>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center h-14 min-w-[44px] px-10
                           rounded-pill font-sans font-bold text-lg text-white
                           transition-all focus-visible:outline-white"
                style={{
                  background: "var(--grad-azure-cta)",
                  boxShadow: "var(--glow-azure)",
                }}
              >
                Find a companion
              </Link>
            </MagneticButton>

            <Link
              href="/register?as=companion"
              className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold
                         text-navy hover:text-navy-strong transition-colors underline
                         underline-offset-4 focus-visible:outline-navy rounded-sm
                         min-h-[44px]"
            >
              Become a companion
              <ArrowRight size={14} aria-hidden="true" />
            </Link>

            {/* Trust microcopy */}
            <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap justify-center mt-2">
              {TRUST_LINES.map((line) => (
                <span
                  key={line}
                  className="flex items-center gap-1 text-xs font-sans text-ink-muted"
                >
                  <CheckCircle2
                    size={12}
                    strokeWidth={2}
                    aria-hidden="true"
                    style={{ color: "var(--color-trust)" }}
                  />
                  {line}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

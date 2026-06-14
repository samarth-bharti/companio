"use client";

import { Reveal } from "@/components/motion/Reveal";
import { ParallaxLayer } from "@/components/motion/ParallaxLayer";
import { PassportStack } from "@/components/ui/PassportStack";
import { Seal } from "@/components/ui/Seal";
import { CountUp } from "@/components/motion/CountUp";

const STATS = [
  { value: 12000, suffix: "+", label: "Verified members", delay: 0 },
  { display: "4.9★",          label: "Avg rating",       delay: 0.1, ariaLabel: "4.9 stars average rating" },
  { value: 100,  suffix: "%", label: "ID-checked",       delay: 0.2 },
];

export function TrustProof() {
  return (
    <section
      className="relative py-24 overflow-hidden bg-oat"
      aria-labelledby="trust-heading"
    >
      {/* Faint seal watermark */}
      <ParallaxLayer
        depth={0.12}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <Seal size={360} decorative className="opacity-[0.035]" />
      </ParallaxLayer>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <Reveal className="text-center mb-14">
          <p className="label-eyebrow text-brass-ink mb-3">Verification</p>
          <h2 id="trust-heading" className="font-display text-h2 text-navy">
            Trust you can see stamped.
          </h2>
          <p className="text-lead text-ink-muted mt-4 max-w-xl mx-auto">
            Every companion clears KYC, a background check, and a
            safety interview before they ever appear here.
          </p>
        </Reveal>

        {/* Credentials press in on scroll */}
        <Reveal className="flex justify-center mb-16">
          <PassportStack />
        </Reveal>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center mb-10">
          {STATS.map((stat) => (
            <Reveal key={stat.label} delay={stat.delay}>
              <div
                className="font-display text-h1 text-navy font-semibold leading-none mb-1"
                aria-label={"ariaLabel" in stat ? stat.ariaLabel : undefined}
              >
                {"display" in stat ? (
                  stat.display
                ) : (
                  <CountUp value={stat.value!} suffix={stat.suffix} />
                )}
              </div>
              <p className="text-sm font-sans text-ink-muted">{stat.label}</p>
            </Reveal>
          ))}
        </div>

        {/* Live social proof strip */}
        <Reveal delay={0.3} className="flex justify-center">
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-pill
                       border border-edge bg-white/60 backdrop-blur-sm"
          >
            {/* Pulsing live dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: "var(--color-trust)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: "var(--color-trust)" }}
              />
            </span>
            <p className="text-sm font-sans font-semibold text-ink">
              840+ meetups completed this week across 12 cities
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

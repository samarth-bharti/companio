"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Fingerprint, Lock, Siren, Flag } from "lucide-react";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { LottiePlayer } from "@/components/motion/LottiePlayer";
import { ClipReveal } from "@/components/journey/ClipReveal";

const TRUST_PILLARS = [
  {
    icon: Fingerprint,
    title: "Aadhaar & KYC verified",
    body: "Every companion's identity is verified via Aadhaar before activation. No exceptions.",
    color: "#2E6BFF",
  },
  {
    icon: Lock,
    title: "₹ held in escrow",
    body: "Your payment is locked in escrow until after you meet. No meeting, no charge.",
    color: "#7A4FE0",
  },
  {
    icon: Siren,
    title: "SOS & live-share",
    body: "One tap activates emergency contact sharing and location broadcast during any booking.",
    color: "#FFB23E",
  },
  {
    icon: ShieldCheck,
    title: "Strictly platonic promise",
    body: "Zero tolerance for any non-platonic conduct. Violations result in immediate permanent ban.",
    color: "#1FAE6B",
  },
  {
    icon: Flag,
    title: "Report & block anytime",
    body: "Flag any concern during or after a session. Our trust team reviews within 24 hours.",
    color: "#2E6BFF",
  },
] as const;

function TrustPillar({ pillar, index }: { pillar: (typeof TRUST_PILLARS)[number]; index: number }) {
  const Icon = pillar.icon;
  return (
    <Reveal delay={index * 0.1}>
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start gap-4 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span
          className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 mt-0.5"
          style={{ background: `${pillar.color}20`, border: `1px solid ${pillar.color}35` }}
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={1.8} style={{ color: pillar.color }} />
        </span>
        <div>
          <h3 className="font-sans font-bold text-base mb-1.5 leading-snug" style={{ color: "var(--color-panel-text)" }}>
            {pillar.title}
          </h3>
          <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(244,242,255,0.55)" }}>
            {pillar.body}
          </p>
        </div>
      </motion.div>
    </Reveal>
  );
}

export function SafetySection() {
  return (
    <section
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "var(--grad-dark-panel)" }}
      aria-labelledby="safety-heading"
    >
      {/* Radial glow behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 w-[640px] h-[640px] rounded-full opacity-8 blur-3xl"
        style={{ background: "radial-gradient(circle, #2E6BFF 0%, transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
        {/* Left: headline + description */}
        <div className="md:sticky md:top-28">
          <RevealGroup>
            <Reveal>
              <LottiePlayer
                src="/lottie/secure-lock.json"
                width={160}
                height={160}
                className="mb-4 -ml-2"
                loop
              />
            </Reveal>
            <Reveal>
              <p className="label-eyebrow mb-4" style={{ color: "var(--color-emerald)" }}>
                Trust & Safety
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <ClipReveal
                id="safety-heading"
                text="Safety isn't a feature. It's the foundation."
                accent="It's the foundation."
                accentStyle={{
                  background: "linear-gradient(135deg, #1FAE6B, #2E6BFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                className="font-display text-h1 leading-tight tracking-tight mb-6"
                style={{ color: "var(--color-panel-text)" }}
              />
            </Reveal>
            <Reveal delay={0.16}>
              <p className="text-lead mb-10" style={{ color: "rgba(244,242,255,0.6)" }}>
                We built every layer of Companio to ensure you can meet confidently, whether
                it's your first session or your fiftieth. Verified identities, secure
                payments, and real-time safety tools are always on.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div
                className="inline-flex items-center gap-2 px-5 py-3 rounded-pill font-sans font-semibold text-sm"
                style={{
                  background: "rgba(31,174,107,0.15)",
                  border: "1px solid rgba(31,174,107,0.4)",
                  color: "var(--color-emerald)",
                }}
              >
                <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" />
                Strictly platonic, legally guaranteed
              </div>
            </Reveal>
          </RevealGroup>
        </div>

        {/* Right: trust pillars */}
        <div className="flex flex-col gap-3">
          {TRUST_PILLARS.map((pillar, i) => (
            <TrustPillar key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

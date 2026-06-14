"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { ClipReveal } from "@/components/journey/ClipReveal";
import { ParticleField } from "@/components/journey/ParticleField";

const REASSURANCES = [
  "Free to browse",
  "Pay only when you book",
  "₹ held in escrow until you meet",
] as const;

export function FinalCtaSection() {
  return (
    <section
      className="relative py-28 md:py-36 overflow-hidden"
      // Solid dark fallback UNDER the gradient: if the large gradient layer ever
      // fails to paint (compositing hiccup with the canvas + blurred orbs above),
      // the section stays dark instead of flashing white, keeping the white text
      // and translucent button readable.
      style={{ backgroundColor: "#2B2160", backgroundImage: "var(--grad-aurora)" }}
      aria-labelledby="cta-heading"
    >
      {/* Overlay for readability */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "rgba(20,18,42,0.35)" }}
      />

      {/* Glowing orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-30 blur-3xl" style={{ background: "#7A4FE0" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-25 blur-3xl" style={{ background: "#FFB23E" }} />

      {/* Warm gold particle drift — behind content, above the gradient */}
      <ParticleField count={20} />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <RevealGroup>
          <Reveal>
            <p className="label-eyebrow mb-5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Ready to connect?
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <ClipReveal
              id="cta-heading"
              text="Your next great experience is one booking away."
              className="font-display text-display leading-[1.05] tracking-tight text-white mb-6"
            />
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-lead mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
              Join 28,000+ members across India who explore cities, stay active, and
              make memories, with warm, verified company.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
              <MagneticButton>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center h-14 px-10 rounded-pill font-sans font-bold text-lg text-white transition-all focus-visible:outline-white"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                  }}
                >
                  Find a companion
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/become-a-companion"
                  className="inline-flex items-center justify-center h-14 px-10 rounded-pill font-sans font-bold text-lg transition-all focus-visible:outline-white"
                  style={{
                    background: "var(--color-surface)",
                    color: "var(--color-azure)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  }}
                >
                  Become a companion
                </Link>
              </MagneticButton>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="flex items-center justify-center gap-x-6 gap-y-2 flex-wrap">
              {REASSURANCES.map((item) => (
                <span key={item} className="flex items-center gap-1.5 font-sans text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}

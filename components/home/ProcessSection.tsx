"use client";

import { motion } from "framer-motion";
import { Search, MessageSquare, MapPin, Star } from "lucide-react";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Browse verified companions",
    body: "Filter by activity, city, and availability. Every profile is ID-verified and background-checked before going live.",
    color: "#2E6BFF",
    bg: "#EBF1FF",
  },
  {
    n: "02",
    icon: MessageSquare,
    title: "Book & chat before you meet",
    body: "Message your companion, ask questions, align on plans. Payment is held safely in escrow, released only after you meet.",
    color: "#7A4FE0",
    bg: "#F0EBFF",
  },
  {
    n: "03",
    icon: MapPin,
    title: "Meet in a public place",
    body: "All first meetings happen in public. In-app SOS and live-share are active the moment you check in.",
    color: "#1FAE6B",
    bg: "#E6F5EE",
  },
  {
    n: "04",
    icon: Star,
    title: "Enjoy & rate honestly",
    body: "Live the experience. Honest ratings keep the community excellent for everyone, members and companions alike.",
    color: "#FFB23E",
    bg: "#FFF8EC",
  },
] as const;

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const Icon = step.icon;
  return (
    <Reveal delay={index * 0.12}>
      <motion.div
        whileHover={{ y: -6, boxShadow: `0 20px 48px -12px ${step.color}28` }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col rounded-2xl p-7 h-full"
        style={{
          background: step.bg,
          border: `1.5px solid ${step.color}22`,
        }}
      >
        {/* Step number */}
        <span
          className="font-display font-bold text-5xl leading-none mb-5 select-none"
          style={{ color: `${step.color}30` }}
          aria-hidden="true"
        >
          {step.n}
        </span>

        {/* Icon */}
        <span
          className="flex items-center justify-center w-12 h-12 rounded-xl mb-5"
          style={{ background: `${step.color}18` }}
          aria-hidden="true"
        >
          <Icon size={22} strokeWidth={1.8} style={{ color: step.color }} />
        </span>

        <h3
          className="font-sans font-bold text-h3 mb-3 leading-snug"
          style={{ color: "var(--color-ink)" }}
        >
          {step.title}
        </h3>
        <p className="font-sans text-base leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
          {step.body}
        </p>
      </motion.div>
    </Reveal>
  );
}

export function ProcessSection() {
  return (
    <section
      className="py-24 md:py-32"
      style={{ background: "var(--color-bg)" }}
      aria-labelledby="process-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <RevealGroup className="mb-16">
          <Reveal>
            <p className="label-eyebrow mb-4" style={{ color: "var(--color-azure)" }}>
              How it works
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              id="process-heading"
              className="font-display text-h1 leading-tight tracking-tight max-w-2xl mb-5"
              style={{ color: "var(--color-ink)" }}
            >
              From browse to belonging in{" "}
              <em className="not-italic" style={{ color: "var(--color-azure)" }}>
                four smooth steps.
              </em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-lead max-w-xl" style={{ color: "var(--color-ink-muted)" }}>
              Companio is designed to be frictionless, transparent, and safe at every step.
            </p>
          </Reveal>
        </RevealGroup>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <StepCard key={step.n} step={step} index={i} />
          ))}
        </div>

        {/* Connector line — desktop only, decorative */}
        <div
          aria-hidden="true"
          className="hidden lg:flex items-center gap-2 mt-8 px-7"
        >
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center flex-1">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: step.color }} />
              {i < STEPS.length - 1 && STEPS[i + 1] && (
                <div className="flex-1 h-px mx-2" style={{ background: `linear-gradient(to right, ${step.color}60, ${STEPS[i + 1]!.color}60)` }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  MapPin,
  Dumbbell,
  Coffee,
  Music,
  Compass,
  Users,
} from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { spring, durations } from "@/lib/motion";

const TRUST_ITEMS = [
  "ID-verified",
  "Background-checked",
  "₹ held in escrow",
] as const;

const ACTIVITY_CARDS = [
  { icon: MapPin,    label: "City Walk",    detail: "Mumbai · 2 hrs",    color: "#2E6BFF", bg: "#EBF1FF", col: "left" },
  { icon: Dumbbell,  label: "Gym Buddy",    detail: "Session · 1.5 hrs", color: "#7A4FE0", bg: "#F0EBFF", col: "right" },
  { icon: Coffee,    label: "Café Chat",    detail: "Bengaluru · 1 hr",  color: "#FFB23E", bg: "#FFF8EC", col: "left" },
  { icon: Music,     label: "Live Concert", detail: "Delhi · Evening",   color: "#1FAE6B", bg: "#E6F5EE", col: "right" },
  { icon: Compass,   label: "Museum Tour",  detail: "Kolkata · 3 hrs",   color: "#2E6BFF", bg: "#EBF1FF", col: "left" },
  { icon: Users,     label: "Group Outing", detail: "Pune · Weekend",    color: "#7A4FE0", bg: "#F0EBFF", col: "right" },
] as const;

const FLOAT_OFFSETS = [0, 1.2, 2.4, 0.6, 1.8, 3.0];

function ActivityCard({
  card,
  floatPhase,
  delay,
}: {
  card: (typeof ACTIVITY_CARDS)[number];
  floatPhase: number;
  delay: number;
}) {
  const shouldReduce = useReducedMotion();
  const Icon = card.icon;

  return (
    <motion.div
      /*
       * Entrance: framer-motion handles opacity+scale+y (one-shot, no perf cost).
       * Float: CSS `translate` property (independent of framer's `transform`) runs
       * forever via companio-hero-float keyframe. Starting the float AFTER the
       * entrance (delay + 0.9s) ensures no overlap. floatPhase staggers the cards.
       * prefers-reduced-motion in globals.css kills the CSS animation automatically.
       */
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...spring.soft, delay }}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg w-52 select-none"
      style={{
        background: card.bg,
        border: `1.5px solid ${card.color}22`,
        boxShadow: `0 8px 24px -8px ${card.color}33`,
        // `translate` property is independent of framer-motion's `transform` —
        // the compositor combines them without conflict.
        animation: shouldReduce
          ? 'none'
          : `companio-hero-float 3.6s ease-in-out ${delay + 0.9 + floatPhase}s infinite`,
      }}
    >
      <span
        className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
        style={{ background: `${card.color}18` }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={1.8} style={{ color: card.color }} />
      </span>
      <div>
        <p className="font-sans font-semibold text-sm leading-tight" style={{ color: "var(--color-ink)" }}>
          {card.label}
        </p>
        <p className="font-sans text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
          {card.detail}
        </p>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "var(--grad-hero-bg)" }}
      aria-labelledby="hero-heading"
    >
      {/* Ambient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl" style={{ background: "var(--color-azure)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "var(--color-violet)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/3 w-72 h-72 rounded-full opacity-10 blur-2xl" style={{ background: "var(--color-gold)" }} />

      <div className="max-w-7xl mx-auto px-6 py-28 md:py-32 w-full grid md:grid-cols-2 gap-16 items-center">
        {/* Left: text */}
        <div>
          <motion.p
            className="label-eyebrow mb-4"
            style={{ color: "var(--color-azure)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.08 }}
          >
            Trusted · Verified · Always Platonic
          </motion.p>

          <motion.h1
            id="hero-heading"
            className="font-display text-display leading-[1.04] tracking-tight mb-6"
            style={{ color: "var(--color-ink)" }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.18 }}
          >
            Real company for{" "}
            <em
              className="not-italic"
              style={{ background: "var(--grad-aurora)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              everything better
            </em>{" "}
            with someone.
          </motion.h1>

          <motion.p
            className="text-lead mb-8 max-w-md"
            style={{ color: "var(--color-ink-muted)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.3 }}
          >
            Connect with ID-verified companions for city walks, gym sessions, café chats, events, and more. Warm, caring, strictly platonic.
          </motion.p>

          <motion.div
            className="flex items-center gap-4 flex-wrap mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.42 }}
          >
            <MagneticButton>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center h-13 px-8 rounded-pill font-sans font-bold text-base text-white transition-all focus-visible:outline-white"
                style={{ background: "var(--grad-cta)", boxShadow: "var(--glow-azure)" }}
              >
                Find a companion
              </Link>
            </MagneticButton>
            <Link
              href="/how-it-works"
              className="inline-flex items-center h-13 px-5 rounded-pill font-sans font-semibold text-base transition-colors hover:underline underline-offset-4 focus-visible:outline-azure"
              style={{ color: "var(--color-ink-muted)" }}
            >
              How it works →
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: durations.slow, delay: 0.56 }}
          >
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm font-sans" style={{ color: "var(--color-emerald)" }}>
                <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden="true" />
                {item}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-sm font-sans" style={{ color: "var(--color-emerald)" }}>
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--color-emerald)" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--color-emerald)" }} />
              </span>
              840+ meetups this week
            </span>
          </motion.div>
        </div>

        {/* Right: floating activity cards */}
        <div className="hidden md:flex flex-col gap-5 items-center" aria-hidden="true">
          <div className="flex gap-6 justify-center">
            {ACTIVITY_CARDS.slice(0, 2).map((card, i) => (
              <ActivityCard key={card.label} card={card} floatPhase={FLOAT_OFFSETS[i]} delay={0.5 + i * 0.1} />
            ))}
          </div>
          <div className="flex gap-6 justify-center -ml-8">
            {ACTIVITY_CARDS.slice(2, 4).map((card, i) => (
              <ActivityCard key={card.label} card={card} floatPhase={FLOAT_OFFSETS[i + 2]} delay={0.65 + i * 0.1} />
            ))}
          </div>
          <div className="flex gap-6 justify-center">
            {ACTIVITY_CARDS.slice(4, 6).map((card, i) => (
              <ActivityCard key={card.label} card={card} floatPhase={FLOAT_OFFSETS[i + 4]} delay={0.8 + i * 0.1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

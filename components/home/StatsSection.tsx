"use client";

import { Star, BadgeCheck } from "lucide-react";
import { TiltCard } from "@/components/motion/TiltCard";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { StatShowcase } from "@/components/home/StatShowcase";
import { LottiePlayer } from "@/components/motion/LottiePlayer";
import { ClipReveal } from "@/components/journey/ClipReveal";

const REVIEWS = [
  {
    name: "Sneha R.",
    city: "Mumbai",
    text: "I moved to a new city knowing nobody. Companio helped me explore Marine Drive, catch a play, even find a gym partner. Completely safe, completely professional.",
    stars: 5,
  },
  {
    name: "Arjun K.",
    city: "Bengaluru",
    text: "As someone who travels solo for work, having a local companion who genuinely knows the city is invaluable. Zero awkwardness, great conversation.",
    stars: 5,
  },
  {
    name: "Meena T.",
    city: "Delhi",
    text: "My companion Priya took me through the old city lanes I'd never have found alone. The ID verification gave my family peace of mind too.",
    stars: 5,
  },
] as const;

function ReviewCard({ review }: { review: (typeof REVIEWS)[number] }) {
  return (
    <TiltCard className="h-full">
      <div
        className="flex flex-col h-full p-7 rounded-2xl"
        style={{
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-2)",
          border: "1px solid rgba(20,26,46,0.06)",
        }}
      >
        <div className="flex gap-0.5 mb-5" aria-label={`${review.stars} out of 5 stars`}>
          {Array.from({ length: review.stars }).map((_, i) => (
            <Star key={i} size={16} fill="var(--color-gold)" stroke="none" aria-hidden="true" />
          ))}
        </div>
        <p
          className="font-serif italic text-base leading-relaxed flex-1 mb-6"
          style={{ color: "var(--color-ink)" }}
        >
          &ldquo;{review.text}&rdquo;
        </p>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full font-sans font-bold text-sm text-white shrink-0"
            style={{ background: "var(--grad-cta)" }}
            aria-hidden="true"
          >
            {review.name[0]}
          </span>
          <div>
            <p
              className="font-sans font-semibold text-sm leading-tight flex items-center gap-1.5"
              style={{ color: "var(--color-ink)" }}
            >
              {review.name}
              <BadgeCheck size={14} style={{ color: "var(--color-emerald)" }} aria-label="Verified member" />
            </p>
            <p className="font-sans text-xs" style={{ color: "var(--color-ink-muted)" }}>
              {review.city}
            </p>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export function StatsSection() {
  return (
    <section
      className="pt-20 pb-12 md:pt-28 md:pb-16"
      style={{ background: "var(--color-bg)" }}
      aria-labelledby="stats-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header with accent-burst as a decorative counterpoint */}
        <div className="flex items-start justify-between gap-6 mb-16">
          <RevealGroup className="flex-1">
            <Reveal>
              <p className="label-eyebrow mb-4" style={{ color: "var(--color-violet)" }}>
                By the numbers
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <ClipReveal
                id="stats-heading"
                text="A community that keeps growing with purpose."
                accent="growing with purpose."
                accentStyle={{
                  background: "linear-gradient(135deg, #7A4FE0, #2E6BFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                className="font-display text-h1 leading-tight tracking-tight max-w-2xl mb-4"
                style={{ color: "var(--color-ink)" }}
              />
            </Reveal>
          </RevealGroup>
          {/* accent-burst — celebratory spark, 220px, desktop only; mr-14 pulls it away from the right edge */}
          <Reveal delay={0.12} className="hidden md:block shrink-0 self-center mr-14">
            <LottiePlayer
              src="/lottie/accent-burst.json"
              width={220}
              height={220}
              loop
            />
          </Reveal>
        </div>

        {/* StatShowcase — clean, no decorative elements on the cards themselves */}
        <div className="mb-20">
          <StatShowcase />
        </div>

        {/* Reviews */}
        <Reveal>
          <p className="label-eyebrow mb-10 text-center" style={{ color: "var(--color-azure)" }}>
            What members say
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 0.1}>
              <ReviewCard review={review} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="text-center mt-10 font-sans text-sm" style={{ color: "var(--color-ink-muted)" }}>
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{ color: "var(--color-emerald)" }}
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ background: "var(--color-emerald)" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: "var(--color-emerald)" }}
                />
              </span>
              840 meetups this week
            </span>{" "}
, and counting.
          </p>
        </Reveal>

        {/* Chatting animation — restored below the live meetup line */}
        <Reveal delay={0.1} className="flex justify-center mt-6">
          <LottiePlayer src="/lottie/accent-2.json" width={210} height={210} loop />
        </Reveal>
      </div>
    </section>
  );
}

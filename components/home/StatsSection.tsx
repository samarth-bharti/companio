"use client";

import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { StatShowcase } from "@/components/home/StatShowcase";
import { LottiePlayer } from "@/components/motion/LottiePlayer";
import { ClipReveal } from "@/components/journey/ClipReveal";

/**
 * This section carried three testimonials — Sneha R., Arjun K., Meena T. — each
 * with five stars and a green "Verified member" badge. None of those people
 * exist. It also claimed "840 meetups this week", a number that appeared
 * nowhere in any database.
 *
 * Both are gone. A pre-launch product does not have members to quote, and
 * inventing them to look established is the single most corrosive thing a
 * marketplace can do to the trust it is trying to sell. When there are real
 * reviews, they will come from Booking.review rows and carry the reviewer's
 * actual first name.
 */
export function StatsSection() {
  return (
    <section
      className="pt-20 pb-12 md:pt-28 md:pb-16"
      style={{ background: "var(--color-bg)" }}
      aria-labelledby="stats-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-start justify-between gap-6 mb-16">
          <RevealGroup className="flex-1">
            <Reveal>
              <p className="label-eyebrow mb-4" style={{ color: "var(--color-violet)" }}>
                What we promise
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <ClipReveal
                id="stats-heading"
                text="Four commitments, true from day one."
                accent="true from day one."
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
          <Reveal delay={0.12} className="hidden md:block shrink-0 self-center mr-14">
            <LottiePlayer src="/lottie/accent-burst.json" width={220} height={220} loop />
          </Reveal>
        </div>

        <div className="mb-16">
          <StatShowcase />
        </div>

        <Reveal delay={0.15}>
          <p
            className="max-w-2xl mx-auto text-center font-serif italic text-lg leading-relaxed"
            style={{ color: "var(--color-ink-muted)" }}
          >
            Companio is new. We would rather tell you that than borrow someone else&rsquo;s numbers.
            When members start meeting, their reviews will appear here, with their names on them.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="flex justify-center mt-8">
          <LottiePlayer src="/lottie/accent-2.json" width={210} height={210} loop />
        </Reveal>
      </div>
    </section>
  );
}

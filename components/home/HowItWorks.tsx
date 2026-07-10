"use client";

import { useRef } from "react";
import { motion, useTransform } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { useJsScroll } from "@/lib/useJsScroll";
import { Search, ShieldCheck, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TicketStub } from "@/components/ui/TicketStub";
import { Reveal } from "@/components/motion/Reveal";

interface Step {
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  stubLabel: string;
}

const STEPS: Step[] = [
  {
    num: "01",
    icon: Search,
    title: "Browse & pick",
    desc: "Filter by category, city, language, and availability. Read verified reviews.",
    stubLabel: "Browse",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Book safely",
    desc: "Your first two meetings are included. You're never charged to meet.",
    stubLabel: "Book",
  },
  {
    num: "03",
    icon: Star,
    title: "Meet, enjoy, rate",
    desc: "Meet in a public place. After your experience, leave a verified review.",
    stubLabel: "Meet",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useEffectiveReducedMotion();

  const { scrollYProgress } = useJsScroll({
    target: sectionRef,
    offset: ["start 75%", "end 30%"],
  });

  const lineScale = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-surface"
      aria-labelledby="how-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-16">
          <p className="label-eyebrow text-brass-ink mb-3">Process</p>
          <h2 id="how-heading" className="font-display text-h2 text-navy">
            Three stamps to your first meetup.
          </h2>
        </Reveal>

        {/* Desktop: horizontal with animated connecting line */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Brass dotted line that draws on scroll */}
            <div className="absolute top-[52px] left-[17%] right-[17%] h-0 z-0 overflow-visible">
              <motion.div
                style={
                  shouldReduce
                    ? { width: "100%" }
                    : { scaleX: lineScale, transformOrigin: "left center" }
                }
                className="h-0 border-t-2 border-dashed border-brass"
              />
            </div>

            <div className="relative z-10 flex gap-6 items-start">
              {STEPS.map((step, i) => (
                <Reveal key={step.num} delay={i * 0.15} className="flex-1">
                  <TicketStub
                    stub={
                      <span
                        className="font-display text-2xl text-brass-ink font-semibold"
                        aria-hidden="true"
                      >
                        {step.num}
                      </span>
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 flex items-center justify-center rounded-md
                                   bg-azure-tint text-azure shrink-0 mt-0.5"
                      >
                        <step.icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-sans font-bold text-base text-ink mb-1">
                          {step.title}
                        </p>
                        <p className="text-sm font-sans text-ink-muted leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </TicketStub>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: vertical stack, no connecting line */}
        <div className="md:hidden flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.1}>
              <TicketStub
                stub={
                  <span className="font-display text-2xl text-brass-ink font-semibold">
                    {step.num}
                  </span>
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-md
                               bg-azure-tint text-azure shrink-0 mt-0.5"
                  >
                    <step.icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-sans font-bold text-base text-ink mb-1">
                      {step.title}
                    </p>
                    <p className="text-sm font-sans text-ink-muted">{step.desc}</p>
                  </div>
                </div>
              </TicketStub>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

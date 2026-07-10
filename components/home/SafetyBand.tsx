"use client";

import { useEffect, useRef, useState } from "react";
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import {
  Heart, MapPin, Phone, ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Seal } from "@/components/ui/Seal";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";

interface Pillar {
  icon: LucideIcon;
  label: string;
  desc: string;
}

const PILLARS: Pillar[] = [
  { icon: Heart,       label: "Strictly platonic, zero tolerance",  desc: "Anyone who violates our platonic standard is permanently removed." },
  { icon: MapPin,      label: "Public-place meetups",                desc: "All first meetups must be in listed public venues." },
  { icon: Phone,       label: "In-app SOS & live-share",            desc: "Share your live location with a trusted contact from within the app." },
  { icon: ShieldAlert, label: "Report & instant block",             desc: "One tap to report. Instant block while we investigate." },
];

export function SafetyBand() {
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
      className="py-24"
      aria-labelledby="safety-heading"
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Rotating seal crest — CSS spin, paused off-screen. */}
        <Reveal className="flex justify-center mb-10">
          <div
            ref={sealRef}
            style={{
              filter: "drop-shadow(0 0 24px rgba(110,79,163,0.45))",
              animation: shouldReduce ? 'none' : 'companio-seal-spin 32s linear infinite',
              animationPlayState: sealInView ? 'running' : 'paused',
            }}
          >
            <Seal size={96} label="Platonic safety guarantee" />
          </div>
        </Reveal>

        <Reveal className="text-center mb-14">
          <p className="label-eyebrow text-navy mb-3">Safety</p>
          <h2 id="safety-heading" className="font-display text-h2 text-navy">
            Platonic, and we mean it.
          </h2>
          <p className="text-lead text-ink-muted mt-4 max-w-xl mx-auto">
            Companio is for company, not dating. Anyone who breaks that is
            removed. Your safety is the whole product.
          </p>
        </Reveal>

        {/* Safety pillars */}
        <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.label} delay={i * 0.1}>
              <div className="flex items-start gap-4 p-5 rounded-[--radius-md] bg-white/70 backdrop-blur-sm border border-edge/60">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
                  style={{ background: "var(--color-trust-wash)", color: "var(--color-trust)" }}
                >
                  <pillar.icon size={18} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-sans font-bold text-sm text-ink mb-0.5">
                    {pillar.label}
                  </p>
                  <p className="text-sm font-sans text-ink-muted leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </RevealGroup>

        <Reveal className="text-center mt-10">
          <a
            href="/safety"
            className="inline-flex items-center gap-1.5 text-sm font-sans font-semibold
                       text-navy underline underline-offset-4 hover:text-navy-strong
                       transition-colors focus-visible:outline-navy rounded-sm"
          >
            Read our full safety policy
          </a>
        </Reveal>
      </div>
    </section>
  );
}

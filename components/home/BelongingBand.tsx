"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { MagneticButton } from "@/components/motion/MagneticButton";

// Placeholder activity photos — replace with owned platonic photography.
// All images show joyful, platonic human connection: friends, groups, solo exploration.
const PHOTOS = [
  {
    id: "p1",
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80",
    alt: "A group of friends laughing and walking together through a city street",
  },
  {
    id: "p2",
    src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=480&q=80",
    alt: "Two friends sharing a warm, lively conversation over chai at a café",
  },
  {
    id: "p3",
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=480&q=80",
    alt: "People joyfully attending a live cultural event together",
  },
] as const;

const STATS = [
  { value: 12000, suffix: "+", label: "connections made" },
  { value: 47,    suffix: "",  label: "cities active"    },
  { value: 98,    suffix: "%", label: "would recommend"  },
];

export function BelongingBand() {
  return (
    <section
      className="py-24 bg-oat overflow-hidden"
      aria-labelledby="belonging-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* ── Text column ── */}
          <div>
            <Reveal>
              <p className="label-eyebrow text-brass-ink mb-4">The feeling</p>
              <h2
                id="belonging-heading"
                className="font-display text-h2 text-navy leading-tight mb-6"
              >
                Some moments are just{" "}
                <em
                  className="not-italic"
                  style={{ color: "var(--color-azure)" }}
                >
                  better with company.
                </em>
              </h2>
              <p className="text-lead text-ink-muted mb-6 max-w-md leading-relaxed">
                That concert you almost skipped. The gym habit that never stuck
                solo. The city you haven&apos;t explored because you didn&apos;t
                have anyone to go with. Companio puts a warm, trusted person
                beside you, for all of it.
              </p>
              <p className="text-lead text-ink-muted mb-10 max-w-md leading-relaxed">
                No dating. No pressure. Just the simple, life-changing
                feeling of someone in your corner.
              </p>
            </Reveal>

            {/* Stats strip */}
            <RevealGroup className="flex gap-8 flex-wrap mb-10">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.1}>
                  <div>
                    <div className="font-display text-h2 text-navy font-semibold leading-none mb-1">
                      <CountUp value={s.value} suffix={s.suffix} />
                    </div>
                    <p className="text-sm font-sans text-ink-muted">{s.label}</p>
                  </div>
                </Reveal>
              ))}
            </RevealGroup>

            <Reveal delay={0.3}>
              <MagneticButton>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center h-11 px-7
                             rounded-pill font-sans font-semibold text-sm text-white
                             focus-visible:outline-white transition-all"
                  style={{
                    background: "var(--grad-azure-cta)",
                    boxShadow: "var(--glow-azure)",
                  }}
                >
                  Browse companions
                </Link>
              </MagneticButton>
            </Reveal>
          </div>

          {/* ── Photo mosaic ── */}
          <Reveal delay={0.1} className="grid grid-cols-2 gap-3 lg:gap-4">
            {/* Tall left photo spans two rows */}
            <div className="row-span-2 rounded-[--radius-lg] overflow-hidden
                            [box-shadow:var(--shadow-2)] relative" style={{ height: "440px" }}>
              <Image
                src={PHOTOS[0].src}
                alt={PHOTOS[0].alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>

            {/* Two stacked right photos */}
            <div className="flex flex-col gap-3 lg:gap-4" style={{ height: "440px" }}>
              <div className="flex-1 rounded-[--radius-lg] overflow-hidden
                              [box-shadow:var(--shadow-2)] relative">
                <Image
                  src={PHOTOS[1].src}
                  alt={PHOTOS[1].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="flex-1 rounded-[--radius-lg] overflow-hidden
                              [box-shadow:var(--shadow-2)] relative">
                <Image
                  src={PHOTOS[2].src}
                  alt={PHOTOS[2].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}

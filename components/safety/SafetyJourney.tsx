'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { ShieldCheck, Fingerprint, Lock, Siren, Flag } from 'lucide-react';
import { ClipReveal } from '@/components/journey/ClipReveal';
import { Reveal, RevealGroup } from '@/components/motion/Reveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { LottiePlayer } from '@/components/motion/LottiePlayer';
import { CountUp } from '@/components/motion/CountUp';
import { ColorMorphBridge } from '@/components/journey/ColorMorphBridge';
import { Seal } from '@/components/ui/Seal';
import { spring } from '@/lib/motion';

const ACCENT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg,#1FAE6B,#2E6BFF)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

type Pillar = { icon: React.ElementType; title: string; body: string; color: string; id?: string };

const PILLARS: Pillar[] = [
  { icon: Fingerprint, title: 'ID checked, human-reviewed', color: '#2E6BFF',
    body: 'No one lists without uploading a government ID. We check it, confirm the photo and the document are two different images, and a person reviews every application by hand. Automated Aadhaar KYC and background checks are not live yet, and we say so on our Trust page rather than implying otherwise.' },
  { icon: Lock,        title: '7-day refund promise',      color: '#7A4FE0',
    body: "Your first two meetings are included, and you're never charged to meet. Didn't find anyone you'd like to meet? Ask for a full refund within 7 days." },
  { icon: Siren,       title: 'SOS & live-share',          color: '#FFB23E', id: 'sos',
    body: 'One tap activates emergency contact sharing and location broadcast during any active booking.' },
  { icon: ShieldCheck, title: 'Strictly platonic promise', color: '#1FAE6B', id: 'promise',
    body: 'Zero tolerance for any non-platonic conduct. Violations result in an immediate and permanent ban.' },
  { icon: Flag,        title: 'Report & block anytime',    color: '#2E6BFF',
    body: 'Flag any concern during or after a session. Our trust team reviews within 24 hours.' },
];

// "100% Aadhaar-verified companions" was the headline number on the safety page,
// and it was false in both halves: no companion is Aadhaar-verified, and none is
// verified at all. What IS true of every companion is that they submitted a
// government ID and that a human approved them by hand — so that is the number.
const STATS = [
  { value: 100, suffix: '%', prefix: '',  label: 'Companions ID-checked and reviewed by a person' },
  { value: 24,  suffix: 'h', prefix: '',  label: 'Trust-team review window' },
  { value: 0,   suffix: '',  prefix: '',  label: 'Tolerance for non-platonic conduct' },
];

export function SafetyJourney() {
  const shouldReduce = useEffectiveReducedMotion();
  // Track seal visibility so the CSS spin only runs when on-screen.
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
    <>
      {/* ── HERO ── dark panel */}
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{ background: 'var(--grad-dark-panel)' }}
        aria-labelledby="safety-page-heading"
      >
        {/* blur blob */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 w-[640px] h-[640px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2E6BFF 0%, transparent 70%)' }}
        />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <p className="label-eyebrow mb-4" style={{ color: 'var(--color-emerald)' }}>
              Trust &amp; Safety
            </p>
          </Reveal>

          <ClipReveal
            as="h1"
            id="safety-page-heading"
            text="Safety isn't a feature. It's the foundation."
            accent="It's the foundation."
            accentStyle={ACCENT_STYLE}
            className="font-display text-h1 leading-tight tracking-tight mb-6"
            style={{ color: 'var(--color-panel-text)' }}
            delay={0.1}
          />

          <Reveal delay={0.2}>
            <p className="text-lead" style={{ color: 'rgba(244,242,255,0.62)' }}>
              We built every layer of Companio so you can meet confidently, whether it&apos;s your
              first session or your fiftieth.
            </p>
          </Reveal>

          {/* Seal crest + Lottie — side by side, centred */}
          <Reveal delay={0.35} className="flex items-center justify-center gap-8 mt-10">
            {/*
              CSS spin instead of framer-motion repeat:Infinity — the browser
              compositor handles transform-only CSS animations for free.
              animation-play-state:paused when off-screen saves GPU cycles;
              it resumes at the same angle so there's no jump.
              prefers-reduced-motion in globals.css kills it automatically.
            */}
            <div
              ref={sealRef}
              style={{
                display: 'inline-flex',
                animation: shouldReduce ? 'none' : 'companio-seal-spin 32s linear infinite',
                animationPlayState: sealInView ? 'running' : 'paused',
              }}
            >
              <Seal size={64} decorative />
            </div>
            <LottiePlayer src="/lottie/secure-lock.json" width={170} height={170} loop />
          </Reveal>
        </div>
      </section>

      {/* ── SEAM ── dark → light */}
      <ColorMorphBridge from="#14122A" to="#FBFCFF" heightVh={12} />

      {/* ── PILLARS ── */}
      <section className="py-20 md:py-28" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-4xl mx-auto px-6">

          <RevealGroup className="flex flex-col gap-5 mb-14">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 0.09}>
                  <TiltCard maxDeg={5}>
                    <div
                      id={p.id}
                      className="flex items-start gap-5 p-6 rounded-2xl"
                      style={{
                        background: 'var(--color-surface)',
                        border: `1.5px solid ${p.color}22`,
                        boxShadow: 'var(--shadow-1)',
                      }}
                    >
                      {/* Icon chip — stamps in via variant propagation from Reveal */}
                      <motion.span
                        className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 mt-0.5"
                        style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}
                        aria-hidden="true"
                        variants={{
                          hidden:  { scale: 0, opacity: 0 },
                          visible: { scale: 1, opacity: 1,
                            transition: { ...spring.stamp, delay: i * 0.09 + 0.18 } },
                        }}
                      >
                        <Icon size={22} strokeWidth={1.8} style={{ color: p.color }} />
                      </motion.span>

                      <div>
                        <h2
                          className="font-sans font-bold text-h3 mb-2 leading-snug"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          {p.title}
                        </h2>
                        <p
                          className="font-sans text-base leading-relaxed"
                          style={{ color: 'var(--color-ink-muted)' }}
                        >
                          {p.body}
                        </p>
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              );
            })}
          </RevealGroup>

          {/* ── PROOF BAND ── 3 trust stats */}
          <RevealGroup className="grid grid-cols-3 gap-6 mb-14 text-center">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.12}>
                <div className="flex flex-col items-center gap-2">
                  <div style={{ color: 'var(--color-ink)' }}>
                    <CountUp
                      value={s.value}
                      suffix={s.suffix}
                      prefix={s.prefix}
                      className="font-display text-5xl font-bold"
                    />
                  </div>
                  <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </RevealGroup>

          {/* ── CTA ── */}
          <div className="text-center">
            <MagneticButton>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center h-13 px-8 rounded-pill font-sans font-bold text-base text-white transition-all hover:opacity-90 focus-visible:outline-white"
                style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
              >
                Find a companion
              </Link>
            </MagneticButton>
            <Link
              href="/"
              className="block mt-4 font-sans text-sm hover:underline underline-offset-4"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              ← Back to home
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { Search, MessageSquare, MapPin, Star } from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/motion/Reveal';
import { ClipReveal } from '@/components/journey/ClipReveal';
import { TiltCard } from '@/components/motion/TiltCard';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { LottiePlayer } from '@/components/motion/LottiePlayer';
import { useJsScroll } from '@/lib/useJsScroll';
import { spring } from '@/lib/motion';

const STEPS = [
  { n: '01', icon: Search,       title: 'Browse verified companions',   color: '#2E6BFF', bg: '#EBF1FF', lottie: '/lottie/explore-scene.json',
    body: 'Filter by activity, city, and schedule. Every profile is ID-verified and background-checked before going live.' },
  { n: '02', icon: MessageSquare, title: 'Book & chat before you meet', color: '#7A4FE0', bg: '#F0EBFF', lottie: '/lottie/scene-1.json',
    body: 'Message your companion, align on plans, ask any question. Payment is held safely in escrow, released only after you meet.' },
  { n: '03', icon: MapPin,        title: 'Meet in a public place',      color: '#1FAE6B', bg: '#E6F5EE', lottie: '/lottie/hiw-meet.json',
    body: 'All first meetings happen in public. In-app SOS and live-share are active the moment you check in.' },
  { n: '04', icon: Star,          title: 'Enjoy & rate honestly',       color: '#FFB23E', bg: '#FFF8EC', lottie: '/lottie/hiw-rate.json',
    body: 'Live the experience. Honest ratings keep the community excellent for everyone, members and companions alike.' },
];

const ACCENT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg,#2E6BFF,#7A4FE0)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export function HowItWorksJourney() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useJsScroll({ target: stepsRef, offset: ['start 80%', 'end 30%'] });
  const fill = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  return (
    <main id="main-content" className="flex-1 pb-20 md:pb-0">

      {/* Hero */}
      <section
        className="py-24 md:py-32"
        style={{ background: 'var(--grad-hero-bg)' }}
        aria-labelledby="hiw-heading"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <RevealGroup>
            <Reveal>
              <p className="label-eyebrow mb-4" style={{ color: 'var(--color-azure)' }}>
                Simple by design
              </p>
            </Reveal>
            <ClipReveal
              as="h1"
              id="hiw-heading"
              text="From browse to belonging in four smooth steps."
              accent="four smooth steps."
              accentStyle={ACCENT_STYLE}
              className="font-display text-h1 leading-tight tracking-tight mb-6"
              style={{ color: 'var(--color-ink)' }}
              delay={0.08}
            />
            <Reveal delay={0.16}>
              <p className="text-lead max-w-xl mx-auto" style={{ color: 'var(--color-ink-muted)' }}>
                Companio is designed to be frictionless, transparent, and safe at every step.
              </p>
            </Reveal>
          </RevealGroup>
        </div>
      </section>

      {/* Steps spine */}
      <section className="py-20 md:py-28" style={{ background: 'var(--color-bg)' }}>
        <div className="relative max-w-4xl mx-auto px-6">

          {/* Cards + rail wrapper — the rail spans only the steps, never the CTA below. */}
          <div ref={stepsRef} className="relative">
            {/* Scroll-linked progress rail — md+ only, hidden on mobile + reduced-motion via CSS */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
              style={{ background: 'rgba(0,0,0,0.08)' }}
            >
              <motion.div
                style={{
                  scaleY: fill,
                  transformOrigin: 'top',
                  height: '100%',
                  background: 'linear-gradient(to bottom,#2E6BFF,#7A4FE0)',
                }}
              />
            </div>

            {/* Cards — stacked on mobile, alternating left/right on md+ */}
            <div className="flex flex-col gap-10 md:gap-16">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className={i % 2 === 1 ? 'md:w-[46%] md:ml-auto' : 'md:w-[46%]'}>
                  <Reveal delay={i * 0.1}>
                    <TiltCard maxDeg={5}>
                      <div
                        className="flex flex-col rounded-2xl p-7"
                        style={{ background: s.bg, border: `1.5px solid ${s.color}22` }}
                      >
                        {/* Ghost numeral stamps in on viewport entry */}
                        <motion.span
                          aria-hidden="true"
                          className="font-display font-bold leading-none mb-4 select-none block"
                          style={{ fontSize: '4.5rem', color: `${s.color}28` }}
                          initial={{ scale: 0.4, rotate: -10 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          transition={spring.stamp}
                          viewport={{ once: true }}
                        >
                          {s.n}
                        </motion.span>

                        <LottiePlayer src={s.lottie} width={150} height={150} className="mb-4 self-start" />

                        <span
                          className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                          style={{ background: `${s.color}18` }}
                          aria-hidden="true"
                        >
                          <Icon size={22} strokeWidth={1.8} style={{ color: s.color }} />
                        </span>

                        <h2 className="font-sans font-bold text-h3 mb-3 leading-snug" style={{ color: 'var(--color-ink)' }}>
                          {s.title}
                        </h2>
                        <p className="font-sans text-base leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                          {s.body}
                        </p>
                      </div>
                    </TiltCard>
                  </Reveal>
                </div>
              );
            })}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <MagneticButton>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center h-13 px-8 rounded-xl font-sans font-bold text-base text-white transition-all hover:opacity-90 focus-visible:outline-white"
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
    </main>
  );
}

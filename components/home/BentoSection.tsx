'use client';

import { Map, Dumbbell, Calendar, Coffee, Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal, RevealGroup } from '@/components/motion/Reveal';
import { LottiePlayer } from '@/components/motion/LottiePlayer';
import { ClipReveal } from '@/components/journey/ClipReveal';

/**
 * BentoSection — MetaMask-style bento with Spline as the centerpiece.
 *
 * Desktop layout (3-col, explicit CSS Grid placement):
 *   Col 1        Col 2 (Spline, row-span-2)   Col 3
 *   City Guide   ╔══════════════╗              Gym & Running
 *   Events       ║  Spline 3D   ║              Café & Chat
 *   Elder Company (col-span-2)  ╚══════════════╝  City Help
 *
 * sm: 2-col auto-placement. mobile: 1-col.
 * High-five animation moved to PeopleSection (intentional feature spot).
 */

const CARDS = [
  {
    id: 'city-guide',
    label: 'City Guide',
    tagline: 'Explore your city with a local who loves it.',
    icon: Map,
    accent: '#2E6BFF',
    bg: 'linear-gradient(145deg, #D4E4FF 0%, #B8CCFF 100%)',
    textColor: 'var(--color-ink)',
    lgClass: 'lg:col-start-1 lg:row-start-1',
  },
  {
    id: 'gym-running',
    label: 'Gym & Running',
    tagline: 'A partner who shows up.',
    icon: Dumbbell,
    accent: '#7A4FE0',
    bg: 'linear-gradient(145deg, #EDE4FF 0%, #D4C5FF 100%)',
    textColor: 'var(--color-ink)',
    lgClass: 'lg:col-start-3 lg:row-start-1',
  },
  {
    id: 'events',
    label: 'Events',
    tagline: 'Nobody goes alone.',
    icon: Calendar,
    accent: '#B5791F',
    bg: 'linear-gradient(145deg, #FFF0CC 0%, #FFE0A0 100%)',
    textColor: 'var(--color-ink)',
    lgClass: 'lg:col-start-1 lg:row-start-2',
  },
  {
    id: 'cafe-chat',
    label: 'Café & Conversation',
    tagline: 'Great coffee, better company.',
    icon: Coffee,
    accent: '#1FAE6B',
    bg: 'linear-gradient(145deg, #D4F0E4 0%, #B0E8CC 100%)',
    textColor: 'var(--color-ink)',
    lgClass: 'lg:col-start-3 lg:row-start-2',
  },
  {
    id: 'elder-company',
    label: 'Elder Company',
    tagline: 'Warm, patient presence for older adults.',
    icon: Heart,
    accent: '#2E6BFF',
    bg: 'linear-gradient(145deg, #EBF1FF 0%, #CDD8F8 100%)',
    textColor: 'var(--color-ink)',
    lgClass: 'lg:col-start-1 lg:row-start-3 lg:col-span-2',
  },
  {
    id: 'city-help',
    label: 'City Help',
    tagline: 'Navigate errands & new neighbourhoods.',
    icon: Users,
    accent: '#9B7AFF',
    bg: 'linear-gradient(145deg, #14122A 0%, #241E48 100%)',
    textColor: 'var(--color-panel-text)',
    lgClass: 'lg:col-start-3 lg:row-start-3',
  },
] as const;

type Card = (typeof CARDS)[number];

function BentoCard({ card, delay = 0 }: { card: Card; delay?: number }) {
  const Icon = card.icon;
  const isDark = card.id === 'city-help';
  return (
    <Reveal delay={delay} className={card.lgClass}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl p-5 flex flex-col justify-between overflow-hidden h-full"
        style={{ background: card.bg, minHeight: 164 }}
      >
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl mb-3 shrink-0"
          style={{ background: `${card.accent}20` }}
          aria-hidden="true"
        >
          <Icon size={18} style={{ color: card.accent }} strokeWidth={1.8} />
        </span>

        <div>
          <p
            className="font-sans font-bold text-sm leading-snug mb-1"
            style={{ color: card.textColor }}
          >
            {card.label}
          </p>
          <p
            className="font-sans text-xs leading-snug"
            style={{ color: isDark ? 'rgba(244,242,255,0.6)' : 'var(--color-ink-muted)' }}
          >
            {card.tagline}
          </p>
        </div>
      </motion.div>
    </Reveal>
  );
}

export function BentoSection() {
  return (
    <section
      className="pt-24 md:pt-32 pb-12 md:pb-16"
      style={{ background: 'var(--color-bg)' }}
      aria-labelledby="bento-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <RevealGroup className="mb-14">
          <Reveal>
            <p className="label-eyebrow mb-4" style={{ color: 'var(--color-azure)' }}>
              What you can do
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <ClipReveal
              id="bento-heading"
              text="Companion for everything."
              accent="everything."
              accentStyle={{
                background: 'linear-gradient(135deg, #2E6BFF, #7A4FE0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              className="font-display text-h1 leading-tight tracking-tight max-w-2xl mb-4"
              style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}
            />
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-lead max-w-xl" style={{ color: 'var(--color-ink-muted)' }}>
              Six categories, one ID-checked companion. Pick the activity, we handle the rest.
            </p>
          </Reveal>
        </RevealGroup>

        {/* Bento grid — Spline is the centerpiece (col-2, row-span-2 on lg) */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{ gridAutoRows: 'minmax(164px, auto)' }}
        >
          {/* Col 1 / Row 1 */}
          <BentoCard card={CARDS[0]} delay={0} />

          {/* Col 2 / Rows 1–2 — Lottie centerpiece (no box; animation only) */}
          <Reveal className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div
              className="flex items-center justify-center w-full h-full"
              style={{ minHeight: 360 }}
            >
              <LottiePlayer
                src="/lottie/center-scene.json"
                width="100%"
                height="100%"
                style={{ maxWidth: 440, maxHeight: 440, margin: '0 auto' }}
                loop
              />
            </div>
          </Reveal>

          {/* Col 3 / Row 1 */}
          <BentoCard card={CARDS[1]} delay={0.07} />

          {/* Col 1 / Row 2 */}
          <BentoCard card={CARDS[2]} delay={0.07} />

          {/* Col 3 / Row 2 */}
          <BentoCard card={CARDS[3]} delay={0.14} />

          {/* Col 1–2 / Row 3 (wider bottom-left card) */}
          <BentoCard card={CARDS[4]} delay={0.14} />

          {/* Col 3 / Row 3 */}
          <BentoCard card={CARDS[5]} delay={0.21} />
        </div>

        {/* High-five accent — centered at the bottom of the light bento section */}
        <Reveal delay={0.1}>
          <div className="flex flex-col items-center gap-4 mt-12 text-center">
            {/* The high-five is a single beat: play it fast, and restart it the
                moment it enters view so the clap lands with the user's scroll
                rather than seconds after they've arrived. */}
            <LottiePlayer
              src="/lottie/high-five.json"
              width={210}
              height={210}
              speed={1.8}
              restartOnEnter
              aria-hidden
            />
            <div>
              <p
                className="font-display font-semibold leading-snug mb-1"
                style={{
                  fontSize: 'clamp(1.3rem, 0.9rem + 1.6vw, 1.75rem)',
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                Meet. Connect. Celebrate.
              </p>
              <p
                className="font-sans text-sm leading-relaxed"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                Every great activity starts with the right companion.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

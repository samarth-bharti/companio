'use client';

import {
  BookOpen,
  Camera,
  Coffee,
  Dumbbell,
  Footprints,
  Heart,
  Landmark,
  Ticket,
  UtensilsCrossed,
  Sunrise,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Marquee } from '@/components/motion/Marquee';
import { Reveal, RevealGroup } from '@/components/motion/Reveal';
import { ClipReveal } from '@/components/journey/ClipReveal';

/**
 * This marquee used to scroll ten invented people — "Sneha R., Mumbai", each
 * wearing a green "Verified member" badge — under the headline "28,000+ members
 * across India". They were placeholders that shipped, and the badge made them
 * a claim rather than a decoration.
 *
 * The section keeps its shape and its motion, but now scrolls the ten things
 * you can actually book. Those are real: every one maps to an `activities` entry
 * on a live companion profile.
 */
const ACTIVITIES: ReadonlyArray<{
  name: string;
  blurb: string;
  icon: LucideIcon;
  color: string;
}> = [
  { name: 'City Walk',          blurb: 'Learn a neighbourhood on foot',   icon: Footprints,        color: '#2E6BFF' },
  { name: 'Café Chat',          blurb: 'An unhurried hour and a coffee',  icon: Coffee,            color: '#7A4FE0' },
  { name: 'Museum',             blurb: 'Someone to talk about it with',   icon: Landmark,          color: '#FFB23E' },
  { name: 'Gym Buddy',          blurb: 'A reason to actually show up',    icon: Dumbbell,          color: '#1FAE6B' },
  { name: 'Morning Run',        blurb: 'Company for the early start',     icon: Sunrise,           color: '#2E6BFF' },
  { name: 'Street Food Tour',   blurb: 'The stalls locals queue at',      icon: UtensilsCrossed,   color: '#7A4FE0' },
  { name: 'Photography Walk',   blurb: 'Golden hour, better company',     icon: Camera,            color: '#FFB23E' },
  { name: 'Book Browsing',      blurb: 'Bookshops, slowly',               icon: BookOpen,          color: '#1FAE6B' },
  { name: 'Live Events',        blurb: "Don't go to the gig alone",       icon: Ticket,            color: '#2E6BFF' },
  { name: 'Elder Company',      blurb: 'Time with someone who has it',    icon: Heart,             color: '#7A4FE0' },
];

function ActivityCard({ a }: { a: (typeof ACTIVITIES)[number] }) {
  const Icon = a.icon;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0 select-none"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(20,26,46,0.08)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
        style={{ background: `${a.color}18` }}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={1.8} style={{ color: a.color }} />
      </div>

      <div>
        <p className="font-sans font-semibold text-sm leading-tight" style={{ color: 'var(--color-ink)' }}>
          {a.name}
        </p>
        <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
          {a.blurb}
        </p>
      </div>
    </div>
  );
}

export function TrustCarousel() {
  return (
    <section
      className="py-16 md:py-20 overflow-hidden"
      style={{ background: 'var(--color-azure-tint)' }}
      aria-labelledby="trust-carousel-heading"
    >
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <RevealGroup>
          <Reveal>
            <p className="label-eyebrow mb-3" style={{ color: 'var(--color-azure)' }}>
              What you can book
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <ClipReveal
              id="trust-carousel-heading"
              text="Ordinary things, better with company."
              accent="better with company."
              accentStyle={{
                background: 'linear-gradient(135deg, #2E6BFF, #7A4FE0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              className="font-display text-h2 leading-tight tracking-tight"
              style={{ color: 'var(--color-ink)' }}
            />
          </Reveal>
        </RevealGroup>
      </div>

      {/* First row — forward */}
      <Marquee speed={44} className="mb-3">
        {ACTIVITIES.map((a) => (
          <ActivityCard key={a.name + '-a'} a={a} />
        ))}
      </Marquee>

      {/* Second row — actually scrolls the opposite direction for depth */}
      <Marquee speed={38} reverse>
        {[...ACTIVITIES].reverse().map((a) => (
          <ActivityCard key={a.name + '-b'} a={a} />
        ))}
      </Marquee>
    </section>
  );
}

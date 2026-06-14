'use client';

import { BadgeCheck } from 'lucide-react';
import { Marquee } from '@/components/motion/Marquee';
import { Reveal, RevealGroup } from '@/components/motion/Reveal';
import { ClipReveal } from '@/components/journey/ClipReveal';

/** Platonic community members — placeholder names/cities */
const MEMBERS = [
  { name: 'Sneha R.',   city: 'Mumbai',    activity: 'City Walk',    initials: 'SR', color: '#2E6BFF' },
  { name: 'Arjun K.',   city: 'Bengaluru', activity: 'Gym Buddy',    initials: 'AK', color: '#7A4FE0' },
  { name: 'Meena T.',   city: 'Delhi',     activity: 'Museum Tour',  initials: 'MT', color: '#FFB23E' },
  { name: 'Rahul D.',   city: 'Chennai',   activity: 'Hiking Trail', initials: 'RD', color: '#1FAE6B' },
  { name: 'Aisha P.',   city: 'Pune',      activity: 'Café Chat',    initials: 'AP', color: '#2E6BFF' },
  { name: 'Vikram S.',  city: 'Hyderabad', activity: 'Live Events',  initials: 'VS', color: '#7A4FE0' },
  { name: 'Nisha B.',   city: 'Kolkata',   activity: 'Group Outing', initials: 'NB', color: '#FFB23E' },
  { name: 'Dev M.',     city: 'Ahmedabad', activity: 'City Walk',    initials: 'DM', color: '#1FAE6B' },
  { name: 'Ritu V.',    city: 'Jaipur',    activity: 'Heritage Walk',initials: 'RV', color: '#2E6BFF' },
  { name: 'Kabir J.',   city: 'Chandigarh',activity: 'Gym Buddy',   initials: 'KJ', color: '#7A4FE0' },
] as const;

function MemberCard({ m }: { m: (typeof MEMBERS)[number] }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0 select-none"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(20,26,46,0.08)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 font-sans font-bold text-xs text-white"
        style={{ background: m.color }}
        aria-hidden="true"
      >
        {m.initials}
      </div>

      <div>
        <p className="font-sans font-semibold text-sm flex items-center gap-1 leading-tight" style={{ color: 'var(--color-ink)' }}>
          {m.name}
          <BadgeCheck size={12} style={{ color: 'var(--color-emerald)' }} aria-label="Verified member" />
        </p>
        <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
          {m.city} · {m.activity}
        </p>
      </div>
    </div>
  );
}

/**
 * Looping marquee of verified community members.
 * Integrates into the stats/proof area as a social trust signal.
 */
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
              Verified community
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <ClipReveal
              id="trust-carousel-heading"
              text="28,000+ members across India, every one verified."
              accent="every one verified."
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
        {MEMBERS.map((m) => (
          <MemberCard key={m.name + '-a'} m={m} />
        ))}
      </Marquee>

      {/* Second row — actually scrolls the opposite direction for depth */}
      <Marquee speed={38} reverse>
        {[...MEMBERS].reverse().map((m) => (
          <MemberCard key={m.name + '-b'} m={m} />
        ))}
      </Marquee>
    </section>
  );
}

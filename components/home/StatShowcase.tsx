'use client';

import { BadgeCheck, HeartHandshake, ShieldAlert, Undo2 } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';

/**
 * This component used to animate four counters: 28,000+ verified members,
 * 94,000+ meetups, 38 cities, 4.9★ average rating. Not one of those numbers was
 * measured. They were typed. Elsewhere on the same site the figures were 12,000
 * members and 12 cities, which is how you can tell.
 *
 * Companio has not launched. It has no members to count and no meetups to
 * average. What it does have are four commitments that are true on day one and
 * that a visitor can hold us to. Those are worth more than invented traction,
 * and unlike invented traction they are not a misrepresentation under the
 * Consumer Protection Act.
 *
 * If you are re-adding numbers here: read them from the database.
 */
const PROMISES = [
  {
    icon: BadgeCheck,
    headline: 'Government ID',
    label: 'Every companion, verified',
    sub: 'No profile goes live until an ID check clears.',
    color: 'var(--color-azure)',
    bg: '#EBF1FF',
    border: 'rgba(46,107,255,0.2)',
  },
  {
    icon: HeartHandshake,
    headline: 'Strictly platonic',
    label: 'Companionship, nothing else',
    sub: 'A single, published rule. Breaking it ends the account.',
    color: 'var(--color-violet)',
    bg: '#F0EBFF',
    border: 'rgba(122,79,224,0.2)',
  },
  {
    icon: ShieldAlert,
    headline: 'SOS built in',
    label: 'Live location, one tap',
    sub: 'Share your meetup with someone you trust, free.',
    color: 'var(--color-gold)',
    bg: '#FFF8EC',
    border: 'rgba(255,178,62,0.25)',
  },
  {
    icon: Undo2,
    headline: '7 days',
    label: 'Full refund, no questions',
    sub: "Didn't find anyone you'd like to meet? Take your ₹199 back.",
    color: 'var(--color-emerald)',
    bg: '#E6F5EE',
    border: 'rgba(31,174,107,0.2)',
  },
] as const;

export function StatShowcase() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {PROMISES.map((s, i) => {
        const Icon = s.icon;
        return (
          <Reveal key={s.label} delay={i * 0.08}>
            <div
              className="flex flex-col p-6 rounded-2xl h-full"
              style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
            >
              <span
                className="flex items-center justify-center w-10 h-10 rounded-xl mb-5 shrink-0"
                style={{ background: `${s.color}18` }}
                aria-hidden="true"
              >
                <Icon size={18} strokeWidth={1.8} style={{ color: s.color }} />
              </span>

              <p
                className="font-display font-bold leading-none mb-2"
                style={{ fontSize: 'clamp(1.5rem,2.4vw,2rem)', color: s.color }}
              >
                {s.headline}
              </p>

              <p className="font-sans font-bold text-sm leading-snug mb-1" style={{ color: 'var(--color-ink)' }}>
                {s.label}
              </p>
              <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                {s.sub}
              </p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

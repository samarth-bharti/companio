'use client';

import { Users, CalendarCheck, MapPin, Star } from 'lucide-react';
import { CountUp } from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';

const STATS = [
  {
    icon: Users,
    value: 28000,
    suffix: '+',
    label: 'Verified members',
    sub: 'KYC verified',
    color: 'var(--color-azure)',
    bg: '#EBF1FF',
    border: 'rgba(46,107,255,0.2)',
  },
  {
    icon: CalendarCheck,
    value: 94000,
    suffix: '+',
    label: 'Meetups completed',
    sub: 'Across 38 cities',
    color: 'var(--color-violet)',
    bg: '#F0EBFF',
    border: 'rgba(122,79,224,0.2)',
  },
  {
    icon: MapPin,
    value: 38,
    suffix: '',
    label: 'Cities',
    sub: 'Pan-India presence',
    color: 'var(--color-gold)',
    bg: '#FFF8EC',
    border: 'rgba(255,178,62,0.25)',
  },
  {
    icon: Star,
    value: 49,
    suffix: '',
    label: 'Avg rating (out of 5)',
    sub: '4.9 ★ from real members',
    color: 'var(--color-emerald)',
    bg: '#E6F5EE',
    border: 'rgba(31,174,107,0.2)',
  },
] as const;

/**
 * Visual stat showcase with large gradient numbers.
 * Replaces the simpler stat cards in StatsSection.
 */
export function StatShowcase() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {STATS.map((s, i) => {
        const Icon = s.icon;
        // For the rating we display 4.9, but CountUp works on integers — show as 49 → divide
        const displayValue = s.label.startsWith('Avg') ? 4.9 : s.value;

        return (
          <Reveal key={s.label} delay={i * 0.08}>
            <div
              className="flex flex-col p-6 rounded-2xl h-full"
              style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
            >
              {/* Icon */}
              <span
                className="flex items-center justify-center w-10 h-10 rounded-xl mb-5 shrink-0"
                style={{ background: `${s.color}18` }}
                aria-hidden="true"
              >
                <Icon size={18} strokeWidth={1.8} style={{ color: s.color }} />
              </span>

              {/* Big number */}
              <p
                className="font-display font-bold leading-none mb-2"
                style={{ fontSize: 'clamp(2.25rem,4vw,3rem)', color: s.color }}
                aria-label={`${displayValue}${s.suffix} ${s.label}`}
              >
                {s.label.startsWith('Avg') ? (
                  <span>4.9★</span>
                ) : (
                  <CountUp value={s.value} suffix={s.suffix} duration={2.2} />
                )}
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

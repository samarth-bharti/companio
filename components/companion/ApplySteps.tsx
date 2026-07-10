'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';

const STEPS = [
  {
    num: '01',
    title: 'Apply',
    body: 'Fill in your name, city, activities you enjoy, and set your own rate. Takes about 5 minutes.',
  },
  {
    num: '02',
    title: 'Verify',
    body: 'Upload a profile photo and government ID. We run ID verification and a background check.',
  },
  {
    num: '03',
    title: 'Build your profile',
    body: "Add your favourite spots, write a warm intro, and let members know what a meetup with you feels like.",
  },
  {
    num: '04',
    title: 'Go live',
    body: 'Once approved, your profile appears in your city. Accept bookings whenever it suits you.',
  },
] as const;

export function ApplySteps() {
  const reduced = useEffectiveReducedMotion();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.num}
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1.5px solid rgba(46,107,255,0.12)',
            backdropFilter: 'blur(8px)',
            boxShadow: 'var(--shadow-1)',
          }}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduced ? { duration: 0 } : { ...spring.soft, delay: i * 0.08 }}
        >
          {/* Ghost numeral */}
          <span
            aria-hidden="true"
            className="absolute -bottom-3 -right-2 font-display leading-none select-none pointer-events-none"
            style={{
              fontSize: '5rem',
              color: 'var(--color-azure)',
              opacity: 0.07,
              letterSpacing: '-0.04em',
            }}
          >
            {s.num}
          </span>

          <span
            className="inline-block font-display font-bold mb-4 relative z-10"
            style={{ fontSize: '1.1rem', color: 'var(--color-azure)', letterSpacing: '-0.02em' }}
          >
            {s.num}
          </span>
          <h3
            className="font-sans font-bold text-base mb-2 relative z-10"
            style={{ color: 'var(--color-ink)' }}
          >
            {s.title}
          </h3>
          <p className="font-sans text-sm leading-relaxed relative z-10" style={{ color: 'var(--color-ink-muted)' }}>
            {s.body}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

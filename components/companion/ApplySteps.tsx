'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';

const STEPS = [
  {
    title: 'Apply',
    body: 'Fill in your name, city, activities you enjoy, and set your own rate. Takes about 5 minutes.',
  },
  {
    title: 'Verify',
    body: 'Upload a profile photo and a government ID. A person on our team reviews both before your profile goes live.',
  },
  {
    title: 'Build your profile',
    body: "Add your favourite spots, write a warm intro, and let members know what a meetup with you feels like.",
  },
  {
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
          key={s.title}
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
          {/* The step's actual number, at a legible size. This is a numbered
              list of four steps, so the number carries meaning — unlike the
              7rem watermark that used to sit behind it saying the same thing. */}
          <span
            className="inline-block font-display font-bold mb-4 relative z-10"
            style={{ fontSize: '1.1rem', color: 'var(--color-azure)', letterSpacing: '-0.02em' }}
          >
            {String(i + 1).padStart(2, '0')}
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

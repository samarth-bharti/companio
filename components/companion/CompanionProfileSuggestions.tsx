'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Sparkles } from 'lucide-react';
import { spring, stagger } from '@/lib/motion';

interface Props {
  suggestions: string[];
}

export function CompanionProfileSuggestions({ suggestions }: Props) {
  const reduced = useEffectiveReducedMotion();

  return (
    <section aria-label="What we'd do together">
      <h2
        className="font-sans font-bold text-sm uppercase tracking-widest mb-4"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        What we&apos;d do together
      </h2>

      <motion.ul
        className="space-y-3"
        role="list"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
        initial={reduced ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {suggestions.map((s, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-3 rounded-lg p-4"
            variants={{
              hidden:  { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: spring.soft },
            }}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid rgba(46,107,255,0.10)',
              boxShadow: 'var(--shadow-1)',
            }}
          >
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: 'var(--color-azure-tint)' }}
              aria-hidden="true"
            >
              <Sparkles
                size={13}
                strokeWidth={1.8}
                style={{ color: 'var(--color-azure-deep)' }}
              />
            </span>

            <span
              className="font-sans text-sm leading-relaxed"
              style={{ color: 'var(--color-ink)' }}
            >
              {s}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

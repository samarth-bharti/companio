'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Users, BadgeCheck } from 'lucide-react';
import { spring, stagger } from '@/lib/motion';
import { Reveal } from '@/components/motion/Reveal';
import type { RegFormData } from './RegisterWizard';

interface StepRoleProps {
  role: RegFormData['role'];
  onSelect: (r: 'member' | 'companion') => void;
}

const CARDS = [
  {
    value:  'member'    as const,
    label:  'I want to find a companion',
    sub:    'Browse ID-checked companions for walks, chai, events, and more in your city.',
    Icon:   Users,
  },
  {
    value:  'companion' as const,
    label:  'I want to be a companion',
    sub:    'Share your social energy, meet interesting people, and earn on your own schedule.',
    Icon:   BadgeCheck,
  },
] as const;

export function StepRole({ role, onSelect }: StepRoleProps) {
  const reduced = useEffectiveReducedMotion();

  return (
    <div>
      <Reveal delay={0.08}>
        <div className="text-center mb-8">
          <p className="label-eyebrow mb-3" style={{ color: 'var(--color-azure)' }}>
            Welcome
          </p>
          <h1
            className="font-display text-h2 leading-tight tracking-tight mb-2"
            style={{ color: 'var(--color-ink)' }}
          >
            How will you use Companio?
          </h1>
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            You can change this any time from your profile.
          </p>
        </div>
      </Reveal>

      {/* Stagger container — cards enter on mount */}
      <motion.div
        className="flex flex-col gap-4"
        role="group"
        aria-label="Choose your role"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.default } } }}
        initial={reduced ? false : 'hidden'}
        animate="visible"
      >
        {CARDS.map(({ value, label, sub, Icon }) => {
          const active = role === value;
          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              /* entrance via parent stagger */
              variants={{
                hidden:  { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: spring.soft },
              }}
              /* interactive states */
              whileHover={reduced ? undefined : { scale: 1.01, y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              transition={spring.snappy}
              aria-pressed={active}
              className="flex items-start gap-4 text-left p-5 rounded-2xl w-full"
              style={{
                background:   active ? 'var(--color-azure-tint)' : 'var(--color-bg)',
                border:       active
                  ? '2px solid var(--color-azure)'
                  : '2px solid rgba(20,26,46,0.10)',
                minHeight: 44,
              }}
            >
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: active ? 'var(--color-azure)' : 'rgba(46,107,255,0.10)',
                }}
                aria-hidden="true"
              >
                <Icon
                  size={20}
                  style={{ color: active ? '#fff' : 'var(--color-azure)' }}
                  aria-hidden="true"
                />
              </span>
              <span>
                <span
                  className="block font-sans font-bold text-base mb-1"
                  style={{ color: 'var(--color-ink)' }}
                >
                  {label}
                </span>
                <span className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                  {sub}
                </span>
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <p className="mt-6 text-center font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        Strictly platonic · ID-checked for safety
      </p>
    </div>
  );
}

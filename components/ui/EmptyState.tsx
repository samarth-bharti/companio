'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';

/**
 * One empty state for the whole product. Every "nothing here yet" surface used to
 * be hand-rolled — the notifications tab had a centred title + CTA button, the
 * bookings tab had a bare grey sentence, the companion messages panel had another
 * variant again. Same app, three different empty-state languages. This is the one
 * they all share now.
 *
 * `compact` is for a secondary empty inside a panel that already has a primary one
 * (e.g. "Past" under "Upcoming"): smaller, quieter, usually title-only.
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  /** A small lucide icon, shown in a tinted circle above the title. */
  icon?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({ title, description, action, icon, compact = false }: EmptyStateProps) {
  const reduced = useEffectiveReducedMotion();
  return (
    <div className={compact ? 'py-6 text-center' : 'py-12 text-center'}>
      {icon && (
        <div
          aria-hidden="true"
          className="mx-auto mb-3 flex items-center justify-center rounded-full"
          style={{
            width: compact ? 32 : 44,
            height: compact ? 32 : 44,
            background: 'var(--color-azure-tint)',
            color: 'var(--color-azure-deep)',
          }}
        >
          {icon}
        </div>
      )}
      <p
        className="font-sans text-sm font-semibold"
        style={{ color: 'var(--color-ink)', marginBottom: description || action ? '0.25rem' : 0 }}
      >
        {title}
      </p>
      {description && (
        <p
          className="font-sans text-sm max-w-sm mx-auto"
          style={{ color: 'var(--color-ink-muted)', marginBottom: action ? '1rem' : 0 }}
        >
          {description}
        </p>
      )}
      {action && (
        <motion.a
          href={action.href}
          whileTap={reduced ? {} : { scale: 0.97 }}
          transition={spring.snappy}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-pill text-sm font-semibold text-white"
          style={{ background: 'var(--grad-cta)' }}
        >
          {action.label}
        </motion.a>
      )}
    </div>
  );
}

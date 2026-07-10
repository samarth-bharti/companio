'use client';

import { createContext, useContext } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useRevealInView } from '@/lib/useRevealInView';

// null = standalone Reveal; boolean = the enclosing RevealGroup's revealed state.
const GroupReveal = createContext<boolean | null>(null);

interface RevealProps {
  children: React.ReactNode;
  /** Delay in seconds before this item animates (used for stagger). */
  delay?: number;
  className?: string;
  /** If true (default), only animates once when entering viewport. */
  once?: boolean;
}

interface RevealGroupProps {
  children: React.ReactNode;
  /** Kept for API compatibility; children own their `delay`. */
  staggerDelay?: number;
  className?: string;
}

/**
 * Single reveal: opacity 0→1, y 24→0, spring.soft.
 * Inside a RevealGroup it inherits the group's reveal state (one observer);
 * standalone it self-observes via useRevealInView (bulletproof against the
 * stuck-at-opacity-0 blank-section bug).
 */
export function Reveal({ children, delay = 0, className, once = true }: RevealProps) {
  const shouldReduce = useEffectiveReducedMotion();
  const group = useContext(GroupReveal);
  const inGroup = group !== null;

  // Self-observe only when standalone; in a group, inherit its state.
  const { ref, revealed: self } = useRevealInView<HTMLDivElement>({ once, enabled: !inGroup });
  const revealed = inGroup ? group! : self;

  // `hidden` must NOT depend on shouldReduce: framer's useEffectiveReducedMotion() is
  // false on the server and true on the client's first render, so varying the
  // initial style renders a different `transform` on each side and fails
  // hydration for every reduced-motion visitor. Keep the initial DOM identical
  // and honour the preference purely through the transition — the element then
  // snaps to its composed state with no perceptible motion.
  const variants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduce ? { duration: 0 } : { ...spring.soft, delay },
    },
  };

  return (
    <motion.div
      ref={inGroup ? undefined : ref}
      className={cn(className)}
      variants={variants}
      initial="hidden"
      animate={revealed ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container: wrap several Reveal children to reveal them as one unit.
 * It is the single observer; children inherit `revealed` via context and
 * stagger through their own `delay` props.
 */
export function RevealGroup({ children, className }: RevealGroupProps) {
  const { ref, revealed } = useRevealInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cn(className)}>
      <GroupReveal.Provider value={revealed}>{children}</GroupReveal.Provider>
    </div>
  );
}

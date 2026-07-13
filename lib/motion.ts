import type { Transition } from 'framer-motion';

export const spring = {
  soft:   { type: 'spring', stiffness: 170,  damping: 26 } as Transition,
  snappy: { type: 'spring', stiffness: 380,  damping: 30 } as Transition,
  stamp:  { type: 'spring', stiffness: 520,  damping: 18,  mass: 0.9 } as Transition,
} as const;

/**
 * For keyframe arrays (e.g. a `scale: [1, 1.12, 1]` pop). Springs accept only
 * two keyframes and throw on a third, so a pop must be a tween.
 */
export const pop: Transition = { type: 'tween', duration: 0.26, ease: 'easeOut' };

export const stagger = {
  default: 0.07,
  tight:   0.04,
} as const;

/** Durations in seconds (for use in Framer transition objects). */
export const durations = {
  fast:  0.18,
  base:  0.36,
  slow:  0.64,
  hero:  0.90,
} as const;

/**
 * calm: durations ×0.6, tween-only.
 * Used on transactional screens (booking / payment / wallet)
 * where the reduced kinetic activity lowers cognitive load.
 */
export const calm = {
  fast: { type: 'tween', duration: durations.fast * 0.6 } as Transition,
  base: { type: 'tween', duration: durations.base * 0.6 } as Transition,
  slow: { type: 'tween', duration: durations.slow * 0.6 } as Transition,
} as const;

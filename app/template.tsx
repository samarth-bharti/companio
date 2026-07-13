'use client';

import { motion, type Variants } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { pageVariants } from '@/components/motion/PageTransition';

/**
 * Route-level transition (spec §8.3): every navigation gets the calm enter fade.
 * Next remounts template.tsx per navigation, so `initial` plays on each route
 * change. Lenis still owns scroll (template only wraps content).
 *
 * Reduced motion: the content still starts from the same composed markup, it
 * just arrives instantly (duration 0).
 *
 * IMPORTANT — do NOT branch the markup on `useEffectiveReducedMotion()` here. Framer
 * reads matchMedia on the client's first render but returns false on the
 * server, so `if (reduced) return <>{children}</>` renders a bare fragment on
 * the client against a <motion.div> from the server and blows up hydration for
 * every reduced-motion visitor. Swapping the *variants* keeps the rendered DOM
 * byte-identical on both sides (initial styles are the same) while still
 * honouring the preference.
 */
const reducedVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  enter: { opacity: 1, scale: 1, transition: { duration: 0 } },
};

export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useEffectiveReducedMotion();

  return (
    <motion.div
      variants={reduced ? reducedVariants : pageVariants}
      initial="initial"
      animate="enter"
    >
      {children}
    </motion.div>
  );
}

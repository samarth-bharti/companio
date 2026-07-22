'use client';

import { useEffect, useState } from 'react';

/**
 * True for touch devices and anything narrower than `lg` (1024px).
 *
 * `useIsMobile()` only covers < 768px, which leaves portrait tablets (e.g. an
 * iPad at 820px) driving the desktop scroll-jacked scenes with a thumb — the
 * exact combination those scenes handle worst. Pointer-coarse catches touch
 * laptops and large phones in landscape too.
 *
 * Returns false during SSR and the first client paint (desktop-first default),
 * so it can be used to branch markup without a hydration mismatch.
 */
export function useTouchOrNarrow(): boolean {
  const [match, setMatch] = useState(false);

  useEffect(() => {
    const checkMatch = () => {
      const isNarrow = window.matchMedia('(max-width: 1024px)').matches;
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const hasTouch = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
      
      setMatch(isNarrow || isCoarse || (hasTouch && window.innerWidth <= 1366));
    };

    checkMatch();
    const mq = window.matchMedia('(max-width: 1024px), (pointer: coarse)');
    mq.addEventListener?.('change', checkMatch);
    window.addEventListener('resize', checkMatch);
    return () => {
      mq.removeEventListener?.('change', checkMatch);
      window.removeEventListener('resize', checkMatch);
    };
  }, []);

  return match;
}

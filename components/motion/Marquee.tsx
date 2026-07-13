'use client';

import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: React.ReactNode;
  /** Seconds for one full pass. Lower = faster. Default: 40. */
  speed?: number;
  /** Scroll right-to-left (default) or, when true, left-to-right. */
  reverse?: boolean;
  className?: string;
}

/**
 * Horizontal infinite marquee with fade-edge mask.
 * Pauses only when prefers-reduced-motion is set — hover no longer pauses it,
 * which matches the expected UX and avoids a jarring stop mid-glide.
 * Uses CSS animation (not Framer) so it is GPU-composited with no JS per-frame cost.
 */
export function Marquee({ children, speed = 40, reverse = false, className }: MarqueeProps) {
  // SSR-safe: framer's useReducedMotion() is false on the server but true on the
  // client's first render, so the inline `animation` style differs across the
  // boundary and fails hydration. This hook returns false until mounted.
  const shouldReduce = useEffectiveReducedMotion();

  return (
    <div
      className={cn('overflow-hidden', className)}
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      <div
        className="flex w-max"
        style={{
          animation: shouldReduce
            ? 'none'
            : `companio-marquee ${speed}s linear infinite${reverse ? ' reverse' : ''}`,
          willChange: shouldReduce ? 'auto' : 'transform',
        }}
      >
        <span className="flex shrink-0" style={{ gap: '2rem', paddingInlineEnd: '2rem' }}>{children}</span>
        <span className="flex shrink-0" aria-hidden="true" style={{ gap: '2rem', paddingInlineEnd: '2rem' }}>{children}</span>
      </div>

      <style>{`
        @keyframes companio-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

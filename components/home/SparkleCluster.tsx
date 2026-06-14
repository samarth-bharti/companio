import type { CSSProperties } from 'react';

/**
 * Decorative sparkle cluster anchored to the video's bottom-right corner.
 * Purpose: camouflage the generated video's corner watermark (a white 4-point
 * sparkle) by surrounding it with several brand-coloured sparkles so it reads
 * as intentional decoration. Positions are tuned to the watermark's spot.
 */
const SPARKLE_PATH =
  'M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z';

const SPARKLES: { size: number; bottom: number; right: number; color: string; delay: number; base: number }[] = [
  { size: 40, bottom: 70, right: 28, color: 'rgba(255,255,255,0.97)', delay: 0, base: 0.97 }, // covers the watermark
  { size: 20, bottom: 112, right: 62, color: 'var(--color-gold)', delay: 0.7, base: 0.9 },
  { size: 16, bottom: 52, right: 80, color: 'var(--color-violet)', delay: 1.2, base: 0.9 },
  { size: 18, bottom: 30, right: 14, color: 'var(--color-azure)', delay: 0.35, base: 0.9 },
  { size: 13, bottom: 104, right: 8, color: 'rgba(255,255,255,0.85)', delay: 1.6, base: 0.85 },
  { size: 12, bottom: 140, right: 38, color: 'var(--color-gold)', delay: 1.0, base: 0.85 },
  { size: 11, bottom: 36, right: 54, color: 'rgba(255,255,255,0.8)', delay: 0.9, base: 0.8 },
];

export function SparkleCluster() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 z-20" style={{ width: 180, height: 190 }}>
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          width={s.size}
          height={s.size}
          viewBox="0 0 24 24"
          className="absolute"
          style={
            {
              bottom: s.bottom,
              right: s.right,
              color: s.color,
              opacity: s.base,
              transformOrigin: 'center',
              animation: `companio-twinkle 3.2s ${s.delay}s ease-in-out infinite`,
              filter: 'drop-shadow(0 1px 3px rgba(20,18,42,0.25))',
            } as CSSProperties
          }
        >
          <path d={SPARKLE_PATH} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

'use client';

import { Marquee } from '@/components/motion/Marquee';

const ITEMS = [
  '☕ Café Chat',
  '🏃 Morning Run',
  '🚶 Bandra walks',
  '📚 Book cafés',
  '📸 Photography walk',
  '🎶 Live events',
  '🥘 Street-food trail',
  '🏔️ Weekend trek',
  '♟️ Board games',
  '🖼️ Museum afternoon',
];

/**
 * A thin trending-activities marquee strip shown below the Explore header.
 * Purely cosmetic; reduced-motion safe (Marquee handles pause).
 */
export function ActivityTicker() {
  return (
    <div
      className="py-2"
      style={{
        background: 'rgba(46,107,255,0.03)',
        borderBottom: '1px solid rgba(46,107,255,0.07)',
      }}
      aria-hidden="true"
    >
      <Marquee speed={36}>
        {ITEMS.map((item) => (
          <span
            key={item}
            className="text-xs font-medium whitespace-nowrap"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            {item}
          </span>
        ))}
      </Marquee>
    </div>
  );
}

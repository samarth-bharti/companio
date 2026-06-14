'use client';

import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Gradient text that brightens within a radius of the cursor on hover.
 * Base fill is the brand aurora gradient; a white radial highlight tracks the
 * pointer (position via --mx/--my) and its strength is gated by --spot (0 at
 * rest, 1 while hovering), so the text "lights up" only near the cursor.
 */
export function SpotlightText({
  children,
  className,
  radius = 150,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
    el.style.setProperty('--spot', '1');
  };
  const onLeave = () => ref.current?.style.setProperty('--spot', '0');

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={
        {
          backgroundImage: `radial-gradient(${radius}px circle at var(--mx, -200px) var(--my, -200px), rgba(255,178,62,calc(1 * var(--spot, 0))) 0%, rgba(255,178,62,calc(0.55 * var(--spot, 0))) 35%, rgba(255,178,62,0) 70%), var(--grad-aurora)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        } as CSSProperties
      }
    >
      {children}
    </span>
  );
}

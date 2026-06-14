'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { CSSProperties } from 'react';

/**
 * happn-style hero cursor trail: as the pointer moves across the hero, realistic
 * 3D activity stickers (Fluent 3D emoji, in /public/stickers) pop in at the
 * cursor, float up, drift and blur-fade out.
 *
 * - Mounts an inset-0, pointer-events-none layer so it never blocks the CTAs.
 *   The pointermove listener is attached to the PARENT (the sticky hero
 *   container) so movement is captured even over interactive children.
 * - Desktop-only: gated on `(pointer: fine)`. Reduced-motion: renders nothing.
 * - Spawn is distance-throttled and hard-capped; each sticker animates via the
 *   GPU-composited `companio-sticker` keyframe and removes itself onAnimationEnd.
 */

type Sticker = { id: number; x: number; y: number; src: string; dx: number; rot: number };

// Realistic 3D stickers themed to Companio meetups (café chats, walks, museums…).
const STICKERS = [
  '/stickers/coffee.png',
  '/stickers/cake.png',
  '/stickers/watch.png',
  '/stickers/camera.png',
  '/stickers/books.png',
  '/stickers/palette.png',
  '/stickers/music.png',
  '/stickers/museum.png',
  '/stickers/croissant.png',
  '/stickers/sunrise.png',
  '/stickers/tea.png',
  '/stickers/theatre.png',
];

const SPAWN_DISTANCE = 300; // px of cursor travel between stickers (lower density)
const MAX_STICKERS = 12; // safety cap on concurrent DOM nodes
const SIZE = 200; // px

export function CursorStickers() {
  const shouldReduce = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const last = useRef({ x: 0, y: 0, seeded: false });
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setStickers((s) => s.filter((k) => k.id !== id));
  }, []);

  useEffect(() => {
    if (shouldReduce) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const host = layerRef.current?.parentElement;
    if (!host) return;

    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // First sample just seeds the origin so we don't spawn a sticker on entry.
      if (!last.current.seeded) {
        last.current = { x, y, seeded: true };
        return;
      }
      if (Math.hypot(x - last.current.x, y - last.current.y) < SPAWN_DISTANCE) return;
      last.current = { x, y, seeded: true };

      const id = idRef.current++;
      // Math.random in an event handler is fine (not in render → no hydration risk).
      const sticker: Sticker = {
        id,
        x,
        y,
        src: STICKERS[id % STICKERS.length],
        dx: (Math.random() * 2 - 1) * 36, // horizontal drift
        rot: (Math.random() * 2 - 1) * 22, // final tilt
      };
      setStickers((s) => {
        const next = [...s, sticker];
        return next.length > MAX_STICKERS ? next.slice(next.length - MAX_STICKERS) : next;
      });
    };

    host.addEventListener('pointermove', onMove, { passive: true });
    return () => host.removeEventListener('pointermove', onMove);
  }, [shouldReduce]);

  if (shouldReduce) return null;

  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {stickers.map((s) => (
        <img
          key={s.id}
          src={s.src}
          alt=""
          draggable={false}
          onAnimationEnd={() => remove(s.id)}
          className="absolute select-none"
          style={
            {
              left: s.x,
              top: s.y,
              width: SIZE,
              height: SIZE,
              '--dx': `${s.dx}px`,
              '--rot': `${s.rot}deg`,
              // 2.4s lifetime: slow blur fade-in -> float -> slow blur fade-out, then removed onAnimationEnd.
              animation: 'companio-sticker 2400ms var(--ease-enter) forwards',
              willChange: 'transform, opacity, filter',
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

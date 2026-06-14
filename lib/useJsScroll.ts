'use client';

import { useEffect, useState } from 'react';
import { useScroll } from 'framer-motion';

type UseScrollOptions = NonNullable<Parameters<typeof useScroll>[0]>;

/**
 * useScroll, forced onto the JS update path.
 *
 * framer-motion 12 promotes scroll-linked opacity/transform to native WAAPI
 * ScrollTimeline/ViewTimeline animations when supported. For targets inside
 * `position: sticky` containers (our 250vh/520vh journey sections) the
 * ViewTimeline range mapping desyncs from the JS scrollYProgress — opacity
 * freezes at stale values while derived values stay correct.
 *
 * Stripping the internal `accelerate` config before motion components consume
 * the values prevents the WAAPI promotion entirely; everything runs on the
 * classic per-frame JS pipeline, which tracks correctly (including with Lenis).
 */
export function useJsScroll(options?: UseScrollOptions) {
  // Withhold the `target` ref until after mount. framer-motion's useScroll
  // measures the target during the initial (pre-hydration) render, when the
  // ref'd element isn't attached yet — that triggers the recoverable
  // "Target ref is defined but not hydrated" warning. Once mounted, the
  // element has hydrated, so attaching the target is safe.
  // (Targetless useScroll tracks the viewport, which is harmless for the brief
  // pre-mount window since journey sections start at scroll progress 0.)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const values = useScroll(mounted ? options : undefined);
  // `accelerate` is internal — not in the public MotionValue type.
  (values.scrollXProgress as unknown as { accelerate?: unknown }).accelerate = undefined;
  (values.scrollYProgress as unknown as { accelerate?: unknown }).accelerate = undefined;
  return values;
}

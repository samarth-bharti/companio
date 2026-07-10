'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { cn } from '@/lib/utils';
import { useRevealInView } from '@/lib/useRevealInView';

export interface ClipRevealProps {
  /** The full heading as plain words. Becomes the aria-label on the root element. */
  text: string;
  /** Substring of `text` whose words receive `accentStyle`. */
  accent?: string;
  /** e.g. aurora gradient-text styles applied to accent words via inline style. */
  accentStyle?: React.CSSProperties;
  /** Root element tag. Default: 'h2'. */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  /** Seconds before the first word animates. Default: 0. */
  delay?: number;
  id?: string;
}

/** Matches --ease-enter: cubic-bezier(0.16, 1, 0.30, 1). */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * ClipReveal — word-level clip-mask heading reveal.
 *
 * Each word is placed inside an `overflow-hidden` outer span; the inner
 * motion.span slides from y=110% → 0% so words rise from a clipping boundary.
 * Words that fall inside the `accent` substring receive `accentStyle`
 * (e.g. gradient-text treatment).
 *
 * Reduced motion: words render statically in their final position — no
 * transforms, no stagger; content is fully readable immediately.
 *
 * Accessibility: the root heading carries `aria-label={text}` for screen
 * readers; individual word spans are aria-hidden to prevent fragmented reading.
 */
export function ClipReveal({
  text,
  accent,
  accentStyle,
  as: Tag = 'h2',
  className,
  style,
  delay = 0,
  id,
}: ClipRevealProps) {
  // SSR-safe: framer's useReducedMotion() is false on the server but true on the
  // client's first render, so branching markup on it fails hydration. This hook
  // returns false until mounted.
  const shouldReduce = useEffectiveReducedMotion();
  // One root trigger for the whole heading (the unclipped root always has size,
  // so it reveals reliably — no per-word 50%-visible requirement that could
  // leave a last-on-page heading stuck hidden).
  const { ref, revealed } = useRevealInView<HTMLElement>({ amount: 'some' });

  const words = text.split(' ');

  // Locate the accent substring by character position so we can identify
  // which words fall within it without relying on string matching per-word.
  const accentStart = accent ? text.indexOf(accent) : -1;
  const accentLen = accent ? accent.length : 0;

  // A word's start = sum of all earlier words' lengths + one space each. Computed
  // functionally (no reassigned accumulator) so the render body stays pure.
  const wordMeta = words.map((word, i) => {
    const start = words.slice(0, i).reduce((n, w) => n + w.length + 1, 0);
    const inAccent =
      accentStart >= 0 && start >= accentStart && start < accentStart + accentLen;
    return { word, inAccent };
  });

  // createElement avoids JSX-level generic typing constraints on dynamic tags.
  return React.createElement(
    Tag,
    { ref, className: cn(className), style, id, 'aria-label': text },
    wordMeta.map(({ word, inAccent }, i) => {
      const innerStyle: React.CSSProperties = {
        // Preserve word spacing without relying on text-space collapsing.
        marginRight: i < words.length - 1 ? '0.25em' : undefined,
        ...(inAccent && accentStyle ? accentStyle : {}),
      };

      if (shouldReduce) {
        // Final state immediately — no overflow clip needed.
        return (
          <span
            key={`${word}-${i}`}
            className="inline-block"
            aria-hidden="true"
            style={innerStyle}
          >
            {word}
          </span>
        );
      }

      // The outer span is the clip box (overflow-hidden); the inner slides from
      // y=120%→0%. Both are driven by the single root `revealed` flag — no
      // per-word observer (which could miss for a fully-clipped or last-on-page
      // word and leave the heading stuck hidden).
      return (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-bottom"
          aria-hidden="true"
          // Tight display line-heights (0.96–1.05) make the clip box smaller
          // than the glyphs — without this padding, descenders (g/y/p) get cut.
          style={{ paddingBottom: '0.14em', marginBottom: '-0.14em' }}
        >
          <motion.span
            className="inline-block"
            style={innerStyle}
            initial={{ y: '120%' }}
            animate={revealed ? { y: '0%' } : { y: '120%' }}
            transition={{ duration: 0.6, ease: EASE, delay: delay + i * 0.03 }}
          >
            {word}
          </motion.span>
        </span>
      );
    })
  );
}

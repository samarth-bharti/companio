'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface RollLinkProps {
  href: string;
  /** Button label. Rendered twice (stacked) to drive the roll on hover. */
  children: string;
  className?: string;
  style?: CSSProperties;
  /** Background shown on hover (the color-change layer). Optional. */
  hoverBackground?: string;
}

const EASE = 'cubic-bezier(0.16, 1, 0.30, 1)';
const DUR = '480ms';

/**
 * happn-style CTA: on hover the background color shifts and the label "scrolls" —
 * the visible copy slides up and out while a duplicate rolls up into its place.
 *
 * The two label copies share identical leading so they align exactly; the
 * wrapper clips with overflow-hidden so only one line is ever visible.
 * Reduced motion is handled globally (transition-duration collapses to ~0),
 * so this degrades to an instant state swap.
 */
export function RollLink({ href, children, className, style, hoverBackground }: RollLinkProps) {
  return (
    <Link
      href={href}
      className={cn('group relative inline-flex items-center justify-center overflow-hidden', className)}
      style={style}
    >
      {hoverBackground && (
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: hoverBackground, transitionDuration: DUR, transitionTimingFunction: EASE }}
        />
      )}
      <span className="relative z-[1] block overflow-hidden leading-[1.15]">
        {/* Visible copy: rolls up and out on hover.
            Uses the `transform` property explicitly (arbitrary classes) so the
            inline `transition: transform` applies — Tailwind's translate-* utilities
            drive the separate `translate` property, which transition-transform
            does NOT animate in v4. */}
        <span
          className="block [transform:translateY(0%)] group-hover:[transform:translateY(-100%)]"
          style={{ transition: `transform ${DUR} ${EASE}` }}
        >
          {children}
        </span>
        {/* Duplicate: starts one line below, rolls up into place on hover */}
        <span
          aria-hidden="true"
          className="absolute inset-0 block leading-[1.15] [transform:translateY(100%)] group-hover:[transform:translateY(0%)]"
          style={{ transition: `transform ${DUR} ${EASE}` }}
        >
          {children}
        </span>
      </span>
    </Link>
  );
}

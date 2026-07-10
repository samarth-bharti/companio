'use client';

import { useRef, useId, useEffect, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { CreditCard, Camera, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useJsScroll } from '@/lib/useJsScroll';
import { Stamp } from '@/components/ui/Stamp';
import type { LucideIcon } from 'lucide-react';

interface Node {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  angle: number;
}

const NODES: Node[] = [
  { icon: CreditCard, label: 'ID', sublabel: 'Government ID linked', angle: -3 },
  { icon: Camera, label: 'Selfie', sublabel: 'Live photo check', angle: 2 },
  { icon: ShieldCheck, label: 'Background', sublabel: 'Safety screening', angle: -2 },
  { icon: CheckCircle2, label: 'Approved', sublabel: 'Profile goes live', angle: 3 },
];

interface Props {
  /**
   * 0-indexed active step. Omit for the informational view (all nodes equal).
   * 0 = ID in-progress; 3 = Approved.
   */
  activeStep?: number;
}

export function VerificationTimeline({ activeStep }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useEffectiveReducedMotion();
  const rawId = useId();
  const gradId = `aurora-vt-${rawId.replace(/:/g, '')}`;
  const [svgHeight, setSvgHeight] = useState(360);

  // Measure container height for the SVG path
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setSvgHeight(entries[0].contentRect.height);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useJsScroll({
    target: containerRef,
    offset: ['start 0.9', 'end 0.5'],
  });
  const drawProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative py-2">
      {/* Aurora thread — drawn via pathLength on scroll */}
      <svg
        aria-hidden="true"
        width={2}
        height={svgHeight}
        style={{ position: 'absolute', left: '28px', top: 0, overflow: 'visible' }}
      >
        <defs>
          <linearGradient
            id={gradId}
            x1="1"
            y1="0"
            x2="1"
            y2={svgHeight}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2E6BFF" />
            <stop offset="50%" stopColor="#7A4FE0" />
            <stop offset="100%" stopColor="#FFB23E" />
          </linearGradient>
        </defs>
        <motion.path
          d={`M 1 16 L 1 ${svgHeight - 16}`}
          stroke={`url(#${gradId})`}
          strokeWidth={2}
          fill="none"
          style={reduced ? {} : { pathLength: drawProgress }}
        />
      </svg>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const isPast = activeStep !== undefined && i < activeStep;
        const isActive = activeStep !== undefined && i === activeStep;
        const isPending = activeStep !== undefined && i > activeStep;

        return (
          <div key={node.label} className="flex items-start gap-5 py-5 pl-[72px] relative">
            <div style={{ opacity: isPending ? 0.35 : 1, transition: 'opacity 0.3s' }}>
              <Stamp
                icon={node.icon}
                label={node.label}
                tone="trust"
                angle={isPast ? 0 : node.angle}
                transitionDelay={i * 0.12}
              />
            </div>
            <div className="pt-1 min-w-0">
              <p className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                {node.label}
                {isActive && (
                  <span
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium"
                    style={{
                      background: 'rgba(46,107,255,0.1)',
                      color: 'var(--color-azure-deep)',
                    }}
                  >
                    In progress
                  </span>
                )}
                {isPast && (
                  <span
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium"
                    style={{ background: 'rgba(31,174,107,0.1)', color: '#157A4A' }}
                  >
                    Done
                  </span>
                )}
              </p>
              <p
                className="font-sans text-xs mt-0.5"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                {node.sublabel}
              </p>
            </div>
          </div>
        );
      })}

      <p className="pl-[72px] mt-2 font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        Usually 2-3 days. You&apos;ll get a notification when each step clears.
      </p>
    </div>
  );
}

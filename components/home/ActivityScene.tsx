'use client';

import Image from 'next/image';
import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

export interface ActivitySceneProps {
  index: number;
  total: number;
  eyebrow: string;
  title: string;
  hook: string;
  photo: { src: string; alt: string };
  chips: string[];
  /** Day-phase gradient string — used as bg in reduced-motion stack mode. */
  gradient: string;
  dark?: boolean;
  /** Full scrollYProgress from parent — drives per-scene entrance. */
  progress?: MotionValue<number>;
  /**
   * Vertical-stack mode (parent decided: reduced motion OR mobile).
   * Must come from the parent — the scene's own useEffectiveReducedMotion() cannot
   * know about the mobile fallback, and the horizontal-mode fallback
   * MotionValue would leave scenes 2–5 stuck at opacity 0.
   */
  stacked?: boolean;
  /** Optional content rendered above the eyebrow (used for intro heading in scene 0). */
  introNode?: React.ReactNode;
}

function FrostedChip({ label, dark }: { label: string; dark: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.3rem 0.75rem',
        borderRadius: 'var(--radius-pill)',
        border: `1.5px solid ${dark ? 'rgba(244,242,255,0.18)' : 'rgba(46,107,255,0.18)'}`,
        background: dark ? 'rgba(30,24,64,0.55)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(6px)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        color: dark ? 'var(--color-panel-text)' : 'var(--color-ink)',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </span>
  );
}

export function ActivityScene({
  index,
  eyebrow,
  title,
  hook,
  photo,
  chips,
  gradient,
  dark = false,
  progress,
  stacked = false,
  introNode,
}: ActivitySceneProps) {
  const shouldReduce = useEffectiveReducedMotion();
  // Fallback MotionValue so hooks are always called unconditionally.
  const fallback = useMotionValue(index === 0 ? 1 : 0);
  const motionSrc = progress ?? fallback;
  // Fade in DURING the arrival pan ([0.2i − 0.1, 0.2i] under the parent's
  // dwell-and-pan mapping), completing just before the scene settles —
  // previously the band started only after the scene was already centered.
  const band0 = Math.max(index * 0.2 - 0.08, 0);
  const band1 = Math.max(index * 0.2 - 0.01, 0);
  const opacity = useTransform(motionSrc, [band0, band1], index === 0 ? [1, 1] : [0, 1]);
  const ty = useTransform(motionSrc, [band0, band1], index === 0 ? [0, 0] : [20, 0]);

  const numeral = String(index + 1).padStart(2, '0');
  // Even indices: text left, photo right. Odd: photo left, text right.
  const photoOnLeft = index % 2 !== 0;
  const ink = dark ? 'var(--color-panel-text)' : 'var(--color-ink)';
  const muted = dark ? 'rgba(244,242,255,0.6)' : 'var(--color-ink-muted)';
  const accent = dark ? 'var(--color-gold)' : 'var(--color-azure)';

  const inner = (
    <div className={cn('flex flex-col md:flex-row h-full', photoOnLeft && 'md:flex-row-reverse')}>
      {/* Text column. overflow-hidden clips the ghost numeral's negative offset:
          without it the numeral pushed ~6px past the viewport and gave the whole
          page a horizontal scrollbar on phones. */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-10 flex-1 relative overflow-hidden">
        {/* Ghost numeral — Fraunces, 8% alpha, absolute behind text */}
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(7rem,13vw,11rem)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            position: 'absolute',
            bottom: '4%',
            right: '-0.05em',
            color: dark ? 'rgba(244,242,255,0.07)' : 'rgba(46,107,255,0.08)',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {numeral}
        </span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {introNode}
          <p className="label-eyebrow mb-3" style={{ color: accent }}>{eyebrow}</p>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h3)',
              letterSpacing: '-0.02em',
              color: ink,
              marginBottom: '0.75rem',
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: 'var(--text-lead)', color: muted, maxWidth: '34ch', marginBottom: '1.5rem' }}>
            {hook}
          </p>
          <p className="label-eyebrow mb-2" style={{ color: muted }}>What you&rsquo;d do</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => <FrostedChip key={c} label={c} dark={dark} />)}
          </div>
        </div>
      </div>

      {/* Photo column */}
      <div className="flex items-center justify-center flex-1 px-8 py-8">
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            aspectRatio: '4/5',
            maxHeight: '60vh',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
            priority={index === 0}
          />
        </div>
      </div>
    </div>
  );

  if (shouldReduce || stacked) {
    return (
      <div
        style={{
          minHeight: '80vh',
          background: gradient,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Reveal>{inner}</Reveal>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen shrink-0 overflow-hidden">
      <motion.div style={{ opacity, y: ty, height: '100%' }}>{inner}</motion.div>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { useJsScroll } from '@/lib/useJsScroll';
import { ActivityScene } from '@/components/home/ActivityScene';
import { ClipReveal } from '@/components/journey/ClipReveal';
import { useIsMobile } from '@/lib/useIsMobile';

const GRADIENTS = [
  'linear-gradient(140deg,#FFF3E0,#FFE0B0)',
  'linear-gradient(140deg,#EBF1FF,#CFE0FF)',
  'linear-gradient(140deg,#FFF8EC,#F3E8D6)',
  'linear-gradient(140deg,#1E1840,#2E1F5E)',
  'linear-gradient(140deg,#FFF3E0,#E6F5EE)',
];

const SCENES = [
  { eyebrow: 'Dawn', title: 'City Walk', hook: 'Start the day with a walk and someone who actually knows the lanes.', photo: { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80', alt: 'Group of friends laughing together on a city street' }, chips: ['Marine Drive loop', 'Cutting chai', 'Old-city lanes'], dark: false },
  { eyebrow: 'Morning', title: 'Gym Buddy', hook: 'The partner who actually shows up. Every time.', photo: { src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80', alt: 'Two people working out together at a gym' }, chips: ['Spotting partner', '5k runs', 'Post-workout smoothie'], dark: false },
  { eyebrow: 'Midday', title: 'Café Chat', hook: 'Two cups of chai, one long conversation. No rush.', photo: { src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80', alt: 'Two friends having an animated conversation at a café' }, chips: ['Filter coffee', 'Book swap', 'People-watching'], dark: false },
  { eyebrow: 'Evening', title: 'Events', hook: "Nobody should skip the gig just because they'd go alone.", photo: { src: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80', alt: 'Friends enjoying a live music concert together' }, chips: ['Live gigs', 'Stand-up nights', 'Theatre'], dark: true },
  { eyebrow: 'Golden hour', title: 'Elder Company', hook: 'An unhurried afternoon. A patient ear. Warm, familiar company.', photo: { src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80', alt: 'Two adults in a warm, supportive conversation across a table' }, chips: ['Park benches', 'Old stories', 'Evening walks'], dark: false },
];

const ACCENT_STYLE: React.CSSProperties = {
  background: 'var(--grad-aurora)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

/** Intro heading lives inside scene 0's text column in both modes. */
const IntroHeading = () => (
  <div style={{ marginBottom: '1.75rem' }}>
    <p className="label-eyebrow mb-2" style={{ color: 'var(--color-gold)' }}>One day, with company</p>
    <ClipReveal
      as="h2"
      id="activity-heading"
      text="From sunrise walk to evening show."
      accent="evening show."
      accentStyle={ACCENT_STYLE}
      className="font-display text-h2 leading-tight tracking-tight"
      style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}
    />
  </div>
);

export function ActivityChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useJsScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  // Horizontal row drive — dwell-and-pan, not a continuous slide.
  // Each scene holds centered for half its 0.2 band, then pans to the next;
  // scene 4 dwells through [0.8, 1] so the chapter ends settled.
  const x = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
    ['0vw', '0vw', '-100vw', '-100vw', '-200vw', '-200vw', '-300vw', '-300vw', '-400vw', '-400vw'],
  );

  // Sun orb — arcs left→right, parabola top. Driven via x/y TRANSFORMS
  // (compositor-only) — animating left/top would trigger layout every frame.
  const orbX = useTransform(scrollYProgress, [0, 1], ['8vw', '90vw']);
  const orbY = useTransform(scrollYProgress, [0, 0.5, 1], ['18vh', '8vh', '18vh']);

  // Crossfading gradient layer opacities — peaks align with each scene's
  // dwell center (0.2i + 0.05) under the dwell-and-pan x mapping above.
  const g0 = useTransform(scrollYProgress, [0.05, 0.25], [1, 0]);
  const g1 = useTransform(scrollYProgress, [0.05, 0.25, 0.45], [0, 1, 0]);
  const g2 = useTransform(scrollYProgress, [0.25, 0.45, 0.65], [0, 1, 0]);
  const g3 = useTransform(scrollYProgress, [0.45, 0.65, 0.85], [0, 1, 0]);
  const g4 = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);
  const gradOpacities = [g0, g1, g2, g3, g4];

  // Reduced motion OR mobile: normal vertical stack, no sticky, no orb,
  // no translateX. (The horizontal scene clips and janks below md.)
  if (shouldReduce || isMobile) {
    return (
      <section aria-labelledby="activity-heading">
        {SCENES.map((scene, i) => (
          <ActivityScene
            key={scene.title}
            index={i}
            total={SCENES.length}
            gradient={GRADIENTS[i]}
            stacked
            introNode={i === 0 ? <IntroHeading /> : undefined}
            {...scene}
          />
        ))}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="activity-heading"
      style={{ height: '520vh', position: 'relative' }}
    >
      {/* ── Sticky viewport ── */}
      <div className="sticky top-0 h-screen overflow-hidden" style={{ background: GRADIENTS[0] }}>

        {/* Five crossfading day-phase gradient layers */}
        {GRADIENTS.map((grad, i) => (
          <motion.div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              background: grad,
              opacity: gradOpacities[i],
              zIndex: 0,
              willChange: 'opacity',
            }}
          />
        ))}

        {/* Sun orb — 28px disc with blur halo, arcs across the top */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            x: orbX,
            y: orbY,
            zIndex: 20,
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        >
          <div style={{ position: 'relative', width: 28, height: 28 }}>
            {/* Blur halo */}
            <div
              style={{
                position: 'absolute', inset: -20,
                borderRadius: '50%',
                background: 'var(--grad-seal)',
                filter: 'blur(12px)',
                opacity: 0.4,
              }}
            />
            {/* Core disc */}
            <div
              style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: 'var(--grad-seal)',
                position: 'relative',
                zIndex: 1,
                boxShadow: 'var(--glow-seal)',
              }}
            />
          </div>
        </motion.div>

        {/* Horizontal row — 500vw, driven by scroll */}
        <motion.div
          style={{
            display: 'flex',
            width: '500vw',
            height: '100%',
            x,
            position: 'relative',
            zIndex: 5,
            willChange: 'transform',
          }}
        >
          {SCENES.map((scene, i) => (
            <ActivityScene
              key={scene.title}
              index={i}
              total={SCENES.length}
              gradient={GRADIENTS[i]}
              progress={scrollYProgress}
              introNode={i === 0 ? <IntroHeading /> : undefined}
              {...scene}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

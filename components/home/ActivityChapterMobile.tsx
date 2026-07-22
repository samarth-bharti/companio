'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { ClipReveal } from '@/components/journey/ClipReveal';
import type { Scene } from '@/components/home/activityScenes';

/**
 * ActivityChapterMobile — the phone rendering of the "one day, with company"
 * chapter.
 *
 * The desktop version is a 520vh sticky horizontal scroll scene. Reproducing
 * that on a phone is the wrong instinct: scroll-jacking fights the OS, and the
 * previous fallback (five stacked 80vh blocks) turned the chapter into ~4.8
 * screens of static text with the photo a full screen away from its own
 * heading.
 *
 * Instead this is a native, thumb-driven carousel:
 *   • one card per activity, ~one screen tall, no scroll-jacking
 *   • CSS scroll-snap so the momentum and rubber-banding are the platform's,
 *     not ours — nothing runs per-frame in JS
 *   • the day-arc survives as a rail: a sun orb slides from dawn to golden hour
 *     as you swipe, and the section's day-phase gradient crossfades with it
 *
 * The orb is positioned by writing `transform` straight to the node on scroll,
 * so swiping never triggers a React render. Only the active *index* is state.
 */

const RAIL_LABELS = ['Dawn', 'Morning', 'Midday', 'Evening', 'Golden hour'];

const ACCENT_STYLE: React.CSSProperties = {
  background: 'var(--grad-aurora)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

function FrostedChip({ label, dark }: { label: string; dark: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.3rem 0.7rem',
        borderRadius: 'var(--radius-pill)',
        border: `1.5px solid ${dark ? 'rgba(244,242,255,0.18)' : 'rgba(46,107,255,0.18)'}`,
        background: dark ? 'rgba(30,24,64,0.55)' : 'rgba(255,255,255,0.65)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        color: dark ? 'var(--color-panel-text)' : 'var(--color-ink)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

export function ActivityChapterMobile({
  scenes,
  gradients,
  reduced = false,
}: {
  scenes: Scene[];
  gradients: string[];
  /**
   * Reduced motion still gets the carousel — swiping is the user's own gesture,
   * not an animation, and dropping them back into a five-screen static stack
   * would punish them for an accessibility setting. We only remove the things
   * that move on their own: the gradient crossfade and the smooth dot-scroll.
   */
  reduced?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [swiped, setSwiped] = useState(false);

  // Drive the orb straight from scrollLeft. Writing transform on the node keeps
  // the swipe at 60fps — a setState per scroll event would re-render 5 cards.
  const onScroll = useCallback(() => {
    const track = trackRef.current;
    const orb = orbRef.current;
    const rail = railRef.current;
    if (!track) return;

    const max = track.scrollWidth - track.clientWidth;
    const frac = max > 0 ? Math.min(Math.max(track.scrollLeft / max, 0), 1) : 0;

    if (orb && rail) {
      // Arc: across the rail horizontally, dipping up at midday like the sun.
      const x = frac * (rail.clientWidth - 20);
      const y = -10 * Math.sin(frac * Math.PI);
      orb.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    const idx = Math.round(frac * (scenes.length - 1));
    setActive((prev) => (prev === idx ? prev : idx));
    if (track.scrollLeft > 8) setSwiped(true);
  }, [scenes.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    onScroll(); // place the orb on mount
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onScroll]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  return (
    <section
      aria-labelledby="activity-heading"
      className="relative overflow-hidden py-12"
      style={{ background: gradients[0] }}
    >
      {/* Day-phase gradients crossfade as you swipe. Gradients can't be CSS
          transitioned, so they are stacked layers with animated opacity. */}
      {gradients.map((g, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={reduced ? 'absolute inset-0' : 'absolute inset-0 transition-opacity duration-500 ease-out'}
          style={{ background: g, opacity: i === active ? 1 : 0, zIndex: 0 }}
        />
      ))}

      <div className="relative" style={{ zIndex: 1 }}>
        {/* Heading */}
        <div className="px-6 mb-6">
          <p className="label-eyebrow mb-2" style={{ color: 'var(--color-gold)' }}>
            One day, with company
          </p>
          <ClipReveal
            as="h2"
            id="activity-heading"
            text="From sunrise walk to evening show."
            accent="evening show."
            accentStyle={ACCENT_STYLE}
            className="font-display text-h3 leading-tight tracking-tight"
            style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}
          />
        </div>

        {/* ── Day-arc rail: the sun crosses it as you swipe ── */}
        <div className="px-6 mb-5">
          <div ref={railRef} className="relative h-6">
            {/* Aurora hairline — the journey's spine, in its horizontal form */}
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-1/2 h-[2px] rounded-full opacity-40"
              style={{ background: 'var(--grad-aurora)' }}
            />
            <div
              ref={orbRef}
              aria-hidden="true"
              className="absolute top-1/2 left-0 -mt-[10px] will-change-transform"
              style={{ width: 20, height: 20 }}
            >
              <div
                className="absolute rounded-full"
                style={{ inset: -12, background: 'var(--grad-seal)', filter: 'blur(9px)', opacity: 0.45 }}
              />
              <div
                className="relative rounded-full"
                style={{ width: 20, height: 20, background: 'var(--grad-seal)', boxShadow: 'var(--glow-seal)' }}
              />
            </div>
          </div>
          <p
            className="mt-2 text-center label-eyebrow transition-opacity duration-300"
            style={{ color: 'var(--color-ink-muted)' }}
            aria-live="polite"
          >
            {RAIL_LABELS[active]}
          </p>
        </div>

        {/* ── Swipeable track. Snap + momentum are the platform's, not ours. ── */}
        <div
          ref={trackRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="A day with company: five activities"
          tabIndex={0}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-[var(--color-azure)]"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain', touchAction: 'pan-x pan-y' }}
        >
          {scenes.map((scene, i) => {
            const dark = !!scene.dark;
            return (
              <article
                key={scene.title}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${scenes.length}: ${scene.title}`}
                className="snap-center shrink-0 rounded-[var(--radius-lg)] overflow-hidden"
                style={{
                  width: 'min(85vw, 560px)',
                  background: dark ? 'var(--color-ink-dark-panel)' : 'var(--color-surface)',
                  boxShadow: 'var(--shadow-lift)',
                }}
              >
                {/* Photo — sits directly above its own words, not a screen away */}
                <div className="relative w-full" style={{ aspectRatio: '5 / 4' }}>
                  <Image
                    src={scene.photo.src}
                    alt={scene.photo.alt}
                    fill
                    sizes="85vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                  {/* Day-phase index, legible on the photo instead of clipped off-screen */}
                  <span
                    aria-hidden="true"
                    className="absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-1"
                    style={{
                      background: 'rgba(20,18,42,0.55)',
                      color: 'var(--color-panel-text)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')} · {scene.eyebrow}
                  </span>
                </div>

                <div className="px-5 pt-4 pb-5">
                  <h3
                    className="font-display mb-1.5"
                    style={{
                      fontSize: 'var(--text-h3)',
                      letterSpacing: '-0.02em',
                      color: dark ? 'var(--color-panel-text)' : 'var(--color-ink)',
                    }}
                  >
                    {scene.title}
                  </h3>
                  <p
                    className="mb-4"
                    style={{
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      color: dark ? 'rgba(244,242,255,0.72)' : 'var(--color-ink-muted)',
                    }}
                  >
                    {scene.hook}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scene.chips.map((c) => (
                      <FrostedChip key={c} label={c} dark={dark} />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Dots: real buttons, 44px hit area, tiny visible dot ── */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {scenes.map((scene, i) => (
            <button
              key={scene.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${scene.title}`}
              aria-current={i === active}
              className="grid place-items-center focus-visible:outline-2 focus-visible:outline-[var(--color-azure)] rounded-full"
              style={{ width: 44, height: 44 }}
            >
              <span
                className={reduced ? 'block rounded-full' : 'block rounded-full transition-all duration-300'}
                style={{
                  width: i === active ? 22 : 7,
                  height: 7,
                  background: i === active ? 'var(--color-azure)' : 'rgba(20,26,46,0.22)',
                }}
              />
            </button>
          ))}
        </div>

        {/* Swipe affordance — shown once, disappears the moment they swipe */}
        <p
          aria-hidden="true"
          className="flex items-center justify-center gap-1.5 text-xs font-sans transition-opacity duration-500"
          style={{
            color: 'var(--color-ink-muted)',
            opacity: swiped ? 0 : 1,
          }}
        >
          Swipe through the day
          <ArrowRight size={13} aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { RollLink } from '@/components/motion/RollLink';
import { SpotlightText } from '@/components/home/SpotlightText';

const TRUST_ITEMS = ['ID-verified', 'Background-checked', '₹ held in escrow'] as const;

const HEADLINE_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.035em',
  fontSize: 'clamp(3rem, 1.4rem + 7vw, 7.5rem)',
  lineHeight: '0.96',
};

const H2_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.03em',
  fontSize: 'clamp(2.25rem, 1.2rem + 5vw, 5rem)',
  lineHeight: '1.05',
  color: 'var(--color-ink)',
};

/**
 * State 0 — fully interactive: eyebrow, H1, sub-copy, CTAs, trust items.
 * Center-aligned hero. Semantic anchor (id="hero-heading" lives here).
 */
export function HeroCopyState0() {
  return (
    <div className="text-center">
      <p className="label-eyebrow mb-5" style={{ color: 'var(--color-violet)' }}>
        Trusted · Verified · Always Platonic
      </p>
      <h1 id="hero-heading" style={HEADLINE_STYLE} className="mb-7">
        <span className="block" style={{ color: 'var(--color-ink)' }}>Never go</span>
        <SpotlightText className="block">alone.</SpotlightText>
      </h1>
      <p className="text-lead mb-10 max-w-xl mx-auto" style={{ color: 'var(--color-ink-muted)' }}>
        Verified companions for city walks, gym sessions, café chats, live events, and more, strictly platonic.
      </p>
      <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
        <MagneticButton>
          <RollLink
            href="/explore"
            className="h-13 px-8 rounded-xl font-sans font-bold text-base text-white focus-visible:outline-white"
            style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)', textShadow: 'none' }}
            hoverBackground="var(--grad-cta-hover)"
          >
            Find a companion
          </RollLink>
        </MagneticButton>
        <Link
          href="/how-it-works"
          className="inline-flex items-center h-13 px-5 rounded-xl font-sans font-semibold text-base transition-colors hover:underline underline-offset-4"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          How it works →
        </Link>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {TRUST_ITEMS.map((item) => (
          <span key={item} className="flex items-center gap-1.5 text-sm font-sans" style={{ color: 'var(--color-emerald)' }}>
            <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/** State 1 — non-interactive, aria-hidden. Discovery beat: who's near you. */
export function HeroCopyState1() {
  return (
    <div aria-hidden="true" className="pointer-events-none text-center">
      <h2 style={H2_STYLE} className="mb-5">
        See who&apos;s actually<br />near you.
      </h2>
      <p className="text-lead max-w-xl mx-auto" style={{ color: 'var(--color-ink-muted)' }}>
        Every profile ID-verified, rated by real members, in 38 cities.
      </p>
    </div>
  );
}

/** State 2 — non-interactive, aria-hidden. Action beat: meet this week. */
export function HeroCopyState2() {
  return (
    <div aria-hidden="true" className="pointer-events-none text-center">
      <h2 style={H2_STYLE} className="mb-5">
        Then meet,<br />this week.
      </h2>
      <p className="text-lead max-w-xl mx-auto" style={{ color: 'var(--color-ink-muted)' }}>
        Book in a tap. ₹ held in escrow until you meet.
      </p>
    </div>
  );
}

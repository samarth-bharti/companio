'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Gift, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Visual segments. Every wedge here is a prize the server can actually award
// (lib/server/spin.ts), and every prize the server can award has a wedge — the
// wheel must never paint something unwinnable, and must never be unable to show
// what was won. (An earlier "Plus month" jackpot wedge was unwinnable and has
// been removed.)
//
// The wedges are EQUALLY SIZED and the odds are NOT. "Free visit" occupies an
// eighth of the wheel and is drawn one spin in ten thousand; the discounts are
// likewise rarer than they look. A wedge is a label, not a probability, and
// nobody reads it that way — which is why the exact odds are printed directly
// under the wheel rather than buried in terms. Do not remove that disclosure: it
// is the only thing standing between this component and a rigged wheel.
const SEGMENTS = [
  { label: '5% off', color: '#2E6BFF' },
  { label: 'Try again', color: '#E7E9F2' },
  { label: '10% off', color: '#2E6BFF' },
  { label: 'Try again', color: '#E7E9F2' },
  { label: '15% off', color: '#1FAE6B' },
  { label: 'Try again', color: '#E7E9F2' },
  { label: '20% off', color: '#1FAE6B' },
  { label: 'Free visit', color: '#8B5CF6' },
];
const SEG = 360 / SEGMENTS.length;

// Map a server prize to the segment the pointer should land on. `none` lands on
// any "Try again" wedge (index 1). The pointer always lands on the result the
// SERVER drew — the animation reports the outcome, it never decides it.
const PRIZE_SEGMENT: Record<string, number> = {
  discount5: 0,
  discount10: 2,
  discount15: 4,
  discount20: 6,
  free_visit: 7,
  none: 1,
};

type Status = 'loading' | 'ready' | 'spinning' | 'done' | 'cooldown' | 'signedout' | 'nothingtowin';

interface SpinState {
  status: Status;
  rotation: number;
  resultLabel: string | null;
  nextSpinAt: string | null;
  /** Published odds, straight from the server's own prize table. */
  odds: { label: string; pct: string }[];
}

// Bounce/overshoot easing — wheel slams in then bounces back slightly.
const WHEEL_TRANSITION = { duration: 4, ease: [0.16, 1, 0.3, 1] as const };
const WHEEL_TRANSITION_REDUCED = { duration: 0.4, ease: 'easeOut' as const };

export function SpinWheel() {
  const reduced = useEffectiveReducedMotion();
  const [s, setS] = useState<SpinState>({ status: 'loading', rotation: 0, resultLabel: null, nextSpinAt: null, odds: [] });
  const isWin = s.status === 'done' && s.resultLabel !== null && !s.resultLabel.startsWith('No win');

  useEffect(() => {
    fetch('/api/spin')
      .then(async (r) => {
        if (r.status === 401) return setS((p) => ({ ...p, status: 'signedout' }));
        const d = await r.json();
        setS((p) => ({
          ...p,
          status: d.nothingToWin ? 'nothingtowin' : d.canSpin ? 'ready' : 'cooldown',
          nextSpinAt: d.nextSpinAt,
          resultLabel: d.reward ? labelFor(d.reward.prize) : null,
          // The server publishes its own odds. Typing them here is how the
          // printed odds and the real table drift apart.
          odds: Array.isArray(d.odds) ? d.odds : [],
        }));
      })
      .catch(() => setS((p) => ({ ...p, status: 'signedout' })));
  }, []);

  // Fire confetti once per win; guarded by reducedMotion.
  useEffect(() => {
    if (!isWin || reduced) return;
    let cancelled = false;
    import('canvas-confetti').then((mod) => {
      if (cancelled) return;
      const confetti = mod.default;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#2E6BFF', '#1FAE6B', '#8B5CF6', '#FFB23E'] });
    });
    return () => { cancelled = true; };
  }, [isWin, reduced]);

  async function spin() {
    setS((p) => ({ ...p, status: 'spinning' }));
    try {
      const res = await fetch('/api/spin', { method: 'POST' });
      const d = await res.json();
      if (res.status === 429) {
        return setS((p) => ({ ...p, status: 'cooldown', nextSpinAt: d.nextSpinAt ?? p.nextSpinAt }));
      }
      if (!res.ok) return setS((p) => ({ ...p, status: 'ready' }));
      const seg = PRIZE_SEGMENT[d.result.prize] ?? 5;
      const rotation = 360 * 5 - (seg * SEG + SEG / 2);
      setS((p) => ({ ...p, status: 'spinning', rotation }));
      // Reveal the result only after the wheel settles.
      setTimeout(() => setS((p) => ({ ...p, status: 'done', resultLabel: d.label })), 4200);
    } catch {
      setS((p) => ({ ...p, status: 'ready' }));
    }
  }

  const gradient = `conic-gradient(${SEGMENTS.map((seg, i) => `${seg.color} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(', ')})`;

  return (
    <div className="flex flex-col items-center gap-7">
      <div
        className="relative"
        style={{ width: 280, height: 280 }}
        role="img"
        aria-label="Spin the wheel to win a reward"
      >
        {/* Pointer */}
        <div
          className="absolute left-1/2 -top-1 z-10 -translate-x-1/2"
          style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid var(--color-ink)' }}
          aria-hidden="true"
        />
        <motion.div
          className="rounded-full shadow-xl"
          style={{ width: 280, height: 280, background: gradient, border: '8px solid white' }}
          animate={{ rotate: s.rotation }}
          transition={reduced ? WHEEL_TRANSITION_REDUCED : WHEEL_TRANSITION}
        />
        {/* Hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md grid place-items-center" style={{ width: 56, height: 56 }}>
          <Gift size={24} className="text-[var(--color-azure)]" aria-hidden="true" />
        </div>
      </div>

      {/* aria-live so screen readers announce the spin result automatically */}
      <div aria-live="polite" aria-atomic="true">
        <SpinStatus state={s} onSpin={spin} />
      </div>

      {/* Honest odds disclosure. These are the SERVER's numbers, rendered from
          /api/spin — not a claim typed next to the wheel and left to rot. The
          wedges are equal; the odds are not, and this is where we say so. */}
      <div className="text-xs text-center text-[var(--color-ink-muted)] max-w-xs flex flex-col gap-2">
        <p>One spin a week. A win lasts 7 days. No cash prizes.</p>
        {s.odds.length > 0 && (
          <>
            <p className="font-semibold text-[var(--color-ink)]">Your exact chances</p>
            <ul className="flex flex-col gap-0.5">
              {s.odds.map((o) => (
                <li key={o.label} className="flex justify-between gap-3">
                  <span className="text-left">{o.label}</span>
                  <span className="tabular-nums shrink-0">{o.pct}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function SpinStatus({ state, onSpin }: { state: SpinState; onSpin: () => void }) {
  if (state.status === 'loading') return <p className="text-[var(--color-ink-muted)] text-sm">Loading your spin…</p>;

  if (state.status === 'signedout')
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Lock size={18} className="text-[var(--color-ink-muted)]" aria-hidden="true" />
        <p className="text-[var(--color-ink-muted)] text-sm max-w-xs">Sign in to spin the weekly wheel and win a discount.</p>
        <Button variant="cta" size="lg" onClick={() => (window.location.href = '/login')}>Sign in to spin</Button>
      </div>
    );

  if (state.status === 'done') {
    const won = !state.resultLabel?.startsWith('No win');
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <motion.p
          className="font-display font-black text-[var(--color-ink)]"
          style={{ fontSize: 'var(--text-h3)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          {won ? '🎉 You won!' : 'Better luck next week!'}
        </motion.p>
        <p className="text-[var(--color-ink-muted)] text-sm">{state.resultLabel}</p>
      </div>
    );
  }

  // Nothing left to discount. Saying this plainly beats letting someone spend
  // their weekly spin on a prize that could never be redeemed.
  if (state.status === 'nothingtowin')
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[var(--color-ink-muted)] text-sm max-w-xs">
          You hold a lifetime pass, and a spin only ever discounts a pass. There is
          nothing here for you to win, so we won&apos;t spend your spin on it.
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">
          When extra meetups go on sale, this comes back.
        </p>
      </div>
    );

  if (state.status === 'cooldown')
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[var(--color-ink-muted)] text-sm">
          You&apos;ve used this week&apos;s spin{state.nextSpinAt ? ` — come back ${new Date(state.nextSpinAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}.
        </p>
        {state.resultLabel && <p className="text-sm font-semibold text-[var(--color-emerald)]">Active reward: {state.resultLabel}</p>}
      </div>
    );

  return (
    <Button variant="cta" size="xl" disabled={state.status === 'spinning'} onClick={onSpin}>
      {state.status === 'spinning' ? 'Spinning…' : 'Spin the wheel'}
    </Button>
  );
}

// Mirrors the server's own labels (lib/server/spin.ts). Only reached for a
// reward loaded from /api/spin; a fresh spin uses the label the server returns.
function labelFor(prize: string): string {
  if (prize === 'discount5') return '5% off your pass';
  if (prize === 'discount10') return '10% off your pass';
  if (prize === 'discount15') return '15% off your pass';
  if (prize === 'discount20') return '20% off your pass';
  if (prize === 'free_visit') return 'A free visit — one extra included meeting';
  return 'No win this week';
}

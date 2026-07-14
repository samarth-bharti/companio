'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useViewerReady } from '@/lib/useViewerReady';
import { Gift, Clock } from 'lucide-react';

/**
 * The dashboard's spin promo.
 *
 * It used to be a static <Link> that always read "Your weekly spin is ready" —
 * true or not. A user who had just spun was told to spin again, clicked, and
 * hit a cooldown screen. This asks /api/spin first and says what's actually so.
 *
 * Signed out (401) or no DB: fall back to a neutral invitation rather than a
 * promise, and let /spin explain the sign-in requirement.
 */

type State =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'cooldown'; nextSpinAt: string | null }
  | { kind: 'unknown' }
  // Nothing to win — render nothing at all. Distinct from 'unknown', which still
  // shows a generic invitation and so must never be used to mean "no prize".
  | { kind: 'hidden' };

function whenNext(iso: string | null): string {
  if (!iso) return 'soon';
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'shortly';
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `in ${days} day${days === 1 ? '' : 's'}`;
  const hours = Math.max(1, Math.round(ms / 3_600_000));
  return `in ${hours} hour${hours === 1 ? '' : 's'}`;
}

export function SpinBanner() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  // A guest has no spin to offer, and /api/spin answers 401 for them. Don't ask.
  const signedIn = useViewerReady();

  useEffect(() => {
    if (!signedIn) {
      setState({ kind: 'hidden' });
      return;
    }
    let cancelled = false;
    fetch('/api/spin')
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) return setState({ kind: 'unknown' });
        const d = (await r.json()) as {
          canSpin?: boolean;
          nextSpinAt?: string | null;
          nothingToWin?: boolean;
        };

        // The only prize is a discount on the ₹199 unlock, so a member who has
        // already bought it cannot win anything — the API says so with
        // `nothingToWin`, and SpinWheel already honours it. The banner did not:
        // it read only `canSpin`, so a paid member was invited on every dashboard
        // load to "try your luck for a discount" on something they already own.
        // Advertising a prize that cannot be awarded is the kind of small lie
        // that makes the rest of the product harder to believe.
        if (d.nothingToWin) return setState({ kind: 'hidden' });

        setState(
          d.canSpin
            ? { kind: 'ready' }
            : { kind: 'cooldown', nextSpinAt: d.nextSpinAt ?? null },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'unknown' });
      });
    return () => { cancelled = true; };
  }, [signedIn]);

  // Don't flash a claim we haven't checked yet.
  if (state.kind === 'loading') return null;
  // The unlock is already bought: there is no prize, so there is no banner.
  if (state.kind === 'hidden') return null;

  if (state.kind === 'cooldown') {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-[var(--color-ink)]/10 bg-[var(--color-ink)]/[.03]">
        <Clock size={18} className="text-[var(--color-ink-muted)] shrink-0" aria-hidden="true" />
        <span className="text-sm text-[var(--color-ink-muted)]">
          You&rsquo;ve used this week&rsquo;s spin. The next one unlocks {whenNext(state.nextSpinAt)}.
        </span>
      </div>
    );
  }

  const copy =
    state.kind === 'ready'
      ? 'Your weekly spin is ready — try your luck for a discount →'
      : 'Spin the wheel for a discount →';

  return (
    <Link
      href="/spin"
      className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-[var(--color-azure)]/20 bg-[var(--color-azure-tint)] hover:bg-[var(--color-azure)]/10 transition-colors"
    >
      <Gift size={18} className="text-[var(--color-azure)] shrink-0" aria-hidden="true" />
      <span className="text-sm font-semibold text-[var(--color-azure-deep)]">{copy}</span>
    </Link>
  );
}

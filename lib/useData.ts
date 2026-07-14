'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { onDataChange, type DataKey } from '@/lib/dataEvents';

/**
 * Read one slice of visitor state and keep it fresh.
 *
 * Re-reads whenever:
 *   • this tab writes that slice (dataClient emits the change),
 *   • another tab writes any Companio storage key,
 *   • the tab regains focus (covers a write that happened while backgrounded,
 *     and a session that expired server-side while the tab sat idle).
 *
 * SSR-safe: `fallback` is returned on the server and on the client's first
 * render, so both trees agree and hydration never mismatches. Branch on
 * `loading` if you need to hide a placeholder value.
 */
export function useData<T>(
  key: DataKey,
  read: () => Promise<T>,
  fallback: T,
  enabled = true,
): { data: T; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  // `enabled: false` means "this slice is not readable right now" — in http mode
  // that is a signed-out visitor, whose /api/user and /api/notifications would
  // answer 401. Issuing those requests anyway put three red errors in the console
  // of every public page, and would put the same volume into Sentry in production.
  // Not asking is both quieter and correct: the answer for a guest IS the
  // fallback.
  const enabledRef = useRef(enabled);
  const fallbackRef = useRef(fallback);
  useEffect(() => {
    enabledRef.current = enabled;
    fallbackRef.current = fallback;
  });

  // The reader is a fresh closure on every render. Hold it in a ref so the
  // effect below depends only on `key` and never re-subscribes on each render.
  // Synced in an effect, not during render: a ref write during render is unsafe
  // under concurrent rendering, where a render can be discarded or replayed.
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });

  // Guards a slow read resolving after unmount, or out of order after a burst
  // of changes (the newest read must win, not the last to return).
  const aliveRef = useRef(true);
  const seqRef = useRef(0);

  // Has an ENABLED read ever completed? Distinguishes "we have the real value" from
  // "we have the fallback because we were not allowed to ask".
  const loadedRef = useRef(false);

  const refresh = useCallback(() => {
    const seq = ++seqRef.current;
    if (!enabledRef.current) {
      setData(fallbackRef.current);
      setLoading(false);
      loadedRef.current = false; // a disabled slice holds no real value
      return;
    }

    // Enabled, but nothing real has been read yet — so we ARE loading, and must
    // say so. The disabled branch above has already set `loading` to false, and
    // without this line it stays false while the first real read is in flight: a
    // component that waits on `loading` then sees "not loading, and no data" and
    // concludes there is no data. AccountGate did exactly that and bounced a
    // freshly signed-in member to /register, because for one render the session
    // said "authenticated" while this slice still said "not loading, user null".
    //
    // Deliberately NOT set on every refresh: a focus event or a data-change on an
    // already-loaded slice must not flash a skeleton over a value we already have.
    if (!loadedRef.current) setLoading(true);

    readRef.current()
      .then((v) => {
        if (!aliveRef.current || seq !== seqRef.current) return;
        setData(v);
        loadedRef.current = true;
        setLoading(false);
      })
      .catch(() => {
        // A failed read leaves the last good value in place rather than
        // flashing the fallback — a 500 on /api/wallet shouldn't make a paid
        // user look like they have no credits.
        if (aliveRef.current && seq === seqRef.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    refresh();

    const unsubscribe = onDataChange((changed) => {
      if (changed === 'all' || changed === key) refresh();
    });

    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      aliveRef.current = false;
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
    // `enabled` is a dependency: the moment a session resolves, the slice that
    // was skipped must be fetched, not left on its fallback until the next focus.
  }, [key, refresh, enabled]);

  return { data, loading, refresh };
}

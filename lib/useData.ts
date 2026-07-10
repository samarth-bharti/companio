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
): { data: T; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

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

  const refresh = useCallback(() => {
    const seq = ++seqRef.current;
    readRef.current()
      .then((v) => {
        if (!aliveRef.current || seq !== seqRef.current) return;
        setData(v);
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
  }, [key, refresh]);

  return { data, loading, refresh };
}

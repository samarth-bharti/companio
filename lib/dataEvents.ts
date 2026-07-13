// lib/dataEvents.ts
//
// A change notification for everything the app stores about a visitor.
//
// The problem this solves: lib/journeyState and lib/appState are plain
// localStorage getters and setters. Nothing announced a write, so every
// component read its slice once, in a mount effect, and then went stale.
// Unlock on /explore and the Nav wallet chip, the TopUp menu and /dashboard all
// kept showing the old value until a hard reload. Two open tabs disagreed
// silently, forever.
//
// lib/consent.ts already solved exactly this for the cookie banner with a
// window CustomEvent. This is the same idea, generalised, and it works for both
// data clients: the localStorage client emits after it writes, and the http
// client emits after the server confirms.
//
// Two channels, because they carry different information:
//   • CustomEvent  — same tab. Names the resource that changed.
//   • 'storage'    — other tabs only (the browser never fires it in the writer).
//                    We can't tell which resource, so it invalidates everything.

export type DataKey =
  | 'wallet'
  | 'unlocked'
  | 'welcomed'
  | 'user'
  | 'bookings'
  | 'favorites'
  | 'messages'
  | 'notifications'
  | 'plan'
  | 'application';

/** 'all' means "something changed elsewhere; re-read whatever you hold". */
export type DataChange = DataKey | 'all';

export const DATA_EVENT = 'companio:data';

/** Announce that `key` has changed in this tab. Safe to call on the server. */
export function emitDataChange(key: DataKey): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DataKey>(DATA_EVENT, { detail: key }));
}

/**
 * Subscribe to changes. The callback receives the specific key that changed in
 * this tab, or 'all' when another tab wrote to Companio's storage.
 *
 * Returns an unsubscribe function.
 */
export function onDataChange(cb: (key: DataChange) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onCustom = (e: Event) => cb((e as CustomEvent<DataKey>).detail);

  const onStorage = (e: StorageEvent) => {
    // e.key is null when the whole store is cleared. Either way, if it's ours,
    // assume the worst and let subscribers re-read.
    if (e.key === null || e.key.startsWith('companio_')) cb('all');
  };

  window.addEventListener(DATA_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DATA_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

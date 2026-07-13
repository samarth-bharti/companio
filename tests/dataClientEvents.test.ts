import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withChangeEvents, type DataClient } from '@/lib/dataClient';
import { onDataChange } from '@/lib/dataEvents';

// The whole "no manual refresh" behaviour rests on one promise: every mutation
// announces the slice it touched. If a method is added to DataClient and left
// out of MUTATION_EFFECTS, the UI silently goes stale again — so pin it here.

function fakeWindow() {
  return new EventTarget() as unknown as Window & typeof globalThis;
}

/** A DataClient whose every method resolves, recording nothing. */
function stubClient(): DataClient {
  const noop = async () => undefined;
  return {
    getCompanions: async () => [],
    getCompanion: async () => undefined,
    getWallet: async () => ({ credits: 0, used: 0 }),
    addCredits: async () => ({ credits: 1, used: 0 }),
    decrementMeeting: async () => ({ credits: 0, used: 1 }),
    getUnlocked: async () => false,
    setUnlocked: noop,
    getWelcomed: async () => false,
    setWelcomed: noop,
    getUser: async () => null,
    setUser: noop,
    getBookings: async () => [],
    addBooking: async () => ({}) as never,
    updateBooking: noop,
    getFavorites: async () => [],
    toggleFavorite: async () => [],
    getThread: async () => [],
    getThreads: async () => ({}),
    appendMessage: async () => ({}) as never,
    getNotifications: async () => [],
    addNotification: noop,
    markNotificationsRead: noop,
    getPlan: async () => null,
    setPlan: noop,
    getApplication: async () => null,
    saveApplication: noop,
  } as unknown as DataClient;
}

describe('withChangeEvents', () => {
  let seen: string[];

  beforeEach(() => {
    vi.stubGlobal('window', fakeWindow());
    seen = [];
    onDataChange((k) => seen.push(k));
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['setUnlocked', ['unlocked'], [true]],
    ['setWelcomed', ['welcomed'], [true]],
    ['setUser', ['user'], [{ firstName: 'Sam' }]],
    ['decrementMeeting', ['wallet'], []],
    ['addCredits', ['wallet'], [1]],
    ['updateBooking', ['bookings'], ['b1', {}]],
    ['toggleFavorite', ['favorites'], ['ananya']],
    ['appendMessage', ['messages'], ['ananya', { from: 'me', text: 'hi' }]],
    ['addNotification', ['notifications'], [{ title: 't', body: 'b' }]],
    ['markNotificationsRead', ['notifications'], []],
    ['setPlan', ['plan'], ['plus']],
    ['saveApplication', ['application'], [{}]],
  ] as const)('%s emits %j', async (method, expected, args) => {
    const dc = withChangeEvents(stubClient()) as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
    await dc[method](...args);
    expect(seen).toEqual([...expected]);
  });

  it('addBooking invalidates the wallet too — it may have spent a credit', async () => {
    const dc = withChangeEvents(stubClient());
    await dc.addBooking({} as never);
    expect(seen).toEqual(['bookings', 'wallet']);
  });

  it('reads never emit', async () => {
    const dc = withChangeEvents(stubClient());
    await dc.getWallet();
    await dc.getBookings();
    await dc.getUnlocked();
    await dc.getCompanions();
    expect(seen).toEqual([]);
  });

  it('does not emit when the underlying mutation rejects', async () => {
    const base = stubClient();
    base.setUnlocked = async () => { throw new Error('403 use_checkout'); };
    const dc = withChangeEvents(base);
    await expect(dc.setUnlocked(true)).rejects.toThrow();
    // A failed write must not trigger a re-read that would just show the old
    // value and imply success.
    expect(seen).toEqual([]);
  });

  it('passes arguments and the return value straight through', async () => {
    const base = stubClient();
    const spy = vi.fn().mockResolvedValue(['ananya', 'rohan']);
    base.toggleFavorite = spy;
    const dc = withChangeEvents(base);
    await expect(dc.toggleFavorite('rohan')).resolves.toEqual(['ananya', 'rohan']);
    expect(spy).toHaveBeenCalledWith('rohan');
  });
});

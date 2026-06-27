import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeHttpDataClient } from '@/lib/dataClient';

// A fetch stub whose response is configured per test. `ok` is derived from the
// status so we exercise the same branch the real client sees.
function stubFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const dc = makeHttpDataClient();

afterEach(() => vi.unstubAllGlobals());

describe('httpDataClient — reads', () => {
  it('getCompanions returns the array and hits /api/companions', async () => {
    const fn = stubFetch(200, [{ id: 'ananya' }]);
    const out = await dc.getCompanions();
    expect(out).toEqual([{ id: 'ananya' }]);
    expect(fn).toHaveBeenCalledWith('/api/companions');
  });

  it('getCompanion returns undefined on 404 (unknown id)', async () => {
    stubFetch(404, { error: 'not_found' });
    expect(await dc.getCompanion('nope')).toBeUndefined();
  });

  it('getCompanion returns the companion on 200', async () => {
    stubFetch(200, { id: 'ananya', name: 'Ananya' });
    expect(await dc.getCompanion('ananya')).toMatchObject({ id: 'ananya' });
  });
});

describe('httpDataClient — 401 tolerance (signed-out defaults)', () => {
  it('getWallet falls back to the starter wallet', async () => {
    stubFetch(401, { error: 'unauthorized' });
    expect(await dc.getWallet()).toEqual({ credits: 2, used: 0 });
  });

  it('getUser falls back to null', async () => {
    stubFetch(401, null);
    expect(await dc.getUser()).toBeNull();
  });

  it('getUnlocked / getWelcomed fall back to false', async () => {
    stubFetch(401, null);
    expect(await dc.getUnlocked()).toBe(false);
    expect(await dc.getWelcomed()).toBe(false);
  });

  it('list getters fall back to empty arrays', async () => {
    stubFetch(401, null);
    expect(await dc.getBookings()).toEqual([]);
    expect(await dc.getFavorites()).toEqual([]);
    expect(await dc.getNotifications()).toEqual([]);
    expect(await dc.getThread('ananya')).toEqual([]);
  });

  it('getPlan / getApplication fall back to null', async () => {
    stubFetch(401, null);
    expect(await dc.getPlan()).toBeNull();
    expect(await dc.getApplication()).toBeNull();
  });

  it('getThreads falls back to an empty map', async () => {
    stubFetch(401, null);
    expect(await dc.getThreads()).toEqual({});
  });
});

describe('httpDataClient — reads still throw on real errors', () => {
  it('a 500 on a tolerant getter throws (not swallowed)', async () => {
    stubFetch(500, { error: 'boom' });
    await expect(dc.getBookings()).rejects.toThrow(/HTTP 500/);
  });
});

describe('httpDataClient — writes', () => {
  it('addBooking POSTs the body and returns the created row', async () => {
    const fn = stubFetch(200, { id: 'b1', companionId: 'ananya' });
    const out = await dc.addBooking({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    expect(out).toMatchObject({ id: 'b1' });
    expect(fn).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('toggleFavorite returns the updated id list', async () => {
    stubFetch(200, ['ananya']);
    expect(await dc.toggleFavorite('ananya')).toEqual(['ananya']);
  });

  it('markNotificationsRead POSTs to the read endpoint', async () => {
    const fn = stubFetch(200, { ok: true, updated: 2 });
    await dc.markNotificationsRead();
    expect(fn).toHaveBeenCalledWith(
      '/api/notifications/read',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('a write throws on 403 (paid grants are server-gated)', async () => {
    stubFetch(403, { error: 'forbidden' });
    await expect(dc.addCredits(5)).rejects.toThrow(/HTTP 403/);
  });

  it('a write throws on 401 (must be signed in)', async () => {
    stubFetch(401, { error: 'unauthorized' });
    await expect(dc.setUser({} as never)).rejects.toThrow(/HTTP 401/);
  });
});

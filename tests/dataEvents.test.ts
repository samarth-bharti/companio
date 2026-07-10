import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emitDataChange, onDataChange, DATA_EVENT } from '@/lib/dataEvents';

// vitest runs with environment: 'node', so there is no window. A bare
// EventTarget is enough — dataEvents only uses add/remove/dispatch.
function fakeWindow() {
  return new EventTarget() as unknown as Window & typeof globalThis;
}

describe('dataEvents on the server', () => {
  it('emit is a no-op and subscribe returns a working unsubscribe', () => {
    expect(() => emitDataChange('wallet')).not.toThrow();
    const off = onDataChange(() => { throw new Error('must not fire'); });
    expect(() => off()).not.toThrow();
  });
});

describe('dataEvents in a browser', () => {
  let win: Window & typeof globalThis;

  beforeEach(() => {
    win = fakeWindow();
    vi.stubGlobal('window', win);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('delivers the changed key to same-tab subscribers', () => {
    const cb = vi.fn();
    onDataChange(cb);
    emitDataChange('wallet');
    expect(cb).toHaveBeenCalledExactlyOnceWith('wallet');
  });

  it('unsubscribing stops delivery', () => {
    const cb = vi.fn();
    const off = onDataChange(cb);
    off();
    emitDataChange('bookings');
    expect(cb).not.toHaveBeenCalled();
  });

  it('supports several independent subscribers', () => {
    const a = vi.fn();
    const b = vi.fn();
    onDataChange(a);
    const offB = onDataChange(b);
    emitDataChange('unlocked');
    offB();
    emitDataChange('unlocked');
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
  });

  // Cross-tab: the browser fires 'storage' only in the OTHER tabs, and it does
  // not tell us which of our slices changed — so everything is invalidated.
  it("maps another tab's companio_ write to 'all'", () => {
    const cb = vi.fn();
    onDataChange(cb);
    win.dispatchEvent(Object.assign(new Event('storage'), { key: 'companio_wallet' }));
    expect(cb).toHaveBeenCalledExactlyOnceWith('all');
  });

  it("maps a whole-store clear (key === null) to 'all'", () => {
    const cb = vi.fn();
    onDataChange(cb);
    win.dispatchEvent(Object.assign(new Event('storage'), { key: null }));
    expect(cb).toHaveBeenCalledExactlyOnceWith('all');
  });

  it('ignores storage writes from other apps on the same origin', () => {
    const cb = vi.fn();
    onDataChange(cb);
    win.dispatchEvent(Object.assign(new Event('storage'), { key: 'some_other_app_key' }));
    expect(cb).not.toHaveBeenCalled();
  });

  it('emits on the canonical event name', () => {
    const raw = vi.fn();
    win.addEventListener(DATA_EVENT, raw);
    emitDataChange('messages');
    expect(raw).toHaveBeenCalledOnce();
  });
});

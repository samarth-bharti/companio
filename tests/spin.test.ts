import { describe, it, expect } from 'vitest';
import { drawPrize, canSpin, nextSpinAt, SPIN_COOLDOWN_MS } from '@/lib/server/spin';

describe('drawPrize (weighted, deterministic by rnd)', () => {
  it('lands on "none" across the bulk of the range', () => {
    expect(drawPrize(0).prize).toBe('none');
    expect(drawPrize(0.8).prize).toBe('none'); // none weight 85 of 100
  });
  it('lands on discount10 in its band', () => {
    expect(drawPrize(0.90).prize).toBe('discount10'); // [85,95)
  });
  it('lands on discount20 at the top of the range', () => {
    expect(drawPrize(0.96).prize).toBe('discount20');  // [95,99)
    expect(drawPrize(0.995).prize).toBe('discount20'); // still in discount20 band
  });
  it('never returns out of bounds for rnd ~1', () => {
    expect(drawPrize(0.9999999).prize).toBe('discount20');
  });
  it('discount prizes carry the right pct', () => {
    expect(drawPrize(0.90).discountPct).toBe(10);
    expect(drawPrize(0.96).discountPct).toBe(20);
    expect(drawPrize(0).discountPct).toBe(0);
  });
});

describe('canSpin / nextSpinAt (weekly cooldown)', () => {
  const now = new Date('2026-06-21T12:00:00Z');
  it('allows a first-ever spin', () => expect(canSpin(null, now)).toBe(true));
  it('blocks a spin within the cooldown', () => {
    const recent = new Date(now.getTime() - SPIN_COOLDOWN_MS + 1000);
    expect(canSpin(recent, now)).toBe(false);
  });
  it('allows a spin once the cooldown has passed', () => {
    const old = new Date(now.getTime() - SPIN_COOLDOWN_MS - 1000);
    expect(canSpin(old, now)).toBe(true);
  });
  it('nextSpinAt is null when never spun, else +7 days', () => {
    expect(nextSpinAt(null)).toBeNull();
    const last = new Date('2026-06-21T00:00:00Z');
    expect(nextSpinAt(last)?.getTime()).toBe(last.getTime() + SPIN_COOLDOWN_MS);
  });
});

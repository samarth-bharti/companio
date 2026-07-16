import { describe, it, expect } from 'vitest';
import {
  drawPrize,
  canSpin,
  nextSpinAt,
  spinOdds,
  SPIN_COOLDOWN_MS,
  SPIN_PRIZES,
  SPIN_WEIGHT_TOTAL,
} from '@/lib/server/spin';

// Cumulative bands, out of 10,000:
//   none        [0,      9000)  90%
//   discount5   [9000,   9500)  5%
//   discount10  [9500,   9800)  3%
//   discount15  [9800,   9950)  1.5%
//   discount20  [9950,   9999)  0.49%
//   free_visit  [9999,  10000)  0.01%
describe('drawPrize (weighted, deterministic by rnd)', () => {
  it('lands on "none" across the bulk of the range', () => {
    expect(drawPrize(0).prize).toBe('none');
    expect(drawPrize(0.8).prize).toBe('none');
    expect(drawPrize(0.8999).prize).toBe('none');
  });
  it('lands on each discount in its own band', () => {
    expect(drawPrize(0.90).prize).toBe('discount5');
    expect(drawPrize(0.95).prize).toBe('discount10');
    expect(drawPrize(0.98).prize).toBe('discount15');
    expect(drawPrize(0.995).prize).toBe('discount20');
  });
  it('lands on free_visit only in the last ten-thousandth', () => {
    expect(drawPrize(0.99989).prize).toBe('discount20');
    expect(drawPrize(0.9999).prize).toBe('free_visit');
    expect(drawPrize(0.9999999).prize).toBe('free_visit');
  });
  it('prizes carry the right pct', () => {
    expect(drawPrize(0.90).discountPct).toBe(5);
    expect(drawPrize(0.95).discountPct).toBe(10);
    expect(drawPrize(0.98).discountPct).toBe(15);
    expect(drawPrize(0.995).discountPct).toBe(20);
    expect(drawPrize(0).discountPct).toBe(0);
    // A free visit is a credit, not a discount — a nonzero pct here would make
    // create-order try to reserve it as money off the pass.
    expect(drawPrize(0.9999).discountPct).toBe(0);
  });
});

describe('the published odds are the real odds', () => {
  // The weights ARE the basis points, which is the only reason spinOdds() can
  // print them without a second calculation. If the table stops summing to
  // 10,000 the fine print under the wheel starts lying.
  it('weights sum to exactly SPIN_WEIGHT_TOTAL', () => {
    const sum = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
    expect(sum).toBe(SPIN_WEIGHT_TOTAL);
  });
  it('publishes the odds the draw actually uses', () => {
    const odds = spinOdds();
    expect(odds.find((o) => o.label.startsWith('No win'))?.pct).toBe('90%');
    expect(odds.find((o) => o.label.startsWith('A free visit'))?.pct).toBe('0.01%');
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

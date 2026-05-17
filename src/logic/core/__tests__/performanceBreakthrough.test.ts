import { describe, expect, it } from 'vitest';
import { computeMilestoneProgress } from '../performanceBreakthrough';
import { resolveAuraFromBandId } from '../performanceAura';

describe('computeMilestoneProgress', () => {
  it('returns 0 at band floor and 1 at next tier threshold', () => {
    expect(computeMilestoneProgress(91, 91, 101)).toBeCloseTo(0, 5);
    expect(computeMilestoneProgress(100.9, 91, 101)).toBeCloseTo(0.99, 2);
    expect(computeMilestoneProgress(101, 91, 101)).toBe(1);
  });

  it('returns full bar when no next tier', () => {
    expect(computeMilestoneProgress(200, 151, null)).toBe(1);
  });
});

describe('resolveAuraFromBandId', () => {
  it('maps TIER_91 to shimmer for 92-point resonance', () => {
    expect(resolveAuraFromBandId('TIER_91')).toBe('shimmer');
  });

  it('maps PANTHEON to divine_light like LEGEND', () => {
    expect(resolveAuraFromBandId('LEGEND')).toBe('divine_light');
    expect(resolveAuraFromBandId('PANTHEON')).toBe('divine_light');
  });
});

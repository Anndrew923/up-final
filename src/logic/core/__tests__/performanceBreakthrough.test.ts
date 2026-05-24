import { describe, expect, it } from 'vitest';
import { computeMilestoneProgress } from '../performanceBreakthrough';
import { resolveAuraFromBandId } from '../performanceAura';

describe('computeMilestoneProgress', () => {
  it('returns 0 at band floor and 1 at next tier threshold', () => {
    expect(computeMilestoneProgress(90, 90, 100)).toBeCloseTo(0, 5);
    expect(computeMilestoneProgress(99.9, 90, 100)).toBeCloseTo(0.99, 2);
    expect(computeMilestoneProgress(100, 90, 100)).toBe(1);
  });

  it('returns full bar when no next tier', () => {
    expect(computeMilestoneProgress(200, 150, null)).toBe(1);
  });
});

describe('resolveAuraFromBandId', () => {
  it('maps decade tier ids to shimmer', () => {
    expect(resolveAuraFromBandId('TIER_90')).toBe('shimmer');
  });

  it('maps PANTHEON to divine_light like LEGEND', () => {
    expect(resolveAuraFromBandId('LEGEND')).toBe('divine_light');
    expect(resolveAuraFromBandId('PANTHEON')).toBe('divine_light');
  });
});

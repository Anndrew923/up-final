import { describe, expect, it } from 'vitest';
import { pickHighestStrengthLeaf } from '../pickHighestStrengthLeaf';
import type { StrengthLiftBranch } from '../../core/strengthAssessment';

function branch(
  lift: StrengthLiftBranch['lift'],
  finalScore: number,
  extras: Partial<StrengthLiftBranch> = {}
): StrengthLiftBranch {
  return {
    lift,
    weightKg: 100,
    reps: 1,
    oneRepMax: 100,
    finalScore,
    ...extras,
  };
}

describe('pickHighestStrengthLeaf', () => {
  it('returns the highest undiluted lift leaf', () => {
    expect(
      pickHighestStrengthLeaf([
        branch('squat', 70),
        branch('benchPress', 81.96),
        branch('deadlift', 75),
      ])
    ).toBe('strength.benchPress');
  });

  it('returns null when no branch has a positive score', () => {
    expect(pickHighestStrengthLeaf([])).toBeNull();
    expect(pickHighestStrengthLeaf([branch('squat', 0)])).toBeNull();
  });
});

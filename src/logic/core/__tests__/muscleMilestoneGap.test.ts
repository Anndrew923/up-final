import { describe, expect, it } from 'vitest';
import {
  SMM_KG_CEILING_FEMALE,
  SMM_KG_CEILING_MALE,
  calculateMuscleScores,
} from '../muscleScoring';
import { resolveMuscleMilestoneRawGap } from '../muscleMilestoneGap';
import { resolveScoreMeaningMilestone } from '../scoreMeaningCatalog';
import { clampScoreMapValue } from '../scoring';

function clampedMuscleScore(params: {
  smmKg: number;
  weightKg: number;
  age: number;
  gender: 'male' | 'female';
}): number | null {
  const raw = calculateMuscleScores(params).finalRawScore;
  if (raw === null || !Number.isFinite(raw)) return null;
  return clampScoreMapValue(raw);
}

describe('resolveMuscleMilestoneRawGap', () => {
  it('exposes ΔSMM kg toward the next decade gate at fixed body weight', () => {
    const bodyWeightKg = 80;
    const currentSmmKg = 40;
    const age = 25;
    const gender = 'male' as const;

    const score = clampedMuscleScore({
      smmKg: currentSmmKg,
      weightKg: bodyWeightKg,
      age,
      gender,
    });
    expect(score).not.toBeNull();

    const { nextMilestone } = resolveScoreMeaningMilestone('muscleMass', score!);
    expect(nextMilestone).not.toBeNull();

    const gap = resolveMuscleMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentSmmKg,
      bodyWeightKg,
      gender,
      age,
    });
    expect(gap).not.toBeNull();
    expect(gap!.unit).toBe('kg');
    expect(gap!.delta).toBeGreaterThanOrEqual(0.1);

    const nextScore = clampedMuscleScore({
      smmKg: currentSmmKg + gap!.delta,
      weightKg: bodyWeightKg,
      age,
      gender,
    });
    expect(nextScore).not.toBeNull();
    expect(nextScore!).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('clears gates across the Beast 80/20 handoff (smm branch > 100)', () => {
    // Heavy frame near/above smmScoreRaw 100 so composite uses beast blend toward next decade.
    const bodyWeightKg = 120;
    const currentSmmKg = 52;
    const age = 30;
    const gender = 'male' as const;

    const current = calculateMuscleScores({
      smmKg: currentSmmKg,
      weightKg: bodyWeightKg,
      age,
      gender,
    });
    expect(current.smmScoreRaw).not.toBeNull();
    expect(current.smmScoreRaw!).toBeGreaterThan(100);
    expect(current.finalRawScore).not.toBeNull();

    const clamped = clampScoreMapValue(current.finalRawScore!);
    const { nextMilestone } = resolveScoreMeaningMilestone('muscleMass', clamped);
    expect(nextMilestone).not.toBeNull();

    const gap = resolveMuscleMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentSmmKg,
      bodyWeightKg,
      gender,
      age,
    });
    expect(gap).not.toBeNull();

    const nextScore = clampedMuscleScore({
      smmKg: currentSmmKg + gap!.delta,
      weightKg: bodyWeightKg,
      age,
      gender,
    });
    expect(nextScore).not.toBeNull();
    expect(nextScore!).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('returns null when required SMM would exceed sex ceiling', () => {
    expect(
      resolveMuscleMilestoneRawGap({
        nextMilestoneScore: 200,
        currentSmmKg: 90,
        bodyWeightKg: 180,
        gender: 'male',
        age: 30,
      })
    ).toBeNull();

    expect(
      resolveMuscleMilestoneRawGap({
        nextMilestoneScore: 200,
        currentSmmKg: 60,
        bodyWeightKg: 90,
        gender: 'female',
        age: 28,
      })
    ).toBeNull();
  });

  it('returns null when current SMM is already above ceiling', () => {
    expect(
      resolveMuscleMilestoneRawGap({
        nextMilestoneScore: 80,
        currentSmmKg: SMM_KG_CEILING_MALE + 1,
        bodyWeightKg: 100,
        gender: 'male',
        age: 25,
      })
    ).toBeNull();
    expect(
      resolveMuscleMilestoneRawGap({
        nextMilestoneScore: 80,
        currentSmmKg: SMM_KG_CEILING_FEMALE + 1,
        bodyWeightKg: 70,
        gender: 'female',
        age: 25,
      })
    ).toBeNull();
  });

  it('returns null when already at or past the score gate', () => {
    const bodyWeightKg = 80;
    const currentSmmKg = 48;
    const age = 25;
    const score = clampedMuscleScore({
      smmKg: currentSmmKg,
      weightKg: bodyWeightKg,
      age,
      gender: 'male',
    })!;

    expect(
      resolveMuscleMilestoneRawGap({
        nextMilestoneScore: Math.floor(score),
        currentSmmKg,
        bodyWeightKg,
        gender: 'male',
        age,
      })
    ).toBeNull();
  });

  it('returns null for missing / invalid inputs', () => {
    expect(
      resolveMuscleMilestoneRawGap({
        nextMilestoneScore: 80,
        currentSmmKg: 0,
        bodyWeightKg: 80,
        gender: 'male',
        age: 25,
      })
    ).toBeNull();
    expect(
      resolveMuscleMilestoneRawGap({
        nextMilestoneScore: 80,
        currentSmmKg: 40,
        bodyWeightKg: 80,
        gender: 'male',
        age: 9,
      })
    ).toBeNull();
  });

  it('never under-promises after ceil1: advertised ΔSMM clears production score', () => {
    const cases: Array<{
      smmKg: number;
      weightKg: number;
      age: number;
      gender: 'male' | 'female';
    }> = [
      { smmKg: 35, weightKg: 75, age: 25, gender: 'male' },
      { smmKg: 40, weightKg: 80, age: 25, gender: 'male' },
      { smmKg: 52, weightKg: 120, age: 30, gender: 'male' },
      { smmKg: 28, weightKg: 60, age: 25, gender: 'female' },
      { smmKg: 32, weightKg: 65, age: 35, gender: 'female' },
    ];

    for (const c of cases) {
      const score = clampedMuscleScore({
        smmKg: c.smmKg,
        weightKg: c.weightKg,
        age: c.age,
        gender: c.gender,
      });
      if (score === null) continue;

      const { nextMilestone } = resolveScoreMeaningMilestone('muscleMass', score);
      if (nextMilestone === null) continue;

      const gap = resolveMuscleMilestoneRawGap({
        nextMilestoneScore: nextMilestone,
        currentSmmKg: c.smmKg,
        bodyWeightKg: c.weightKg,
        gender: c.gender,
        age: c.age,
      });
      if (gap === null) continue;

      const nextScore = clampedMuscleScore({
        smmKg: c.smmKg + gap.delta,
        weightKg: c.weightKg,
        age: c.age,
        gender: c.gender,
      });
      expect(nextScore).not.toBeNull();
      expect(nextScore!).toBeGreaterThanOrEqual(nextMilestone);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { calculateStrengthScore, clampScoreMapValue } from '../scoring';
import { STRENGTH_WEIGHT_LIMIT_KG } from '../strengthWeightLimits';
import { resolveSingleLiftMilestoneRawGap } from '../singleLiftMilestoneGap';
import { resolveScoreMeaningMilestone } from '../scoreMeaningCatalog';

describe('resolveSingleLiftMilestoneRawGap', () => {
  it('exposes Δkg toward the next decade gate at fixed BW/reps', () => {
    const liftType = 'benchPress' as const;
    const currentWeightKg = 80;
    const reps = 5;
    const bodyWeightKg = 80;
    const gender = 'male' as const;
    const age = 28;

    const raw = calculateStrengthScore({
      exerciseType: 'Bench Press',
      weight: currentWeightKg,
      reps,
      bodyWeight: bodyWeightKg,
      gender,
      age,
    }).finalScore;
    const score = clampScoreMapValue(raw);
    const { nextMilestone } = resolveScoreMeaningMilestone('strength', score);
    expect(nextMilestone).not.toBeNull();

    const gap = resolveSingleLiftMilestoneRawGap({
      liftType,
      currentWeightKg,
      reps,
      bodyWeightKg,
      gender,
      age,
      nextMilestoneScore: nextMilestone!,
    });
    expect(gap).not.toBeNull();
    expect(gap!.unit).toBe('kg');
    expect(gap!.delta).toBeGreaterThanOrEqual(0.5);
    // 0.5 kg barbell step
    expect(Math.round(gap!.delta * 2)).toBe(gap!.delta * 2);

    const nextScore = clampScoreMapValue(
      calculateStrengthScore({
        exerciseType: 'Bench Press',
        weight: currentWeightKg + gap!.delta,
        reps,
        bodyWeight: bodyWeightKg,
        gender,
        age,
      }).finalScore
    );
    expect(nextScore).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('works across major lifts (squat / deadlift / OHP)', () => {
    const cases: Array<{
      liftType: 'squat' | 'deadlift' | 'shoulderPress';
      exerciseType: 'Squat' | 'Deadlift' | 'Overhead Press';
      weightKg: number;
    }> = [
      { liftType: 'squat', exerciseType: 'Squat', weightKg: 120 },
      { liftType: 'deadlift', exerciseType: 'Deadlift', weightKg: 140 },
      { liftType: 'shoulderPress', exerciseType: 'Overhead Press', weightKg: 50 },
    ];

    for (const c of cases) {
      const score = clampScoreMapValue(
        calculateStrengthScore({
          exerciseType: c.exerciseType,
          weight: c.weightKg,
          reps: 5,
          bodyWeight: 80,
          gender: 'male',
          age: 28,
        }).finalScore
      );
      const { nextMilestone } = resolveScoreMeaningMilestone('strength', score);
      if (nextMilestone === null) continue;

      const gap = resolveSingleLiftMilestoneRawGap({
        liftType: c.liftType,
        currentWeightKg: c.weightKg,
        reps: 5,
        bodyWeightKg: 80,
        gender: 'male',
        age: 28,
        nextMilestoneScore: nextMilestone,
      });
      if (gap === null) continue;

      expect(gap.delta).toBeGreaterThanOrEqual(0.5);
      const nextScore = clampScoreMapValue(
        calculateStrengthScore({
          exerciseType: c.exerciseType,
          weight: c.weightKg + gap.delta,
          reps: 5,
          bodyWeight: 80,
          gender: 'male',
          age: 28,
        }).finalScore
      );
      expect(nextScore).toBeGreaterThanOrEqual(nextMilestone);
    }
  });

  it('returns null when required weight exceeds the lift model ceiling', () => {
    expect(
      resolveSingleLiftMilestoneRawGap({
        liftType: 'benchPress',
        currentWeightKg: STRENGTH_WEIGHT_LIMIT_KG.benchPress - 1,
        reps: 1,
        bodyWeightKg: 80,
        gender: 'male',
        age: 28,
        nextMilestoneScore: 200,
      })
    ).toBeNull();
  });

  it('returns null when already at or past the score gate', () => {
    const currentWeightKg = 100;
    const reps = 3;
    const score = clampScoreMapValue(
      calculateStrengthScore({
        exerciseType: 'Bench Press',
        weight: currentWeightKg,
        reps,
        bodyWeight: 80,
        gender: 'male',
        age: 28,
      }).finalScore
    );

    expect(
      resolveSingleLiftMilestoneRawGap({
        liftType: 'benchPress',
        currentWeightKg,
        reps,
        bodyWeightKg: 80,
        gender: 'male',
        age: 28,
        nextMilestoneScore: Math.floor(score),
      })
    ).toBeNull();
  });

  it('returns null for missing / invalid inputs', () => {
    expect(
      resolveSingleLiftMilestoneRawGap({
        liftType: 'benchPress',
        currentWeightKg: 0,
        reps: 5,
        bodyWeightKg: 80,
        gender: 'male',
        age: 28,
        nextMilestoneScore: 80,
      })
    ).toBeNull();
    expect(
      resolveSingleLiftMilestoneRawGap({
        liftType: 'benchPress',
        currentWeightKg: 80,
        reps: 5.5,
        bodyWeightKg: 80,
        gender: 'male',
        age: 28,
        nextMilestoneScore: 80,
      })
    ).toBeNull();
  });

  it('never under-promises after 0.5 kg ceil: advertised delta clears production score', () => {
    const cases = [
      { weightKg: 60, reps: 8 },
      { weightKg: 90, reps: 5 },
      { weightKg: 110, reps: 3 },
    ];

    for (const c of cases) {
      const score = clampScoreMapValue(
        calculateStrengthScore({
          exerciseType: 'Squat',
          weight: c.weightKg,
          reps: c.reps,
          bodyWeight: 85,
          gender: 'male',
          age: 30,
        }).finalScore
      );
      const { nextMilestone } = resolveScoreMeaningMilestone('strength', score);
      if (nextMilestone === null) continue;

      const gap = resolveSingleLiftMilestoneRawGap({
        liftType: 'squat',
        currentWeightKg: c.weightKg,
        reps: c.reps,
        bodyWeightKg: 85,
        gender: 'male',
        age: 30,
        nextMilestoneScore: nextMilestone,
      });
      if (gap === null) continue;

      const nextScore = clampScoreMapValue(
        calculateStrengthScore({
          exerciseType: 'Squat',
          weight: c.weightKg + gap.delta,
          reps: c.reps,
          bodyWeight: 85,
          gender: 'male',
          age: 30,
        }).finalScore
      );
      expect(nextScore).toBeGreaterThanOrEqual(nextMilestone);
    }
  });
});

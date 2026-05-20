import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import { buildLeaderboardSyncTargets } from '../leaderboardSyncTargets';
import {
  computeStrengthFiveLiftLadderMeanScore,
  computeStrengthSbdOneRmSumKg,
} from '../strengthAssessment';

const maleProfile30: PhysicalProfile = {
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('buildLeaderboardSyncTargets', () => {
  it('includes overall, SBD kg shard when all three lifts persist, and grip from merged scores', () => {
    const strengthInputs = {
      lifts: {
        squat: { weightKg: 100, reps: 5 },
        benchPress: { weightKg: 80, reps: 5 },
        deadlift: { weightKg: 120, reps: 5 },
      },
      bodyWeightKgSnapshot: 75,
    };
    const targets = buildLeaderboardSyncTargets({
      mergedScores: { strength: 80, gripStrength: 70 },
      overallScore: 75,
      profile: maleProfile30,
      cardioInputs: null,
      strengthInputs,
    });
    const byMetric = Object.fromEntries(targets.map((t) => [t.metric, t.score]));
    expect(byMetric.ladderScore).toBe(75);
    expect(byMetric.gripStrength).toBe(70);
    expect(byMetric.strength).toBe(computeStrengthSbdOneRmSumKg(maleProfile30, strengthInputs));
  });

  it('adds FFMI shard when bodyFat score exists', () => {
    const targets = buildLeaderboardSyncTargets({
      mergedScores: { bodyFat: 88 },
      overallScore: 0,
      profile: null,
      cardioInputs: null,
    });
    const byMetric = Object.fromEntries(targets.map((t) => [t.metric, t.score]));
    expect(byMetric.bodyFat_ffmi).toBe(88);
  });

  it('adds muscle composite + weight/ratio branch shards when muscle inputs resolve', () => {
    const targets = buildLeaderboardSyncTargets({
      mergedScores: { muscleMass: 72 },
      overallScore: 0,
      profile: maleProfile30,
      cardioInputs: null,
      muscleInputs: { muscle: { smmKg: 35 } },
    });
    const byMetric = Object.fromEntries(targets.map((t) => [t.metric, t.score]));
    expect(byMetric.muscleMass).toBeGreaterThan(0);
    expect(byMetric.muscleMass_weightKg).toBeGreaterThan(0);
    expect(byMetric.muscleMass_ratio).toBeGreaterThan(0);
    expect(byMetric.muscleMass_weightKg).not.toBe(byMetric.muscleMass_ratio);
  });

  it('adds explosive composite + branch shards when power inputs resolve', () => {
    const targets = buildLeaderboardSyncTargets({
      mergedScores: { explosivePower: 70 },
      overallScore: 0,
      profile: maleProfile30,
      cardioInputs: null,
      powerInputs: {
        explosivePower: { verticalJumpCm: 50, standingLongJumpCm: 220, sprintSeconds: 14 },
      },
    });
    const byMetric = Object.fromEntries(targets.map((t) => [t.metric, t.score]));
    expect(byMetric.explosive_composite).toBeGreaterThan(0);
    expect(byMetric.explosive_vertical).toBeGreaterThan(0);
    expect(byMetric.explosive_broad).toBeGreaterThan(0);
    expect(byMetric.explosive_sprint).toBeGreaterThan(0);
  });

  it('adds Cooper cardio shard when distance inputs are valid', () => {
    const targets = buildLeaderboardSyncTargets({
      mergedScores: {},
      overallScore: 0,
      profile: maleProfile30,
      cardioInputs: { cardio: { distance: 3000 } },
    });
    expect(targets.some((t) => t.metric === 'cardio')).toBe(true);
  });

  it('adds per-lift strength shards when a lift row is scorable from persisted inputs', () => {
    const targets = buildLeaderboardSyncTargets({
      mergedScores: { strength: 80 },
      overallScore: 0,
      profile: maleProfile30,
      cardioInputs: null,
      strengthInputs: {
        lifts: { benchPress: { weightKg: 100, reps: 5 } },
        bodyWeightKgSnapshot: 75,
      },
    });
    expect(targets.some((t) => t.metric === 'strength_bench')).toBe(true);
  });

  it('adds strength_totalFive as mean per-lift model score when lifts persist', () => {
    const strengthInputs = {
      lifts: {
        benchPress: { weightKg: 100, reps: 5 },
        squat: { weightKg: 120, reps: 5 },
      },
      bodyWeightKgSnapshot: 75,
    };
    const targets = buildLeaderboardSyncTargets({
      mergedScores: { strength: 80 },
      overallScore: 0,
      profile: maleProfile30,
      cardioInputs: null,
      strengthInputs,
    });
    const five = targets.find((t) => t.metric === 'strength_totalFive');
    expect(five).toBeDefined();
    expect(five!.score).toBe(computeStrengthFiveLiftLadderMeanScore(maleProfile30, strengthInputs));
  });
});

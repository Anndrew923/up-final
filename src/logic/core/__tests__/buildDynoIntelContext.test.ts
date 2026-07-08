import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../config/routes';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import type { PhysicalProfile } from '../../../types/userProfile';
import { buildDynoIntelContext, resolveWeakestAxis } from '../buildDynoIntelContext';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const strengthInputs = {
  lifts: {
    benchPress: { weightKg: 100, reps: 5 },
    squat: { weightKg: 120, reps: 5 },
  },
  bodyWeightKgSnapshot: 80,
};

describe('buildDynoIntelContext', () => {
  it('marks all six axes as gaps when merged scores are empty', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: {},
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'single-axis',
    });

    expect(ctx.schemaVersion).toBe(1);
    expect(ctx.gaps).toHaveLength(6);
    expect(ctx.gaps[0].assessmentRoute).toBe(ROUTES.strength);
    expect(ctx.weakestAxis).toBe('strength');
    expect(ctx.profile).toEqual({
      gender: 'male',
      ageBucket: '18-30',
      heightCm: 175,
      weightKg: 80,
    });
    expect(ctx.profile).not.toHaveProperty('displayName');
    expect(ctx.profile).not.toHaveProperty('city');
    expect(ctx.supplementalMetrics).toEqual([]);
    expect(ctx.focusSupplemental).toBeNull();
  });

  it('computes momentum deltas from the two newest history records', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 70, cardio: 55 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs,
        gripInputs: null,
      },
      historyRecords: [
        {
          createdAt: '2026-06-02T00:00:00.000Z',
          scores: { strength: 72, cardio: 55 },
          overallScore: 60,
        },
        {
          createdAt: '2026-06-01T00:00:00.000Z',
          scores: { strength: 68, cardio: 50 },
          overallScore: 55,
        },
      ],
      locale: 'zh-Hant',
      mode: 'cross-axis',
    });

    expect(ctx.momentum.hasHistory).toBe(true);
    expect(ctx.momentum.overallDelta).toBe(5);
    const strengthDelta = ctx.momentum.deltas.find((d) => d.axis === 'strength');
    expect(strengthDelta?.delta).toBe(4);
  });

  it('simulates strength-only weight change without mutating invariant axes', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: {},
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'weight-simulation',
      targetWeightKg: 72,
    });

    expect(ctx.weightSimulation).not.toBeNull();
    expect(ctx.weightSimulation?.targetWeightKg).toBe(72);
    expect(ctx.weightSimulation?.strength.currentScore).not.toBeNull();
    expect(ctx.weightSimulation?.strength.simulatedScore).not.toBeNull();

    const invariantAxes = ctx.axes.filter((a) => a.weightInvariant);
    expect(invariantAxes).toHaveLength(5);
    for (const axis of invariantAxes) {
      expect(axis.axis).not.toBe('strength');
    }
  });

  it('rejects out-of-range target weight for simulation', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: {},
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'weight-simulation',
      targetWeightKg: 10,
    });

    expect(ctx.weightSimulation).toBeNull();
  });

  it('assigns tierBandId when axis score is present', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 85 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'en',
      mode: 'single-axis',
      focusAxis: 'strength',
    });

    const strengthAxis = ctx.axes.find((a) => a.axis === 'strength');
    expect(strengthAxis?.tierBandId).toBeTruthy();
    expect(strengthAxis?.meaningI18nPrefix).toBe('scoreMeaning.axis.strength');
    expect(ctx.focusAxis).toBe('strength');
  });

  it('attaches focusAxisLexicon for FFMI page focus', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: { bodyFat: 96 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'single-axis',
      focusAxis: 'bodyFat',
    });

    expect(ctx.focusAxisLexicon).toEqual({
      axis: 'bodyFat',
      telemetryKey: 'bodyFat',
      surfaceLabel: 'FFMI / 引擎排量 (bodyFat 軸分數)',
    });
  });

  it('applies liveScoreOverrides after radar merge for consult alignment', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 60, cardio: 65, explosivePower: 70, muscleMass: 68, bodyFat: 72, gripStrength: 66 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs,
        gripInputs: null,
      },
      liveScoreOverrides: { strength: 105 },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'cross-axis',
    });

    const strengthAxis = ctx.axes.find((a) => a.axis === 'strength');
    expect(strengthAxis?.score).toBe(105);
    expect(ctx.overallScore).toBeGreaterThan(60);
  });
});

describe('resolveWeakestAxis', () => {
  it('prefers gap axes over low scores', () => {
    const gaps = [{ axis: 'cardio' as const, assessmentRoute: ROUTES.cardio }];
    const weakest = resolveWeakestAxis({ strength: 40, cardio: 90 }, gaps);
    expect(weakest).toBe('cardio');
  });

  it('picks lowest scored axis when no gaps', () => {
    const scores = Object.fromEntries(SIX_AXIS_METRICS.map((axis) => [axis, 80])) as Record<
      (typeof SIX_AXIS_METRICS)[number],
      number
    >;
    scores.gripStrength = 42;
    const weakest = resolveWeakestAxis(scores, []);
    expect(weakest).toBe('gripStrength');
  });
});

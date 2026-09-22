import { describe, expect, it } from 'vitest';
import {
  FFMI_BODY_FAT_INPUT_MIN_PCT,
  FFMI_HUMAN_CAP_FEMALE,
  FFMI_HUMAN_CAP_MALE,
  FFMI_PIECEWISE_MALE_BASE,
  FFMI_PIECEWISE_MALE_MAX_NATURAL,
  computeAdjustedFfmi,
  ffmiPiecewiseScore,
} from '../ffmiScoring';
import {
  invertFfmiPiecewiseScoreToFfmi,
  leanMassKgFromAdjustedFfmi,
  MIN_SURVIVAL_BF_PERCENT_FEMALE,
  MIN_SURVIVAL_BF_PERCENT_MALE,
  resolveFfmiMilestoneRawGap,
  resolveMilestonePromiseBfFloor,
} from '../ffmiMilestoneGap';
import { resolveScoreMeaningMilestone } from '../scoreMeaningCatalog';

describe('invertFfmiPiecewiseScoreToFfmi', () => {
  it('inverts male piecewise anchors', () => {
    expect(invertFfmiPiecewiseScoreToFfmi(60, 'male')).toBeCloseTo(FFMI_PIECEWISE_MALE_BASE, 10);
    expect(invertFfmiPiecewiseScoreToFfmi(100, 'male')).toBeCloseTo(
      FFMI_PIECEWISE_MALE_MAX_NATURAL,
      10
    );
    expect(invertFfmiPiecewiseScoreToFfmi(110, 'male')).toBeCloseTo(27, 10);
  });

  it('round-trips decade gates: score(invert(s)) >= s', () => {
    for (const gate of [40, 50, 60, 70, 80, 90, 100, 110, 120]) {
      const adj = invertFfmiPiecewiseScoreToFfmi(gate, 'male');
      expect(ffmiPiecewiseScore(adj, true)).toBeGreaterThanOrEqual(gate - 1e-9);
    }
    for (const gate of [40, 60, 100, 110]) {
      const adj = invertFfmiPiecewiseScoreToFfmi(gate, 'female');
      expect(ffmiPiecewiseScore(adj, false)).toBeGreaterThanOrEqual(gate - 1e-9);
    }
  });

  it('returns 0 for non-positive targets', () => {
    expect(invertFfmiPiecewiseScoreToFfmi(0, 'male')).toBe(0);
    expect(invertFfmiPiecewiseScoreToFfmi(-5, 'female')).toBe(0);
  });
});

describe('leanMassKgFromAdjustedFfmi', () => {
  it('undoes tall correction above 1.8 m', () => {
    const heightM = 1.9;
    const weightKg = 85;
    const bf = 12;
    const adjusted = computeAdjustedFfmi(heightM, weightKg, bf);
    const lean = leanMassKgFromAdjustedFfmi(adjusted, heightM);
    const expectedFfm = weightKg * (1 - bf / 100);
    expect(lean).toBeCloseTo(expectedFfm, 1);
  });

  it('uses raw FFMI × h² at or below 1.8 m', () => {
    const heightM = 1.75;
    const adjusted = 22;
    expect(leanMassKgFromAdjustedFfmi(adjusted, heightM)).toBeCloseTo(
      adjusted * heightM * heightM,
      10
    );
  });
});

describe('resolveFfmiMilestoneRawGap dual-state', () => {
  it('path A: fatLoss (−%) at fixed weight when target BF stays above promise floor', () => {
    const heightM = 1.75;
    const weightKg = 75;
    const bf = 15;
    const score =
      Math.round(ffmiPiecewiseScore(computeAdjustedFfmi(heightM, weightKg, bf), true) * 100) /
      100;
    const { nextMilestone } = resolveScoreMeaningMilestone('bodyFat', score);
    expect(nextMilestone).not.toBeNull();

    const gap = resolveFfmiMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentWeightKg: weightKg,
      currentBfPercent: bf,
      heightM,
      gender: 'male',
    });
    expect(gap).not.toBeNull();
    expect(gap!.type).toBe('fatLoss');
    if (gap?.type !== 'fatLoss') return;
    expect(gap.unit).toBe('%');
    expect(gap.delta).toBeGreaterThanOrEqual(0.1);

    const nextBf = bf - gap.delta;
    const nextScore =
      Math.round(
        ffmiPiecewiseScore(computeAdjustedFfmi(heightM, weightKg, nextBf), true) * 100
      ) / 100;
    expect(nextScore).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('path A: tall athletes can still fat-lose when weight leaves BF above floor', () => {
    const gap = resolveFfmiMilestoneRawGap({
      nextMilestoneScore: 100,
      currentWeightKg: 100,
      currentBfPercent: 15,
      heightM: 1.92,
      gender: 'male',
    });
    expect(gap?.type).toBe('fatLoss');
    if (gap?.type !== 'fatLoss') return;

    const nextScore =
      Math.round(
        ffmiPiecewiseScore(computeAdjustedFfmi(1.92, 100, 15 - gap.delta), true) * 100
      ) / 100;
    expect(nextScore).toBeGreaterThanOrEqual(100);
  });

  it('path B: high-tier / light body (≈96.74→100) smart-switches to leanGain (+kg)', () => {
    // Screenshot band: ~97 pts, next gate 100; light body so maintain-weight target BF < promise floor.
    const heightM = 1.75;
    const weightKg = 78;
    const bf = 4.2;
    const score =
      Math.round(ffmiPiecewiseScore(computeAdjustedFfmi(heightM, weightKg, bf), true) * 100) /
      100;
    expect(score).toBeGreaterThan(90);
    expect(score).toBeLessThan(100);

    const { nextMilestone, remainingPoints } = resolveScoreMeaningMilestone('bodyFat', score);
    expect(nextMilestone).toBe(100);
    expect(remainingPoints).toBeGreaterThan(0);

    const targetFfm = leanMassKgFromAdjustedFfmi(
      invertFfmiPiecewiseScoreToFfmi(100, 'male'),
      heightM
    )!;
    const targetBf = (1 - targetFfm / weightKg) * 100;
    expect(targetBf).toBeLessThan(resolveMilestonePromiseBfFloor('male'));

    const gap = resolveFfmiMilestoneRawGap({
      nextMilestoneScore: 100,
      currentWeightKg: weightKg,
      currentBfPercent: bf,
      heightM,
      gender: 'male',
    });
    expect(gap?.type).toBe('leanGain');
    if (gap?.type !== 'leanGain') return;
    expect(gap.unit).toBe('kg');
    expect(gap.delta).toBeGreaterThanOrEqual(0.1);

    const leanFraction = 1 - bf / 100;
    const currentFfm = weightKg * leanFraction;
    const nextWeight = (currentFfm + gap.delta) / leanFraction;
    const nextScore =
      Math.round(
        ffmiPiecewiseScore(computeAdjustedFfmi(heightM, nextWeight, bf), true) * 100
      ) / 100;
    expect(nextScore).toBeGreaterThanOrEqual(100);
  });

  it('path B: switches when male target BF is below page input min (3%) even if above survival 2%', () => {
    expect(resolveMilestonePromiseBfFloor('male')).toBe(FFMI_BODY_FAT_INPUT_MIN_PCT);
    expect(MIN_SURVIVAL_BF_PERCENT_MALE).toBe(2.0);

    const heightM = 1.8;
    const targetAdj = invertFfmiPiecewiseScoreToFfmi(100, 'male');
    const targetFfm = leanMassKgFromAdjustedFfmi(targetAdj, heightM)!;
    const weightKg = targetFfm / (1 - 0.025);
    const targetBf = (1 - targetFfm / weightKg) * 100;
    expect(targetBf).toBeGreaterThan(MIN_SURVIVAL_BF_PERCENT_MALE);
    expect(targetBf).toBeLessThan(FFMI_BODY_FAT_INPUT_MIN_PCT);

    const gap = resolveFfmiMilestoneRawGap({
      nextMilestoneScore: 100,
      currentWeightKg: weightKg,
      currentBfPercent: 12,
      heightM,
      gender: 'male',
    });
    expect(gap?.type).toBe('leanGain');
  });

  it('path B: switches when female target BF is below survival floor (8.0%)', () => {
    expect(MIN_SURVIVAL_BF_PERCENT_FEMALE).toBe(8.0);
    expect(resolveMilestonePromiseBfFloor('female')).toBe(MIN_SURVIVAL_BF_PERCENT_FEMALE);

    const heightM = 1.65;
    const weightKg = 55;
    const targetAdj = invertFfmiPiecewiseScoreToFfmi(100, 'female');
    const targetFfm = leanMassKgFromAdjustedFfmi(targetAdj, heightM)!;
    const targetBf = (1 - targetFfm / weightKg) * 100;
    expect(targetBf).toBeLessThan(MIN_SURVIVAL_BF_PERCENT_FEMALE);

    const gap = resolveFfmiMilestoneRawGap({
      nextMilestoneScore: 100,
      currentWeightKg: weightKg,
      currentBfPercent: 18,
      heightM,
      gender: 'female',
    });
    expect(gap?.type).toBe('leanGain');
    if (gap?.type !== 'leanGain') return;

    const leanFraction = 1 - 18 / 100;
    const nextWeight = (weightKg * leanFraction + gap.delta) / leanFraction;
    const nextScore =
      Math.round(
        ffmiPiecewiseScore(computeAdjustedFfmi(heightM, nextWeight, 18), false) * 100
      ) / 100;
    expect(nextScore).toBeGreaterThanOrEqual(100);
  });

  it('returns null when target adjusted FFMI exceeds human cap', () => {
    const scoreAtCap = Math.round(ffmiPiecewiseScore(FFMI_HUMAN_CAP_MALE, true) * 100) / 100;
    expect(
      resolveFfmiMilestoneRawGap({
        nextMilestoneScore: scoreAtCap + 10,
        currentWeightKg: 90,
        currentBfPercent: 8,
        heightM: 1.8,
        gender: 'male',
      })
    ).toBeNull();
    expect(
      resolveFfmiMilestoneRawGap({
        nextMilestoneScore:
          Math.round(ffmiPiecewiseScore(FFMI_HUMAN_CAP_FEMALE + 1, false) * 100) / 100,
        currentWeightKg: 60,
        currentBfPercent: 18,
        heightM: 1.65,
        gender: 'female',
      })
    ).toBeNull();
  });

  it('returns null when already at or past required lean/BF for the gate', () => {
    const heightM = 1.8;
    const weightKg = 80;
    const targetAdj = invertFfmiPiecewiseScoreToFfmi(90, 'male');
    const targetFfm = leanMassKgFromAdjustedFfmi(targetAdj, heightM)!;
    const targetBf = (1 - targetFfm / weightKg) * 100;
    expect(
      resolveFfmiMilestoneRawGap({
        nextMilestoneScore: 90,
        currentWeightKg: weightKg,
        currentBfPercent: Math.max(3, targetBf - 2),
        heightM,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('returns null for missing / invalid inputs', () => {
    expect(
      resolveFfmiMilestoneRawGap({
        nextMilestoneScore: 80,
        currentWeightKg: 0,
        currentBfPercent: 15,
        heightM: 1.75,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('never under-promises: advertised dual-state delta clears production score', () => {
    const cases: Array<{
      heightM: number;
      weightKg: number;
      bf: number;
      gender: 'male' | 'female';
    }> = [
      { heightM: 1.75, weightKg: 75, bf: 15, gender: 'male' },
      { heightM: 1.75, weightKg: 72, bf: 10, gender: 'male' },
      { heightM: 1.92, weightKg: 90, bf: 14, gender: 'male' },
      { heightM: 1.65, weightKg: 55, bf: 18, gender: 'female' },
      { heightM: 1.65, weightKg: 58, bf: 22, gender: 'female' },
    ];

    for (const c of cases) {
      const isMale = c.gender === 'male';
      const score =
        Math.round(
          ffmiPiecewiseScore(computeAdjustedFfmi(c.heightM, c.weightKg, c.bf), isMale) * 100
        ) / 100;
      const { nextMilestone } = resolveScoreMeaningMilestone('bodyFat', score);
      if (nextMilestone === null) continue;

      const gap = resolveFfmiMilestoneRawGap({
        nextMilestoneScore: nextMilestone,
        currentWeightKg: c.weightKg,
        currentBfPercent: c.bf,
        heightM: c.heightM,
        gender: c.gender,
      });
      if (gap === null) continue;

      if (gap.type === 'fatLoss') {
        const nextBf = c.bf - gap.delta;
        const nextScore =
          Math.round(
            ffmiPiecewiseScore(computeAdjustedFfmi(c.heightM, c.weightKg, nextBf), isMale) * 100
          ) / 100;
        expect(nextScore).toBeGreaterThanOrEqual(nextMilestone);
      } else {
        const leanFraction = 1 - c.bf / 100;
        const nextWeight = (c.weightKg * leanFraction + gap.delta) / leanFraction;
        const nextScore =
          Math.round(
            ffmiPiecewiseScore(computeAdjustedFfmi(c.heightM, nextWeight, c.bf), isMale) * 100
          ) / 100;
        expect(nextScore).toBeGreaterThanOrEqual(nextMilestone);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  computeStrengthFiveLiftLadderMeanScore,
  computeStrengthSbdOneRmSumKg,
  mergeScoreMapWithResolvedStrength,
  persistedFromStrengthForm,
  resolveStrengthLadderWeightKgSummary,
  resolveStrengthScoreFromInputs,
  shouldShowStrengthRepsAccuracyNudge,
  strengthFormFromPersisted,
  tryComputeSingleLiftStrength,
  tryComputeStrengthAssessmentScore,
} from '../strengthAssessment';
import { STRENGTH_WEIGHT_LIMIT_KG } from '../strengthWeightLimits';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function emptyForm() {
  return strengthFormFromPersisted(null);
}

describe('shouldShowStrengthRepsAccuracyNudge', () => {
  it('is false without positive weight', () => {
    expect(shouldShowStrengthRepsAccuracyNudge('', '8')).toBe(false);
    expect(shouldShowStrengthRepsAccuracyNudge('0', '8')).toBe(false);
  });

  it('is false for reps below threshold', () => {
    expect(shouldShowStrengthRepsAccuracyNudge('100', '6')).toBe(false);
  });

  it('is true for integer reps 7–10 with valid weight', () => {
    expect(shouldShowStrengthRepsAccuracyNudge('100', '7')).toBe(true);
    expect(shouldShowStrengthRepsAccuracyNudge('100', '10')).toBe(true);
  });

  it('is false for non-integer reps', () => {
    expect(shouldShowStrengthRepsAccuracyNudge('100', '7.5')).toBe(false);
  });
});

describe('tryComputeSingleLiftStrength', () => {
  it('rejects non-integer reps', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '7.5' };
    const r = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('invalid-reps');
  });

  it('returns empty-row when both fields blank', () => {
    const form = emptyForm();
    const r = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('empty-row');
  });

  it('computes one lift independently', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const r = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.oneRepMax).toBeGreaterThan(0);
      expect(r.finalScore).toBeGreaterThan(0);
    }
  });

  it('caps weight above model ceiling and matches uncapped ceiling score', () => {
    const formOver = emptyForm();
    formOver.benchPress = { weight: '400', reps: '5' };
    const formAtCap = emptyForm();
    formAtCap.benchPress = { weight: String(STRENGTH_WEIGHT_LIMIT_KG.benchPress), reps: '5' };
    const over = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form: formOver,
      profile: baseProfile,
      profileReady: true,
    });
    const atCap = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form: formAtCap,
      profile: baseProfile,
      profileReady: true,
    });
    expect(over.ok && atCap.ok).toBe(true);
    if (over.ok && atCap.ok) {
      expect(over.weightCapped).toBe(true);
      expect(over.weightInputKg).toBe(400);
      expect(over.weightUsedKg).toBe(STRENGTH_WEIGHT_LIMIT_KG.benchPress);
      expect(over.modelMaxKg).toBe(STRENGTH_WEIGHT_LIMIT_KG.benchPress);
      expect(over.finalScore).toBeCloseTo(atCap.finalScore, 5);
    }
  });

  it('caps lat pulldown at 300 kg and matches uncapped ceiling score', () => {
    const formOver = emptyForm();
    formOver.latPulldown = { weight: '301', reps: '5' };
    const formAtCap = emptyForm();
    formAtCap.latPulldown = { weight: String(STRENGTH_WEIGHT_LIMIT_KG.latPulldown), reps: '5' };
    const over = tryComputeSingleLiftStrength({
      lift: 'latPulldown',
      form: formOver,
      profile: baseProfile,
      profileReady: true,
    });
    const atCap = tryComputeSingleLiftStrength({
      lift: 'latPulldown',
      form: formAtCap,
      profile: baseProfile,
      profileReady: true,
    });
    expect(over.ok && atCap.ok).toBe(true);
    if (over.ok && atCap.ok) {
      expect(over.weightCapped).toBe(true);
      expect(over.weightInputKg).toBe(301);
      expect(over.weightUsedKg).toBe(300);
      expect(over.modelMaxKg).toBe(300);
      expect(over.finalScore).toBeCloseTo(atCap.finalScore, 5);
    }
  });

  it('passes through lat pulldown at exactly 300 kg without cap', () => {
    const form = emptyForm();
    form.latPulldown = { weight: '300', reps: '5' };
    const r = tryComputeSingleLiftStrength({
      lift: 'latPulldown',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.weightCapped).toBe(false);
      expect(r.weightUsedKg).toBe(300);
      expect(r.modelMaxKg).toBe(300);
    }
  });

  it('matches combined batch branch for the same row', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const single = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    const batch = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(single.ok && batch.ok).toBe(true);
    if (single.ok && batch.ok) {
      const benchBranch = batch.breakdown.branches.find((b) => b.lift === 'benchPress');
      expect(benchBranch?.finalScore).toBe(single.finalScore);
      expect(benchBranch?.oneRepMax).toBe(single.oneRepMax);
    }
  });
});

describe('tryComputeStrengthAssessmentScore', () => {
  it('rejects when profile incomplete', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: null,
      profileReady: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('missing-profile');
  });

  it('rejects when no lifts completed', () => {
    const r = tryComputeStrengthAssessmentScore({
      form: emptyForm(),
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('no-inputs');
  });

  it('rejects partial row', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('pair-incomplete');
  });

  it('uses fixed /5 composite (single filled lift: total score / 5)', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.breakdown.branches).toHaveLength(1);
      expect(r.breakdown.branches[0].lift).toBe('benchPress');
      const one = r.breakdown.branches[0].finalScore;
      const expectedRaw = Math.round((one / 5) * 100) / 100;
      expect(r.breakdown.averageRaw).toBeCloseTo(expectedRaw, 5);
      expect(r.score).toBeGreaterThan(0);
      expect(r.score).toBeLessThanOrEqual(200);
      expect(r.persisted.lifts?.benchPress).toEqual({ weightKg: 100, reps: 5 });
      expect(r.persisted.bodyWeightKgSnapshot).toBe(80);
    }
  });

  it('uses fixed /5 composite for two lifts (sum of branch scores / 5)', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    form.squat = { weight: '120', reps: '5' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.breakdown.branches).toHaveLength(2);
      const a = r.breakdown.branches.find((x) => x.lift === 'benchPress')!.finalScore;
      const s = r.breakdown.branches.find((x) => x.lift === 'squat')!.finalScore;
      const expectedRaw = Math.round(((a + s) / 5) * 100) / 100;
      expect(r.breakdown.averageRaw).toBeCloseTo(expectedRaw, 5);
    }
  });

  it('marks branch capped and persists clamped weight when over ceiling', () => {
    const form = emptyForm();
    form.benchPress = { weight: '400', reps: '5' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const b = r.breakdown.branches[0];
      expect(b.weightCapped).toBe(true);
      expect(b.inputWeightKg).toBe(400);
      expect(b.modelMaxKg).toBe(STRENGTH_WEIGHT_LIMIT_KG.benchPress);
      expect(b.weightKg).toBe(STRENGTH_WEIGHT_LIMIT_KG.benchPress);
      expect(r.persisted.lifts?.benchPress?.weightKg).toBe(STRENGTH_WEIGHT_LIMIT_KG.benchPress);
    }
  });
});

describe('resolveStrengthScoreFromInputs', () => {
  it('returns null when persisted has only snapshot and no lifts', () => {
    expect(resolveStrengthScoreFromInputs(baseProfile, { bodyWeightKgSnapshot: 80 })).toBeNull();
  });

  it('forgiving mode skips invalid lift cells and still scores valid ones', () => {
    const score = resolveStrengthScoreFromInputs(baseProfile, {
      lifts: {
        benchPress: { weightKg: 100, reps: 5 },
        squat: { weightKg: Number.NaN, reps: 5 },
      },
    });
    expect(score).not.toBeNull();
    const benchOnly = resolveStrengthScoreFromInputs(baseProfile, {
      lifts: { benchPress: { weightKg: 100, reps: 5 } },
    });
    expect(score).toBe(benchOnly);
  });

  it('forgiving mode skips non-integer persisted reps', () => {
    const withFloat = resolveStrengthScoreFromInputs(baseProfile, {
      lifts: {
        benchPress: { weightKg: 100, reps: 5 },
        squat: { weightKg: 120, reps: 5.5 },
      },
    });
    const benchOnly = resolveStrengthScoreFromInputs(baseProfile, {
      lifts: { benchPress: { weightKg: 100, reps: 5 } },
    });
    expect(withFloat).toBe(benchOnly);
  });
});

describe('mergeScoreMapWithResolvedStrength', () => {
  it('leaves scores when no strength inputs', () => {
    const merged = mergeScoreMapWithResolvedStrength({ strength: 55 }, baseProfile, null);
    expect(merged.strength).toBe(55);
  });

  it('overwrites strength when inputs resolve', () => {
    const persisted = persistedFromStrengthForm(
      {
        ...emptyForm(),
        benchPress: { weight: '100', reps: '5' },
        squat: { weight: '', reps: '' },
        deadlift: { weight: '', reps: '' },
        latPulldown: { weight: '', reps: '' },
        shoulderPress: { weight: '', reps: '' },
      },
      baseProfile.weightKg
    );
    const merged = mergeScoreMapWithResolvedStrength({ strength: 12 }, baseProfile, persisted);
    const direct = resolveStrengthScoreFromInputs(baseProfile, persisted);
    expect(direct).not.toBeNull();
    expect(merged.strength).toBe(direct);
    expect(merged.strength).not.toBe(12);
  });
});

describe('persistedFromStrengthForm', () => {
  it('persists capped kg when input exceeds model ceiling', () => {
    const form = emptyForm();
    form.benchPress = { weight: '400', reps: '5' };
    const p = persistedFromStrengthForm(form, 80);
    expect(p.lifts?.benchPress?.weightKg).toBe(STRENGTH_WEIGHT_LIMIT_KG.benchPress);
    expect(p.lifts?.benchPress?.reps).toBe(5);
  });

  it('omits lifts with non-integer reps', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '7.5' };
    form.squat = { weight: '120', reps: '5' };
    const p = persistedFromStrengthForm(form, 80);
    expect(p.lifts?.benchPress).toBeUndefined();
    expect(p.lifts?.squat).toEqual({ weightKg: 120, reps: 5 });
  });
});

describe('strengthFormFromPersisted', () => {
  it('round-trips numeric fields as strings', () => {
    const persisted = persistedFromStrengthForm(
      {
        ...emptyForm(),
        deadlift: { weight: '180', reps: '3' },
        benchPress: { weight: '', reps: '' },
        squat: { weight: '', reps: '' },
        latPulldown: { weight: '', reps: '' },
        shoulderPress: { weight: '', reps: '' },
      },
      80
    );
    const form = strengthFormFromPersisted(persisted);
    expect(form.deadlift).toEqual({ weight: '180', reps: '3' });
  });
});

describe('strength ladder display helpers', () => {
  const twoLiftInputs = {
    lifts: {
      benchPress: { weightKg: 100, reps: 5 },
      squat: { weightKg: 120, reps: 5 },
    },
    bodyWeightKgSnapshot: 80,
  } as const;

  const sbdInputs = {
    lifts: {
      benchPress: { weightKg: 100, reps: 5 },
      squat: { weightKg: 120, reps: 5 },
      deadlift: { weightKg: 140, reps: 5 },
    },
    bodyWeightKgSnapshot: 80,
  } as const;

  it('computeStrengthFiveLiftLadderMeanScore matches /5 composite (ladder = radar)', () => {
    const mean = computeStrengthFiveLiftLadderMeanScore(baseProfile, twoLiftInputs);
    const radar = resolveStrengthScoreFromInputs(baseProfile, twoLiftInputs);
    expect(mean).not.toBeNull();
    expect(radar).not.toBeNull();
    expect(mean).toBe(radar);
  });

  it('computeStrengthSbdOneRmSumKg is null unless squat, bench, and deadlift all score', () => {
    expect(computeStrengthSbdOneRmSumKg(baseProfile, twoLiftInputs)).toBeNull();
    const kg = computeStrengthSbdOneRmSumKg(baseProfile, sbdInputs);
    expect(kg).not.toBeNull();
    expect(kg!).toBeGreaterThan(0);
  });

  it('resolveStrengthLadderWeightKgSummary differs composite mean vs five-lift sum of 1RM', () => {
    const composite = resolveStrengthLadderWeightKgSummary(baseProfile, twoLiftInputs, 'composite');
    const fiveTotal = resolveStrengthLadderWeightKgSummary(baseProfile, twoLiftInputs, 'fiveTotal');
    expect(composite?.unit).toBe('kg');
    expect(fiveTotal?.unit).toBe('kg');
    expect(composite?.weightKg).not.toBe(fiveTotal?.weightKg);
  });
});

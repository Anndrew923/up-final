import { describe, expect, it } from 'vitest';
import {
  applySupplementalTargetsToMergedScores,
  buildArmSizeAssessmentSupplementalTargets,
  buildExplosiveAssessmentSupplementalTargets,
  buildFfmiAssessmentSupplementalTargets,
  buildGripAssessmentSupplementalTargets,
  buildCardioAssessmentSupplementalTargets,
  buildMuscleAssessmentSupplementalTargets,
  buildStrengthAssessmentSupplementalTargets,
  mergeMergedScoresForAssessmentUpload,
} from '../assessmentLadderSupplemental';
import { evaluateFfmiScoring } from '../ffmiScoring';
import { strengthFormFromPersisted } from '../strengthAssessment';
import type { PhysicalProfile } from '../../../types/userProfile';

const maleProfile30: PhysicalProfile = {
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  jobCategory: 'coach',
  countryCode: 'TW',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('applySupplementalTargetsToMergedScores', () => {
  it('overlays bodyFat from bodyFat_ffmi supplemental', () => {
    const next = applySupplementalTargetsToMergedScores(
      { bodyFat: 80, strength: 70 },
      [{ metric: 'bodyFat_ffmi', score: 95 }]
    );
    expect(next.bodyFat).toBe(95);
    expect(next.strength).toBe(70);
  });
});

describe('mergeMergedScoresForAssessmentUpload', () => {
  it('applies mergedOverrides then supplemental axis overlay', () => {
    const merged = mergeMergedScoresForAssessmentUpload(
      { bodyFat: 80, cardio: 70 },
      {
        supplemental: [{ metric: 'cardio_5km', score: 82 }],
        mergedOverrides: { cardio: 90 },
      }
    );
    expect(merged.cardio).toBe(82);
  });
});

describe('buildFfmiAssessmentSupplementalTargets', () => {
  it('returns empty when world-record lock blocks radar submit', () => {
    const locked = evaluateFfmiScoring({
      gender: 'male',
      heightCm: 155,
      weightKg: 110,
      bodyFatPct: 1,
    });
    expect(locked.allowsRadarSubmit).toBe(false);
    expect(buildFfmiAssessmentSupplementalTargets(locked).supplemental).toEqual([]);
  });

  it('returns ffmi shard when submit is allowed', () => {
    const breakdown = evaluateFfmiScoring({
      gender: 'male',
      heightCm: maleProfile30.heightCm,
      weightKg: maleProfile30.weightKg,
      bodyFatPct: 15,
    });
    const bundle = buildFfmiAssessmentSupplementalTargets(breakdown);
    expect(bundle.supplemental).toHaveLength(1);
    expect(bundle.supplemental[0]?.metric).toBe('bodyFat_ffmi');
    expect(bundle.mergedOverrides?.bodyFat).toBe(breakdown.submittedScore);
  });
});

describe('buildCardioAssessmentSupplementalTargets', () => {
  it('builds cooper shard from live inputs without persisted cardio', () => {
    const bundle = buildCardioAssessmentSupplementalTargets({
      tab: 'cooper',
      distanceInput: '2800',
      runMinutesInput: '',
      runSecondsInput: '',
      profile: maleProfile30,
      profileReady: true,
    });
    expect(bundle.supplemental).toHaveLength(1);
    expect(bundle.supplemental[0]?.metric).toBe('cardio');
    expect(bundle.mergedOverrides?.cardio).toBeGreaterThan(0);
  });
});

describe('buildGripAssessmentSupplementalTargets', () => {
  it('returns empty for invalid preview', () => {
    expect(buildGripAssessmentSupplementalTargets(null).supplemental).toEqual([]);
    expect(buildGripAssessmentSupplementalTargets(0).supplemental).toEqual([]);
  });

  it('maps grip shard and six-axis override', () => {
    const bundle = buildGripAssessmentSupplementalTargets(88.5);
    expect(bundle.supplemental).toEqual([{ metric: 'gripStrength', score: 88.5 }]);
    expect(bundle.mergedOverrides?.gripStrength).toBe(88.5);
  });
});

describe('buildArmSizeAssessmentSupplementalTargets', () => {
  it('shard only — no six-axis mergedOverrides', () => {
    const bundle = buildArmSizeAssessmentSupplementalTargets({
      previewScore: 120,
      submittedScore: null,
    });
    expect(bundle.supplemental).toEqual([{ metric: 'armSize', score: 120 }]);
    expect(bundle.mergedOverrides).toBeUndefined();
  });
});

describe('buildMuscleAssessmentSupplementalTargets', () => {
  it('aligns composite shard with mergedOverrides.muscleMass', () => {
    const bundle = buildMuscleAssessmentSupplementalTargets({
      smmInput: '40',
      profile: maleProfile30,
      profileReady: true,
    });
    const composite = bundle.supplemental.find((t) => t.metric === 'muscleMass');
    expect(composite?.score).toBeGreaterThan(0);
    expect(bundle.mergedOverrides?.muscleMass).toBe(composite?.score);
  });
});

describe('buildExplosiveAssessmentSupplementalTargets', () => {
  it('aligns composite shard with mergedOverrides.explosivePower', () => {
    const bundle = buildExplosiveAssessmentSupplementalTargets({
      verticalJumpInput: '50',
      standingLongJumpInput: '',
      sprintInput: '',
      profile: maleProfile30,
      profileReady: true,
    });
    const composite = bundle.supplemental.find((t) => t.metric === 'explosive_composite');
    expect(composite?.score).toBeGreaterThan(0);
    expect(bundle.mergedOverrides?.explosivePower).toBe(composite?.score);
  });
});

describe('buildStrengthAssessmentSupplementalTargets', () => {
  it('includes bench shard and strength axis when form has one lift', () => {
    const form = strengthFormFromPersisted(null);
    form.benchPress = { weight: '100', reps: '5' };
    const bundle = buildStrengthAssessmentSupplementalTargets({
      form,
      profile: maleProfile30,
      profileReady: true,
      combinedScore: null,
    });
    expect(bundle.supplemental.some((t) => t.metric === 'strength_bench')).toBe(true);
    expect(bundle.mergedOverrides?.strength).toBeGreaterThan(0);
  });
});

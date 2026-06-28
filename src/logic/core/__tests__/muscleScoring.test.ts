import { describe, expect, it } from 'vitest';
import type { ScoreMap } from '../../../types/scoring';
import {
  calculateMuscleScores,
  calculateScoreFromStandard,
  composeMuscleCompositeScore,
  getMuscleAgeRange,
  getSmmKgCeilingForGender,
  mergeScoreMapWithResolvedMuscle,
  resolveMuscleDualSovereignI18nKey,
  resolveMuscleLadderScoreBundle,
  tryComputeMuscleAssessmentScore,
} from '../muscleScoring';
import { muscleStandardsMaleSMM } from '../muscleStandards';
import type { PhysicalProfile } from '../../../types/userProfile';

describe('getMuscleAgeRange', () => {
  it('maps mid-20s to 18-30', () => {
    expect(getMuscleAgeRange(25)).toBe('18-30');
  });
  it('returns null above 80', () => {
    expect(getMuscleAgeRange(81)).toBeNull();
  });
  it('returns null below 10', () => {
    expect(getMuscleAgeRange(9)).toBeNull();
  });
});

describe('calculateScoreFromStandard', () => {
  it('interpolates between deciles', () => {
    const row = muscleStandardsMaleSMM['18-30'];
    const score = calculateScoreFromStandard(40, row);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(60);
  });
});

describe('calculateMuscleScores', () => {
  it('matches reference-app composite for a male adult case', () => {
    const r = calculateMuscleScores({
      smmKg: 40,
      weightKg: 80,
      age: 25,
      gender: 'male',
    });
    expect(r.finalRawScore).not.toBeNull();
    expect(r.smPercent).toBeCloseTo(50, 5);
    expect(r.finalRawScore).toBeCloseTo(79.17, 1);
  });

  it('returns nulls when weight invalid', () => {
    const r = calculateMuscleScores({ smmKg: 30, weightKg: 0, age: 30, gender: 'male' });
    expect(r.finalRawScore).toBeNull();
  });
});

describe('composeMuscleCompositeScore (beast 80/20 + max defense)', () => {
  it('keeps equal mean when smm branch is at or below 100', () => {
    expect(composeMuscleCompositeScore(58.33, 100)).toBe(79.16);
    expect(composeMuscleCompositeScore(100, 120)).toBe(110);
  });

  it('uses max(equal, beast) when smm branch exceeds 100', () => {
    const equal = (104.17 + 123.74) / 2;
    const beast = 104.17 * 0.8 + 123.74 * 0.2;
    expect(composeMuscleCompositeScore(104.17, 123.74)).toBe(113.96);
    expect(equal).toBeGreaterThan(beast);
  });
});

describe('beast-mode composite scoring', () => {
  it('unlocks Hafthor-class heavy frames into LEGEND 150+', () => {
    const r = calculateMuscleScores({
      smmKg: 90,
      weightKg: 180,
      age: 30,
      gender: 'male',
    });
    expect(r.smmScoreRaw).toBe(193.33);
    expect(r.smPercentScoreRaw).toBe(100);
    expect(r.finalRawScore).toBe(174.66);
    expect(r.finalRawScore).toBeGreaterThanOrEqual(150);
  });

  it('unlocks Ronnie-class lean-mass titans above equal-mean baseline', () => {
    const r = calculateMuscleScores({
      smmKg: 90,
      weightKg: 134,
      age: 30,
      gender: 'male',
    });
    expect(r.smmScoreRaw).toBe(193.33);
    expect(r.smPercentScoreRaw).toBe(149.01);
    expect(r.finalRawScore).toBe(184.47);
    const equalMean = (193.33 + 149.01) / 2;
    expect(r.finalRawScore).toBeGreaterThan(equalMean);
  });

  it('prevents handoff sorting inversion at 91 kg / 49 vs 51 kg SMM', () => {
    const leaner = calculateMuscleScores({
      smmKg: 49,
      weightKg: 91,
      age: 30,
      gender: 'male',
    });
    const heavier = calculateMuscleScores({
      smmKg: 51,
      weightKg: 91,
      age: 30,
      gender: 'male',
    });
    expect(leaner.finalRawScore).toBe(106.66);
    expect(heavier.finalRawScore).toBe(113.96);
    expect((heavier.finalRawScore ?? 0) > (leaner.finalRawScore ?? 0)).toBe(true);
    expect((heavier.smmScoreRaw ?? 0) > (leaner.smmScoreRaw ?? 0)).toBe(true);
  });
});

describe('SMM ceiling', () => {
  it('returns male cap 90 and female cap 60', () => {
    expect(getSmmKgCeilingForGender('male')).toBe(90);
    expect(getSmmKgCeilingForGender('female')).toBe(60);
  });

  it('tryCompute rejects SMM above ceiling for male', () => {
    const profile: PhysicalProfile = {
      gender: 'male',
      age: 30,
      heightCm: 178,
      weightKg: 90,
      updatedAt: '',
    };
    const r = tryComputeMuscleAssessmentScore({
      smmInput: '90.1',
      profile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('smm-exceeds-ceiling');
  });

  it('tryCompute rejects SMM above female ceiling', () => {
    const profile: PhysicalProfile = {
      gender: 'female',
      age: 28,
      heightCm: 165,
      weightKg: 60,
      updatedAt: '',
    };
    const r = tryComputeMuscleAssessmentScore({
      smmInput: '60.1',
      profile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('smm-exceeds-ceiling');
  });

  it('tryCompute accepts SMM exactly at male ceiling', () => {
    const profile: PhysicalProfile = {
      gender: 'male',
      age: 30,
      heightCm: 178,
      weightKg: 120,
      updatedAt: '',
    };
    const r = tryComputeMuscleAssessmentScore({
      smmInput: '90',
      profile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
  });

  it('merge does not override when saved SMM exceeds ceiling', () => {
    const scores: ScoreMap = { muscleMass: 55 };
    const profile: PhysicalProfile = {
      gender: 'male',
      age: 25,
      heightCm: 178,
      weightKg: 100,
      updatedAt: '',
    };
    const merged = mergeScoreMapWithResolvedMuscle(scores, profile, {
      muscle: { smmKg: 90.1 },
    });
    expect(merged.muscleMass).toBe(55);
  });
});

describe('tryComputeMuscleAssessmentScore', () => {
  const profile: PhysicalProfile = {
    gender: 'male',
    age: 25,
    heightCm: 178,
    weightKg: 80,
    updatedAt: new Date().toISOString(),
  };

  it('rejects without profile', () => {
    const r = tryComputeMuscleAssessmentScore({
      smmInput: '40',
      profile: null,
      profileReady: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('missing-profile');
  });

  it('accepts valid SMM', () => {
    const r = tryComputeMuscleAssessmentScore({
      smmInput: '40',
      profile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.score).toBeGreaterThan(0);
      expect(r.breakdown.smPercent).toBeCloseTo(50, 5);
    }
  });

  it('rejects age out of table range', () => {
    const old: PhysicalProfile = { ...profile, age: 85 };
    const r = tryComputeMuscleAssessmentScore({
      smmInput: '35',
      profile: old,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('age-out-of-range');
  });
});

describe('mergeScoreMapWithResolvedMuscle', () => {
  it('overrides muscleMass when inputs and profile resolve', () => {
    const scores: ScoreMap = { muscleMass: 10 };
    const profile: PhysicalProfile = {
      gender: 'male',
      age: 25,
      heightCm: 178,
      weightKg: 80,
      updatedAt: '',
    };
    const merged = mergeScoreMapWithResolvedMuscle(scores, profile, {
      muscle: { smmKg: 40 },
    });
    expect(merged.muscleMass).not.toBe(10);
    expect(merged.muscleMass).toBeGreaterThan(50);
  });

  it('leaves scores unchanged when no muscle input', () => {
    const scores: ScoreMap = { muscleMass: 77 };
    const merged = mergeScoreMapWithResolvedMuscle(scores, null, null);
    expect(merged.muscleMass).toBe(77);
  });
});

describe('resolveMuscleLadderScoreBundle', () => {
  const profile: PhysicalProfile = {
    gender: 'male',
    age: 30,
    heightCm: 175,
    weightKg: 75,
    updatedAt: '',
  };

  it('exposes distinct weight-branch vs ratio-branch ladder scores', () => {
    const b = resolveMuscleLadderScoreBundle(profile, { muscle: { smmKg: 35 } });
    expect(b.composite).not.toBeNull();
    expect(b.weightBranchScore).not.toBeNull();
    expect(b.ratioBranchScore).not.toBeNull();
    expect(b.weightBranchScore).not.toBe(b.ratioBranchScore);
  });

  it('keeps ladder shards decoupled when composite uses beast max blend', () => {
    const hafthorProfile: PhysicalProfile = {
      gender: 'male',
      age: 30,
      heightCm: 205,
      weightKg: 180,
      updatedAt: '',
    };
    const b = resolveMuscleLadderScoreBundle(hafthorProfile, { muscle: { smmKg: 90 } });
    expect(b.composite).toBe(174.66);
    expect(b.weightBranchScore).toBe(193.33);
    expect(b.ratioBranchScore).toBe(100);
    expect(b.composite).not.toBe(b.weightBranchScore);
    expect(b.composite).not.toBe(b.ratioBranchScore);
  });
});

describe('resolveMuscleDualSovereignI18nKey', () => {
  it('maps ceiling and error keys by sex', () => {
    expect(resolveMuscleDualSovereignI18nKey('male', 'ceiling')).toBe(
      'muscle.standardsInfo.dualSovereignMale',
    );
    expect(resolveMuscleDualSovereignI18nKey('female', 'ceiling')).toBe(
      'muscle.standardsInfo.dualSovereignFemale',
    );
    expect(resolveMuscleDualSovereignI18nKey('male', 'exceedsCeiling')).toBe(
      'muscle.errors.smm-exceeds-ceilingMale',
    );
    expect(resolveMuscleDualSovereignI18nKey('female', 'exceedsCeiling')).toBe(
      'muscle.errors.smm-exceeds-ceilingFemale',
    );
  });
});

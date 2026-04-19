import { describe, expect, it } from 'vitest';
import type { ScoreMap } from '../../../types/scoring';
import {
  calculateMuscleScores,
  calculateScoreFromStandard,
  getMuscleAgeRange,
  getSmmKgCeilingForGender,
  mergeScoreMapWithResolvedMuscle,
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

describe('SMM ceiling', () => {
  it('returns male cap 75 and female cap 48', () => {
    expect(getSmmKgCeilingForGender('male')).toBe(75);
    expect(getSmmKgCeilingForGender('female')).toBe(48);
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
      smmInput: '76',
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
      smmInput: '48.1',
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
      smmInput: '75',
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
      muscle: { smmKg: 80 },
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

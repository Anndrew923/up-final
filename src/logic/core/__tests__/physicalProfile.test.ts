import { describe, expect, it } from 'vitest';
import {
  PHYSICAL_LIMITS,
  isPhysicalProfileComplete,
  validatePhysicalProfile,
} from '../physicalProfile';

describe('validatePhysicalProfile', () => {
  const valid = {
    gender: 'male' as const,
    age: 30,
    heightCm: 175,
    weightKg: 72.5,
  };

  it('accepts a valid payload and rounds decimals', () => {
    const r = validatePhysicalProfile(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.profile.age).toBe(30);
    expect(r.profile.heightCm).toBe(175);
    expect(r.profile.weightKg).toBe(72.5);
    expect(r.profile.gender).toBe('male');
    expect(r.profile.updatedAt).toMatch(/^\d{4}-/);
  });

  it('rejects missing gender', () => {
    const r = validatePhysicalProfile({ ...valid, gender: '' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('required-gender');
  });

  it('rejects age out of range', () => {
    const r = validatePhysicalProfile({ ...valid, age: 10 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('invalid-age');
  });

  it('rejects weight out of range', () => {
    const r = validatePhysicalProfile({ ...valid, weightKg: 10 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('invalid-weight');
  });

  it('parses numeric strings', () => {
    const r = validatePhysicalProfile({
      gender: 'female',
      age: '28',
      heightCm: '162.0',
      weightKg: '55.2',
    });
    expect(r.ok).toBe(true);
  });

  it('normalizes optional ladder segmentation fields', () => {
    const r = validatePhysicalProfile({
      ...valid,
      jobCategory: 'engineering',
      weeklyTrainingHours: '6.5',
      trainingYears: '3',
      countryCode: 'tw',
      city: '台北市',
      district: '信義區',
      isAnonymousInLadder: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.profile.jobCategory).toBe('engineering');
    expect(r.profile.weeklyTrainingHours).toBe(6.5);
    expect(r.profile.trainingYears).toBe(3);
    expect(r.profile.countryCode).toBe('TW');
    expect(r.profile.isAnonymousInLadder).toBe(true);
  });

  it('rejects invalid TW city', () => {
    const r = validatePhysicalProfile({
      ...valid,
      countryCode: 'TW',
      city: 'NotACity',
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('invalid-city');
  });

  it('rejects district without city', () => {
    const r = validatePhysicalProfile({
      ...valid,
      district: '信義區',
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('invalid-district');
  });

  it('rejects district that does not belong to TW city', () => {
    const r = validatePhysicalProfile({
      ...valid,
      countryCode: 'TW',
      city: '台北市',
      district: '板橋區',
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('invalid-district');
  });
});

describe('isPhysicalProfileComplete', () => {
  it('returns false for null', () => {
    expect(isPhysicalProfileComplete(null)).toBe(false);
  });

  it('returns true for valid stored snapshot', () => {
    expect(
      isPhysicalProfileComplete({
        gender: 'male',
        age: 40,
        heightCm: 180,
        weightKg: 80,
        updatedAt: '',
      })
    ).toBe(true);
  });

  it('documents limits for UX copy', () => {
    expect(PHYSICAL_LIMITS.ageMin).toBeLessThan(PHYSICAL_LIMITS.ageMax);
  });
});

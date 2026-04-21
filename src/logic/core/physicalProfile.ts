import type { PhysicalProfile, PhysicalProfileGender } from '../../types/userProfile';
import { LADDER_COUNTRY_CODES, LADDER_JOB_CATEGORIES } from '../../types/ladderProfile';
import { isValidTaiwanCity, isValidTaiwanDistrict } from '../../utils/taiwanDistricts';

export const PHYSICAL_LIMITS = {
  ageMin: 13,
  ageMax: 90,
  heightCmMin: 120,
  heightCmMax: 230,
  weightKgMin: 35,
  weightKgMax: 250,
} as const;

export type PhysicalProfileValidationErrorCode =
  | 'required-gender'
  | 'required-age'
  | 'required-height'
  | 'required-weight'
  | 'invalid-gender'
  | 'invalid-age'
  | 'invalid-height'
  | 'invalid-weight'
  | 'invalid-city'
  | 'invalid-district';

export type PhysicalProfileValidationResult =
  | { ok: true; profile: PhysicalProfile }
  | { ok: false; code: PhysicalProfileValidationErrorCode };

function isGender(v: unknown): v is PhysicalProfileGender {
  return v === 'male' || v === 'female';
}

function parseRequiredNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseOptionalString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

/**
 * Validates and normalizes numeric body fields for persistence.
 * All fields required for a complete baseline (assessment formulas expect a full row).
 */
export function validatePhysicalProfile(input: {
  gender: unknown;
  age: unknown;
  heightCm: unknown;
  weightKg: unknown;
  jobCategory?: unknown;
  weeklyTrainingHours?: unknown;
  trainingYears?: unknown;
  countryCode?: unknown;
  region?: unknown;
  city?: unknown;
  district?: unknown;
  isAnonymousInLadder?: unknown;
}): PhysicalProfileValidationResult {
  if (input.gender === undefined || input.gender === null || input.gender === '') {
    return { ok: false, code: 'required-gender' };
  }
  if (!isGender(input.gender)) {
    return { ok: false, code: 'invalid-gender' };
  }

  const age = parseRequiredNumber(input.age);
  const heightCm = parseRequiredNumber(input.heightCm);
  const weightKg = parseRequiredNumber(input.weightKg);

  if (age === null) {
    return { ok: false, code: 'required-age' };
  }
  if (heightCm === null) {
    return { ok: false, code: 'required-height' };
  }
  if (weightKg === null) {
    return { ok: false, code: 'required-weight' };
  }

  if (age < PHYSICAL_LIMITS.ageMin || age > PHYSICAL_LIMITS.ageMax) {
    return { ok: false, code: 'invalid-age' };
  }
  if (heightCm < PHYSICAL_LIMITS.heightCmMin || heightCm > PHYSICAL_LIMITS.heightCmMax) {
    return { ok: false, code: 'invalid-height' };
  }
  if (weightKg < PHYSICAL_LIMITS.weightKgMin || weightKg > PHYSICAL_LIMITS.weightKgMax) {
    return { ok: false, code: 'invalid-weight' };
  }

  const jobCategoryRaw = parseOptionalString(input.jobCategory);
  const jobCategory =
    jobCategoryRaw !== '' &&
    LADDER_JOB_CATEGORIES.includes(jobCategoryRaw as (typeof LADDER_JOB_CATEGORIES)[number])
      ? jobCategoryRaw
      : '';
  const countryRaw = parseOptionalString(input.countryCode).toUpperCase();
  const countryCode =
    countryRaw !== '' &&
    LADDER_COUNTRY_CODES.includes(countryRaw as (typeof LADDER_COUNTRY_CODES)[number])
      ? countryRaw
      : '';
  const weeklyTrainingHours = parseOptionalNumber(input.weeklyTrainingHours);
  const trainingYears = parseOptionalNumber(input.trainingYears);
  const region = parseOptionalString(input.region);
  const city = parseOptionalString(input.city);
  const district = parseOptionalString(input.district);
  const isAnonymousInLadder = input.isAnonymousInLadder === true;

  if (countryCode === 'TW' && city !== '' && !isValidTaiwanCity(city)) {
    return { ok: false, code: 'invalid-city' };
  }
  if (district !== '' && city === '') {
    return { ok: false, code: 'invalid-district' };
  }
  if (countryCode === 'TW' && district !== '' && !isValidTaiwanDistrict(city, district)) {
    return { ok: false, code: 'invalid-district' };
  }

  return {
    ok: true,
    profile: {
      gender: input.gender,
      age: Math.round(age),
      heightCm: Math.round(heightCm * 10) / 10,
      weightKg: Math.round(weightKg * 10) / 10,
      jobCategory,
      weeklyTrainingHours,
      trainingYears,
      countryCode,
      region,
      city,
      district,
      isAnonymousInLadder,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function isPhysicalProfileComplete(profile: PhysicalProfile | null | undefined): boolean {
  if (!profile) return false;
  const r = validatePhysicalProfile({
    gender: profile.gender,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  });
  return r.ok;
}

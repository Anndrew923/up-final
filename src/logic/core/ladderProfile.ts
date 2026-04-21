import type {
  LadderAgeBucket,
  LadderHeightBucket,
  LadderProfileDerived,
  LadderRegionScope,
  LadderWeightBucket,
} from '../../types/ladderProfile';

function toFiniteNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function deriveAgeBucket(age: number): LadderAgeBucket {
  if (age < 20) return 'under-20';
  if (age <= 29) return '20-29';
  if (age <= 39) return '30-39';
  if (age <= 49) return '40-49';
  if (age <= 59) return '50-59';
  if (age <= 69) return '60-69';
  return '70+';
}

export function deriveHeightBucket(heightCm: number): LadderHeightBucket {
  if (heightCm < 160) return '<160';
  if (heightCm <= 170) return '160-170';
  if (heightCm <= 180) return '170-180';
  if (heightCm <= 190) return '180-190';
  return '>190';
}

export function deriveWeightBucket(weightKg: number): LadderWeightBucket {
  if (weightKg < 50) return 'under-50kg';
  if (weightKg < 60) return '50-60kg';
  if (weightKg < 70) return '60-70kg';
  if (weightKg < 80) return '70-80kg';
  if (weightKg < 90) return '80-90kg';
  if (weightKg < 100) return '90-100kg';
  if (weightKg < 110) return '100-110kg';
  return '110kg+';
}

export function deriveRegionScope(input: {
  countryCode?: string | null;
  city?: string | null;
  district?: string | null;
}): LadderRegionScope {
  if (input.district && input.district.trim().length > 0) return 'district';
  if (input.city && input.city.trim().length > 0) return 'city';
  if (input.countryCode && input.countryCode.trim().length > 0) return 'country';
  return 'country';
}

/**
 * Derive all leaderboard filter buckets from raw profile primitives.
 * Returns `null` when required numeric fields are invalid.
 */
export function deriveLadderProfileBuckets(input: {
  age: unknown;
  heightCm: unknown;
  weightKg: unknown;
  countryCode?: string | null;
  city?: string | null;
  district?: string | null;
}): LadderProfileDerived | null {
  const age = toFiniteNumber(input.age);
  const heightCm = toFiniteNumber(input.heightCm);
  const weightKg = toFiniteNumber(input.weightKg);
  if (age === null || heightCm === null || weightKg === null) return null;

  return {
    ageBucket: deriveAgeBucket(age),
    heightBucket: deriveHeightBucket(heightCm),
    weightBucket: deriveWeightBucket(weightKg),
    regionScope: deriveRegionScope({
      countryCode: input.countryCode ?? '',
      city: input.city ?? '',
      district: input.district ?? '',
    }),
  };
}


/**
 * Canonical ladder segmentation/profile fields.
 *
 * This type is intentionally storage-facing and UI-agnostic:
 * - raw user inputs live here (age/height/weight/job/region)
 * - filter buckets are derived and cached for stable ladder filtering
 */

export type LadderGender = 'male' | 'female';

export type LadderJobCategory =
  | 'engineering'
  | 'medical'
  | 'coach'
  | 'student'
  | 'police_military'
  | 'business'
  | 'freelance'
  | 'service'
  | 'professional_athlete'
  | 'artist_performer'
  | 'other';

export type LadderCountryCode =
  | 'TW'
  | 'CN'
  | 'US'
  | 'JP'
  | 'KR'
  | 'SG'
  | 'MY'
  | 'HK'
  | 'MO'
  | 'TH'
  | 'VN'
  | 'PH'
  | 'ID'
  | 'AU'
  | 'NZ'
  | 'CA'
  | 'GB'
  | 'DE'
  | 'FR'
  | 'OTHER';

export type LadderAgeBucket =
  | 'under-20'
  | '20-29'
  | '30-39'
  | '40-49'
  | '50-59'
  | '60-69'
  | '70+';

export type LadderHeightBucket = '<160' | '160-170' | '170-180' | '180-190' | '>190';

export type LadderWeightBucket =
  | 'under-50kg'
  | '50-60kg'
  | '60-70kg'
  | '70-80kg'
  | '80-90kg'
  | '90-100kg'
  | '100-110kg'
  | '110kg+';

export type LadderRegionScope = 'country' | 'city' | 'district';

/** Stable order for ladder region-segmentation filters (UI + queries). */
export const LADDER_REGION_SCOPES = ['country', 'city', 'district'] as const satisfies readonly LadderRegionScope[];

export interface LadderProfileRaw {
  gender: LadderGender;
  age: number;
  heightCm: number;
  weightKg: number;
  jobCategory: LadderJobCategory | '';
  weeklyTrainingHours: number | null;
  trainingYears: number | null;
  countryCode: LadderCountryCode | '';
  region: string;
  city: string;
  district: string;
  isAnonymousInLadder: boolean;
}

export interface LadderProfileDerived {
  ageBucket: LadderAgeBucket;
  heightBucket: LadderHeightBucket;
  weightBucket: LadderWeightBucket;
  regionScope: LadderRegionScope;
}

export interface LadderProfileProjection extends LadderProfileRaw, LadderProfileDerived {}

/**
 * Shared option sets to keep UI and validation in sync.
 * Keep the order stable because it is reused by filter controls.
 */
export const LADDER_AGE_BUCKETS: readonly LadderAgeBucket[] = [
  'under-20',
  '20-29',
  '30-39',
  '40-49',
  '50-59',
  '60-69',
  '70+',
] as const;

export const LADDER_JOB_CATEGORIES: readonly LadderJobCategory[] = [
  'engineering',
  'medical',
  'coach',
  'student',
  'police_military',
  'business',
  'freelance',
  'service',
  'professional_athlete',
  'artist_performer',
  'other',
] as const;

export const LADDER_COUNTRY_CODES: readonly LadderCountryCode[] = [
  'TW',
  'CN',
  'US',
  'JP',
  'KR',
  'SG',
  'MY',
  'HK',
  'MO',
  'TH',
  'VN',
  'PH',
  'ID',
  'AU',
  'NZ',
  'CA',
  'GB',
  'DE',
  'FR',
  'OTHER',
] as const;

const LADDER_COUNTRY_CODE_SET = new Set<string>(LADDER_COUNTRY_CODES);

/** True when `value` is one of the canonical ladder country codes (for Firestore / filters). */
export function isLadderCountryCode(value: string | undefined | null): value is LadderCountryCode {
  return Boolean(value && LADDER_COUNTRY_CODE_SET.has(value));
}

export const LADDER_HEIGHT_BUCKETS: readonly LadderHeightBucket[] = [
  '<160',
  '160-170',
  '170-180',
  '180-190',
  '>190',
] as const;

export const LADDER_WEIGHT_BUCKETS: readonly LadderWeightBucket[] = [
  'under-50kg',
  '50-60kg',
  '60-70kg',
  '70-80kg',
  '80-90kg',
  '90-100kg',
  '100-110kg',
  '110kg+',
] as const;


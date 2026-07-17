/**
 * FFMI scoring — piecewise curve aligned with legacy fitness reference.
 * Human-limit FFMI anchors (42 male / 34 female): when raw adjusted FFMI exceeds
 * the anchor, {@link FfmiScoringBreakdown.allowsRadarSubmit} is false — do not write to radar.
 */

export const FFMI_HUMAN_CAP_MALE = 42;
export const FFMI_HUMAN_CAP_FEMALE = 34;

/** Aligned with FFMI page validation — single source for bounds checks. */
export const FFMI_BODY_FAT_INPUT_MIN_PCT = 3;
export const FFMI_BODY_FAT_INPUT_MAX_PCT = 60;

/** Parses draft body-fat % (empty → null; out of FFMI input band → null). */
export function parseFfmiBodyFatPctInput(raw: string | null | undefined): number | null {
  if (raw == null || String(raw).trim() === '') return null;
  const n = parseFloat(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n < FFMI_BODY_FAT_INPUT_MIN_PCT || n > FFMI_BODY_FAT_INPUT_MAX_PCT) return null;
  return n;
}

/** Male curve: base 18.5 → 60 pts; linear to 25 → 100; beyond +5 pts per FFMI unit. */
const MALE_BASE = 18.5;
const MALE_MAX_NATURAL = 25;

/** Female curve: base 15.5 → 60; linear to 21 → 100; beyond +5 per unit. */
const FEMALE_BASE = 15.5;
const FEMALE_MAX_NATURAL = 21;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Height-adjusted FFMI (tall correction above 1.8 m), same as reference fitness stack.
 */
export function computeAdjustedFfmi(heightM: number, weightKg: number, bodyFatPct: number): number {
  if (
    !Number.isFinite(heightM) ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(bodyFatPct) ||
    heightM <= 0 ||
    weightKg <= 0
  ) {
    return 0;
  }
  const bf = Math.min(99.9, Math.max(0, bodyFatPct)) / 100;
  const ffm = weightKg * (1 - bf);
  const raw = ffm / (heightM * heightM);
  const adjusted = heightM > 1.8 ? raw + 6 * (heightM - 1.8) : raw;
  return round2(adjusted);
}

function ffmiPiecewiseScore(adjustedFfmi: number, isMale: boolean): number {
  if (adjustedFfmi <= 0) return 0;

  if (isMale) {
    if (adjustedFfmi <= MALE_BASE) return (adjustedFfmi / MALE_BASE) * 60;
    if (adjustedFfmi < MALE_MAX_NATURAL)
      return 60 + ((adjustedFfmi - MALE_BASE) / (MALE_MAX_NATURAL - MALE_BASE)) * 40;
    return 100 + (adjustedFfmi - MALE_MAX_NATURAL) * 5;
  }

  if (adjustedFfmi <= FEMALE_BASE) return (adjustedFfmi / FEMALE_BASE) * 60;
  if (adjustedFfmi < FEMALE_MAX_NATURAL)
    return 60 + ((adjustedFfmi - FEMALE_BASE) / (FEMALE_MAX_NATURAL - FEMALE_BASE)) * 40;
  return 100 + (adjustedFfmi - FEMALE_MAX_NATURAL) * 5;
}

export interface FfmiScoringBreakdown {
  rawAdjustedFfmi: number;
  cappedAdjustedFfmi: number;
  uncappedScore: number;
  submittedScore: number;
  limitedByHumanCap: boolean;
  /** False when raw FFMI exceeds the sex-specific human-limit anchor — must not write to radar. */
  allowsRadarSubmit: boolean;
}

export function evaluateFfmiScoring(input: {
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
}): FfmiScoringBreakdown {
  const heightM = input.heightCm / 100;
  const rawAdjusted = computeAdjustedFfmi(heightM, input.weightKg, input.bodyFatPct);
  const cap = input.gender === 'male' ? FFMI_HUMAN_CAP_MALE : FFMI_HUMAN_CAP_FEMALE;
  const cappedAdjusted = Math.min(rawAdjusted, cap);
  const isMale = input.gender === 'male';
  const uncappedScore = round2(ffmiPiecewiseScore(rawAdjusted, isMale));
  const submittedScore = round2(ffmiPiecewiseScore(cappedAdjusted, isMale));
  const limitedByHumanCap = rawAdjusted > cap;

  return {
    rawAdjustedFfmi: rawAdjusted,
    cappedAdjustedFfmi: cappedAdjusted,
    uncappedScore,
    submittedScore,
    limitedByHumanCap,
    allowsRadarSubmit: !limitedByHumanCap,
  };
}

/** Category bucket suffix for i18n: `ffmi.category.male.<suffix>` */
export type FfmiMaleCategorySuffix =
  | 'r16_17'
  | 'r18_19'
  | 'r20_21'
  | 'r22'
  | 'r23_25'
  | 'r26_27'
  | 'r28_30';

export type FfmiFemaleCategorySuffix = 'r13_14' | 'r15_16' | 'r17_18' | 'r19_21' | 'r22plus';

export function getFfmiMaleCategorySuffix(adjustedFfmi: number): FfmiMaleCategorySuffix {
  if (adjustedFfmi < 18) return 'r16_17';
  if (adjustedFfmi < 20) return 'r18_19';
  if (adjustedFfmi < 22) return 'r20_21';
  if (adjustedFfmi < 23) return 'r22';
  if (adjustedFfmi < 26) return 'r23_25';
  if (adjustedFfmi < 28) return 'r26_27';
  return 'r28_30';
}

export function getFfmiFemaleCategorySuffix(adjustedFfmi: number): FfmiFemaleCategorySuffix {
  if (adjustedFfmi < 15) return 'r13_14';
  if (adjustedFfmi < 17) return 'r15_16';
  if (adjustedFfmi < 19) return 'r17_18';
  if (adjustedFfmi < 22) return 'r19_21';
  return 'r22plus';
}

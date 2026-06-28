import { normalizeGenderForNormTables } from './genderNormalize';
import { clampScoreMapValue } from './scoring';

export const ARM_SIZE_BENCHMARK_CM_MALE = 50;
export const ARM_SIZE_BASE_BODY_FAT_PCT_MALE = 20;
export const ARM_SIZE_BENCHMARK_CM_FEMALE = 35;
export const ARM_SIZE_BASE_BODY_FAT_PCT_FEMALE = 18;

/** @deprecated Use ARM_SIZE_BENCHMARK_CM_MALE — kept for legacy imports. */
export const ARM_SIZE_BENCHMARK_CM = ARM_SIZE_BENCHMARK_CM_MALE;
/** @deprecated Use ARM_SIZE_BASE_BODY_FAT_PCT_MALE — kept for legacy imports. */
export const ARM_SIZE_BASE_BODY_FAT_PCT = ARM_SIZE_BASE_BODY_FAT_PCT_MALE;

/** Product input ceiling — aligns with plausible upper-arm measurement range. */
export const ARM_SIZE_MAX_CM = 70;
export const ARM_SIZE_BODY_FAT_MIN_PCT = 3;
export const ARM_SIZE_BODY_FAT_MAX_PCT = 50;

export type ArmSizeNorm = Readonly<{
  benchmarkCm: number;
  baseBfPct: number;
}>;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveArmSizeNorm(gender: string | null | undefined): ArmSizeNorm {
  if (normalizeGenderForNormTables(gender) === 'female') {
    return {
      benchmarkCm: ARM_SIZE_BENCHMARK_CM_FEMALE,
      baseBfPct: ARM_SIZE_BASE_BODY_FAT_PCT_FEMALE,
    };
  }
  return {
    benchmarkCm: ARM_SIZE_BENCHMARK_CM_MALE,
    baseBfPct: ARM_SIZE_BASE_BODY_FAT_PCT_MALE,
  };
}

export interface ArmSizeScoringInput {
  armCircumferenceCm: number;
  bodyFatPct: number;
  /** Missing / unknown → male norm (mixed-leaderboard guardrail). */
  gender?: string | null;
}

export interface ArmSizeScoringResult {
  rawScore: number;
  submittedScore: number;
  limitedByAxisCap: boolean;
}

/**
 * WHY: Sex-decoupled PAS norms so elite female arm metrics are not scored on male 50 cm anchors.
 * IMPACT: Arm-size stays leaderboard-only; six-axis radar/overall remain untouched.
 */
export function evaluateArmSizeScore(input: ArmSizeScoringInput): ArmSizeScoringResult | null {
  const arm = Number(input.armCircumferenceCm);
  const bf = Number(input.bodyFatPct);
  if (!Number.isFinite(arm) || arm <= 0 || arm > ARM_SIZE_MAX_CM) return null;
  if (!Number.isFinite(bf) || bf < ARM_SIZE_BODY_FAT_MIN_PCT || bf > ARM_SIZE_BODY_FAT_MAX_PCT) {
    return null;
  }

  const { benchmarkCm, baseBfPct } = resolveArmSizeNorm(input.gender);
  const fatMultiplier = 1 + (baseBfPct - bf) / 100;
  const rawScore = round2((arm / benchmarkCm) * fatMultiplier * 100);
  const submittedScore = clampScoreMapValue(rawScore);
  return {
    rawScore,
    submittedScore,
    limitedByAxisCap: rawScore > submittedScore,
  };
}

import { clampScoreMapValue } from './scoring';

export const ARM_SIZE_BENCHMARK_CM = 50;
export const ARM_SIZE_BASE_BODY_FAT_PCT = 20;
/** Product input ceiling — aligns with plausible upper-arm measurement range. */
export const ARM_SIZE_MAX_CM = 70;
export const ARM_SIZE_BODY_FAT_MIN_PCT = 3;
export const ARM_SIZE_BODY_FAT_MAX_PCT = 50;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface ArmSizeScoringInput {
  armCircumferenceCm: number;
  bodyFatPct: number;
}

export interface ArmSizeScoringResult {
  rawScore: number;
  submittedScore: number;
  limitedByAxisCap: boolean;
}

/**
 * WHY: Preserve legacy arm-size formula continuity during migration from reference fitness flows.
 * IMPACT: Arm-size remains leaderboard-compatible while staying outside six-axis radar/overall logic.
 */
export function evaluateArmSizeScore(input: ArmSizeScoringInput): ArmSizeScoringResult | null {
  const arm = Number(input.armCircumferenceCm);
  const bf = Number(input.bodyFatPct);
  if (!Number.isFinite(arm) || arm <= 0 || arm > ARM_SIZE_MAX_CM) return null;
  if (
    !Number.isFinite(bf) ||
    bf < ARM_SIZE_BODY_FAT_MIN_PCT ||
    bf > ARM_SIZE_BODY_FAT_MAX_PCT
  ) {
    return null;
  }

  const fatMultiplier = 1 + (ARM_SIZE_BASE_BODY_FAT_PCT - bf) / 100;
  const rawScore = round2((arm / ARM_SIZE_BENCHMARK_CM) * fatMultiplier * 100);
  const submittedScore = clampScoreMapValue(rawScore);
  return {
    rawScore,
    submittedScore,
    limitedByAxisCap: rawScore > submittedScore,
  };
}

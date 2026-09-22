/**
 * Explosive milestone raw-gap — invert jump branch scores to cm and resolve "or-path" deltas.
 * WHY: Keep powerScoring focused on forward norms; milestone invert is a separate consumer surface.
 */
import type { PhysicalProfile } from '../../types/userProfile';
import {
  EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM,
  EXPLOSIVE_VERTICAL_JUMP_MAX_CM,
  getExplosiveStandingLongJumpCapCm,
  getExplosiveVerticalJumpCapCm,
  resolveExplosiveCapGender,
} from './explosiveInputCaps';
import {
  calculateSljScore,
  calculateVjumpScore,
  getPowerStandardsForProfile,
  type PowerStandardRow,
} from './powerScoring';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Invert shared 0→50→100 linear band (pre-overflow). Continuous; caller nudges for round2 gates. */
function invertScoreIncreasingLinearBand(
  targetScore: number,
  standard: PowerStandardRow,
): number {
  if (targetScore <= 50) {
    const denom = standard[50] - standard[0];
    if (denom <= 0) return standard[0];
    return standard[0] + (targetScore / 50) * denom;
  }
  const denomHigh = standard[100] - standard[50];
  if (denomHigh <= 0) return standard[50];
  return standard[50] + ((targetScore - 50) / 50) * denomHigh;
}

/**
 * Binary search cm in [t100, maxCm] so forwardScore(cm) >= targetScore.
 * WHY: Quartic overflow has no clean closed inverse; search stays deterministic and tiny.
 */
function invertIncreasingOverflowCm(
  targetScore: number,
  t100Cm: number,
  maxCm: number,
  forwardScore: (cm: number) => number,
): number | null {
  if (maxCm < t100Cm) return null;
  if (forwardScore(maxCm) < targetScore) return null;
  let lo = t100Cm;
  let hi = maxCm;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    if (forwardScore(mid) < targetScore) lo = mid;
    else hi = mid;
  }
  return hi;
}

function nudgeIncreasingCmToClearScore(
  startCm: number,
  maxCm: number,
  targetScore: number,
  forwardScore: (cm: number) => number,
): number | null {
  let cm = round1(Math.min(Math.max(0, startCm), maxCm));
  while (cm < maxCm && forwardScore(cm) < targetScore) {
    cm = round1(cm + 0.1);
  }
  if (forwardScore(cm) < targetScore) return null;
  return cm;
}

/** Shared invert for VJ / SLJ — only the forward scorer differs. */
function invertIncreasingJumpScoreToCm(
  targetScore: number,
  standard: PowerStandardRow,
  maxCm: number,
  forwardScore: (cm: number, standard: PowerStandardRow) => number,
): number | null {
  if (!Number.isFinite(targetScore) || targetScore <= 0) return null;
  if (!Number.isFinite(maxCm) || maxCm <= 0) return null;

  const forward = (cm: number) => forwardScore(cm, standard);
  if (forward(maxCm) < targetScore) return null;

  let guess: number;
  if (targetScore <= 100) {
    guess = invertScoreIncreasingLinearBand(targetScore, standard);
  } else {
    const overflow = invertIncreasingOverflowCm(
      targetScore,
      standard[100],
      maxCm,
      forward,
    );
    if (overflow === null) return null;
    guess = overflow;
  }

  return nudgeIncreasingCmToClearScore(guess, maxCm, targetScore, forward);
}

/**
 * WHY: Milestone "or-path" needs cm that alone clears a branch score target under age/sex norms.
 * IMPACT: Returns null when target is non-positive or unreachable under the input ceiling.
 */
export function invertVjumpScoreToCm(
  targetScore: number,
  standard: PowerStandardRow,
  maxCm: number = EXPLOSIVE_VERTICAL_JUMP_MAX_CM.male,
): number | null {
  return invertIncreasingJumpScoreToCm(targetScore, standard, maxCm, calculateVjumpScore);
}

/**
 * WHY: Same milestone invert contract as vertical jump — SLJ uses meter-based overflow above T100.
 */
export function invertSljScoreToCm(
  targetScore: number,
  standard: PowerStandardRow,
  maxCm: number = EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM.male,
): number | null {
  return invertIncreasingJumpScoreToCm(targetScore, standard, maxCm, calculateSljScore);
}

export type ExplosiveMilestoneRawGap = {
  /** Positive cm to add on vertical-jump-only path; null when unreachable / already clear. */
  vJumpDeltaCm: number | null;
  /** Positive cm to add on broad-jump-only path; null when unreachable / already clear. */
  bJumpDeltaCm: number | null;
  unit: 'cm';
};

/**
 * WHY: Spec panel shows "or-path" athletic gaps — improve VJ alone OR SLJ alone to clear next tier.
 * Missing jump counts as 0 in the /2 composite (same as radar). Core stays metric cm; UI converts.
 * IMPACT: null when both paths fail (cap / already past) so hook falls back to points-only copy.
 */
export function resolveExplosiveMilestoneRawGap(input: {
  targetCompositeScore: number;
  currentVjCm: number | null | undefined;
  currentSljCm: number | null | undefined;
  profile: PhysicalProfile;
}): ExplosiveMilestoneRawGap | null {
  const { targetCompositeScore, profile } = input;
  if (!Number.isFinite(targetCompositeScore) || targetCompositeScore <= 0) return null;

  const std = getPowerStandardsForProfile(profile);
  if (!std) return null;

  const gender = resolveExplosiveCapGender(profile);
  const vCap = getExplosiveVerticalJumpCapCm(gender);
  const sljCap = getExplosiveStandingLongJumpCapCm(gender);

  const rawVj = Number(input.currentVjCm);
  const rawSlj = Number(input.currentSljCm);
  const usedVj = Number.isFinite(rawVj) && rawVj > 0 ? Math.min(rawVj, vCap) : 0;
  const usedSlj = Number.isFinite(rawSlj) && rawSlj > 0 ? Math.min(rawSlj, sljCap) : 0;

  // At least one jump must exist for a radar composite milestone to be meaningful.
  if (usedVj <= 0 && usedSlj <= 0) return null;

  const vjScore = usedVj > 0 ? calculateVjumpScore(usedVj, std.vjump) : 0;
  const sljScore = usedSlj > 0 ? calculateSljScore(usedSlj, std.slj) : 0;

  // (branch' + other) / 2 >= T  ⇒  branch' >= 2T − other
  const needVjScore = 2 * targetCompositeScore - sljScore;
  const needSljScore = 2 * targetCompositeScore - vjScore;

  const resolveDelta = (
    needScore: number,
    usedCm: number,
    invert: (score: number, standard: PowerStandardRow, maxCm: number) => number | null,
    standard: PowerStandardRow,
    maxCm: number,
  ): number | null => {
    if (!(needScore > 0)) return null;
    const requiredCm = invert(needScore, standard, maxCm);
    if (requiredCm === null) return null;
    const exactDelta = requiredCm - usedCm;
    if (exactDelta <= 0) return null;
    return Math.max(0.1, round1(exactDelta));
  };

  const vJumpDeltaCm = resolveDelta(needVjScore, usedVj, invertVjumpScoreToCm, std.vjump, vCap);
  const bJumpDeltaCm = resolveDelta(needSljScore, usedSlj, invertSljScoreToCm, std.slj, sljCap);

  if (vJumpDeltaCm === null && bJumpDeltaCm === null) return null;
  return { vJumpDeltaCm, bJumpDeltaCm, unit: 'cm' };
}

/**
 * FFMI milestone raw-gap — dual-state guidance: prefer BF% cut at fixed weight; else lean +kg at fixed BF%.
 * WHY: Separate FFMI recomp narrative from SMM +kg, while avoiding empty points-only near natural ceilings.
 */
import {
  FFMI_BODY_FAT_INPUT_MIN_PCT,
  FFMI_HUMAN_CAP_FEMALE,
  FFMI_HUMAN_CAP_MALE,
  FFMI_PIECEWISE_FEMALE_BASE,
  FFMI_PIECEWISE_FEMALE_MAX_NATURAL,
  FFMI_PIECEWISE_MALE_BASE,
  FFMI_PIECEWISE_MALE_MAX_NATURAL,
  computeAdjustedFfmi,
  ffmiPiecewiseScore,
} from './ffmiScoring';

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Display deltas in 0.1 steps without under-promising (ceil, not banker's round). */
const ceil1 = (n: number) => Math.ceil(n * 10 - 1e-12) / 10;

/** Male survival BF floor — fat-loss path not viable below this. */
export const MIN_SURVIVAL_BF_PERCENT_MALE = 2.0;

/** Female survival BF floor — fat-loss path not viable below this. */
export const MIN_SURVIVAL_BF_PERCENT_FEMALE = 8.0;

export type FfmiMilestoneGender = 'male' | 'female';

export function resolveMinSurvivalBfPercent(gender: FfmiMilestoneGender): number {
  return gender === 'male' ? MIN_SURVIVAL_BF_PERCENT_MALE : MIN_SURVIVAL_BF_PERCENT_FEMALE;
}

/**
 * WHY: Fat-loss copy must also stay within FFMI input band (male survival 2% < page min 3%).
 * IMPACT: Dual-state switch / bump guard uses the stricter of physiology vs input min.
 */
export function resolveMilestonePromiseBfFloor(gender: FfmiMilestoneGender): number {
  return Math.max(resolveMinSurvivalBfPercent(gender), FFMI_BODY_FAT_INPUT_MIN_PCT);
}

/**
 * WHY: Milestone copy needs adjusted FFMI that clears a score gate under the same piecewise curve.
 * IMPACT: Closed-form invert of {@link ffmiPiecewiseScore}; continuous (caller rounds deltas).
 */
export function invertFfmiPiecewiseScoreToFfmi(
  targetScore: number,
  gender: FfmiMilestoneGender
): number {
  if (!Number.isFinite(targetScore) || targetScore <= 0) return 0;

  const isMale = gender === 'male';
  const base = isMale ? FFMI_PIECEWISE_MALE_BASE : FFMI_PIECEWISE_FEMALE_BASE;
  const maxNatural = isMale ? FFMI_PIECEWISE_MALE_MAX_NATURAL : FFMI_PIECEWISE_FEMALE_MAX_NATURAL;

  if (targetScore <= 60) {
    return (targetScore / 60) * base;
  }
  if (targetScore < 100) {
    return base + ((targetScore - 60) / 40) * (maxNatural - base);
  }
  return maxNatural + (targetScore - 100) / 5;
}

/** Undo tall correction: adjusted = raw + 6*(h−1.8) when h > 1.8 → raw FFM = raw × h². */
export function leanMassKgFromAdjustedFfmi(
  adjustedFfmi: number,
  heightM: number
): number | null {
  if (!Number.isFinite(adjustedFfmi) || !Number.isFinite(heightM) || heightM <= 0) {
    return null;
  }
  const rawFfmi = heightM > 1.8 ? adjustedFfmi - 6 * (heightM - 1.8) : adjustedFfmi;
  if (!(rawFfmi > 0)) return null;
  return rawFfmi * heightM * heightM;
}

export type FfmiMilestoneGapResult =
  | { type: 'fatLoss'; delta: number; unit: '%' }
  | { type: 'leanGain'; delta: number; unit: 'kg' }
  | null;

function forwardScoreAt(params: {
  weightKg: number;
  heightM: number;
  bodyFatPct: number;
  isMale: boolean;
  humanCap: number;
}): number | null {
  const adj = computeAdjustedFfmi(params.heightM, params.weightKg, params.bodyFatPct);
  if (adj > params.humanCap) return null;
  return round2(ffmiPiecewiseScore(adj, params.isMale));
}

/**
 * Path A — maintain weight, cut BF%. Returns null when not viable (caller may try leanGain).
 */
function resolveFatLossGap(params: {
  nextMilestoneScore: number;
  currentWeightKg: number;
  currentBfPercent: number;
  targetFfmKg: number;
  heightM: number;
  isMale: boolean;
  humanCap: number;
  minPromiseBf: number;
}): Extract<FfmiMilestoneGapResult, { type: 'fatLoss' }> | null {
  const {
    nextMilestoneScore,
    currentWeightKg,
    currentBfPercent,
    targetFfmKg,
    heightM,
    isMale,
    humanCap,
    minPromiseBf,
  } = params;

  if (!(targetFfmKg < currentWeightKg)) return null;

  const targetBfPercent = (1 - targetFfmKg / currentWeightKg) * 100;
  // Dual-state: below sex survival / promise floor → fat-loss path not viable.
  if (targetBfPercent < minPromiseBf) return null;

  const exactDelta = currentBfPercent - targetBfPercent;
  if (exactDelta <= 0) return null;

  let delta = Math.max(0.1, ceil1(exactDelta));

  for (let guard = 0; guard < 40; guard += 1) {
    const nextBf = currentBfPercent - delta;
    if (nextBf < minPromiseBf) return null;

    const score = forwardScoreAt({
      weightKg: currentWeightKg,
      heightM,
      bodyFatPct: nextBf,
      isMale,
      humanCap,
    });
    if (score === null) return null;
    if (score >= nextMilestoneScore) {
      return { type: 'fatLoss', delta, unit: '%' };
    }
    delta = round1(delta + 0.1);
  }

  return null;
}

/**
 * Path B — maintain BF%, add lean mass (kg). Used when maintain-weight cut hits the BF floor.
 */
function resolveLeanGainGap(params: {
  nextMilestoneScore: number;
  currentWeightKg: number;
  currentBfPercent: number;
  targetFfmKg: number;
  heightM: number;
  isMale: boolean;
  humanCap: number;
}): Extract<FfmiMilestoneGapResult, { type: 'leanGain' }> | null {
  const {
    nextMilestoneScore,
    currentWeightKg,
    currentBfPercent,
    targetFfmKg,
    heightM,
    isMale,
    humanCap,
  } = params;

  const leanFraction = 1 - currentBfPercent / 100;
  if (!(leanFraction > 0)) return null;

  const currentFfm = currentWeightKg * leanFraction;
  if (!(currentFfm > 0)) return null;

  const exactDelta = targetFfmKg - currentFfm;
  if (exactDelta <= 0) return null;

  let delta = Math.max(0.1, ceil1(exactDelta));

  for (let guard = 0; guard < 40; guard += 1) {
    const nextWeightKg = (currentFfm + delta) / leanFraction;
    const score = forwardScoreAt({
      weightKg: nextWeightKg,
      heightM,
      bodyFatPct: currentBfPercent,
      isMale,
      humanCap,
    });
    if (score === null) return null;
    if (score >= nextMilestoneScore) {
      return { type: 'leanGain', delta, unit: 'kg' };
    }
    delta = round1(delta + 0.1);
  }

  return null;
}

/**
 * WHY: Prefer fat-loss (−%) at fixed weight; smart-switch to lean-gain (+kg) when BF floor blocks recomp.
 * IMPACT: High-tier / light-body athletes get actionable lean guidance instead of points-only fallback.
 */
export function resolveFfmiMilestoneRawGap(params: {
  nextMilestoneScore: number;
  currentWeightKg: number;
  currentBfPercent: number;
  heightM: number;
  gender: FfmiMilestoneGender;
}): FfmiMilestoneGapResult {
  const {
    nextMilestoneScore,
    currentWeightKg,
    currentBfPercent,
    heightM,
    gender,
  } = params;

  if (
    !Number.isFinite(nextMilestoneScore) ||
    nextMilestoneScore <= 0 ||
    !Number.isFinite(currentWeightKg) ||
    currentWeightKg <= 0 ||
    !Number.isFinite(currentBfPercent) ||
    !Number.isFinite(heightM) ||
    heightM <= 0
  ) {
    return null;
  }

  const bf = Math.min(99.9, Math.max(0, currentBfPercent));
  const isMale = gender === 'male';
  const humanCap = isMale ? FFMI_HUMAN_CAP_MALE : FFMI_HUMAN_CAP_FEMALE;
  // Switch / fat-loss guard: stricter of sex survival (2%/8%) vs FFMI input min (3%).
  const minPromiseBf = resolveMilestonePromiseBfFloor(gender);

  const targetAdjustedFfmi = invertFfmiPiecewiseScoreToFfmi(nextMilestoneScore, gender);
  if (targetAdjustedFfmi > humanCap) return null;

  const targetFfm = leanMassKgFromAdjustedFfmi(targetAdjustedFfmi, heightM);
  if (targetFfm === null) return null;

  const fatLoss = resolveFatLossGap({
    nextMilestoneScore,
    currentWeightKg,
    currentBfPercent: bf,
    targetFfmKg: targetFfm,
    heightM,
    isMale,
    humanCap,
    minPromiseBf,
  });
  if (fatLoss) return fatLoss;

  return resolveLeanGainGap({
    nextMilestoneScore,
    currentWeightKg,
    currentBfPercent: bf,
    targetFfmKg: targetFfm,
    heightM,
    isMale,
    humanCap,
  });
}

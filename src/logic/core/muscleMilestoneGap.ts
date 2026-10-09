/**
 * Muscle (SMM) milestone raw-gap — invert composite score → ΔSMM kg at fixed body weight.
 * WHY: Keep muscleScoring focused on forward norms; binary-search invert is a separate consumer surface.
 */
import {
  calculateMuscleScores,
  getSmmKgCeilingForGender,
} from './muscleScoring';
import { clampScoreMapValue } from './scoring';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Display SMM deltas in 0.1 kg steps without under-promising (ceil, not banker's round). */
const ceil1 = (n: number) => Math.ceil(n * 10 - 1e-12) / 10;

export type MuscleMilestoneGender = 'male' | 'female';

export type MuscleMilestoneRawGap = {
  delta: number;
  unit: 'kg';
};

/**
 * Production composite at fixed weight (Beast 80/20 + axis clamp — same surface as radar preview).
 */
function forwardCompositeScore(params: {
  smmKg: number;
  bodyWeightKg: number;
  gender: MuscleMilestoneGender;
  age: number;
}): number | null {
  const r = calculateMuscleScores({
    smmKg: params.smmKg,
    weightKg: params.bodyWeightKg,
    age: params.age,
    gender: params.gender,
  });
  if (r.finalRawScore === null || !Number.isFinite(r.finalRawScore)) return null;
  return clampScoreMapValue(r.finalRawScore);
}

/**
 * Binary search minimum SMM (kg) in (lo, hi] that clears targetScore under production scoring.
 * WHY: Dual-branch + Beast blend has no clean closed inverse; search stays deterministic.
 */
function invertCompositeScoreToSmmKg(params: {
  targetScore: number;
  loExclusiveKg: number;
  hiInclusiveKg: number;
  bodyWeightKg: number;
  gender: MuscleMilestoneGender;
  age: number;
}): number | null {
  const { targetScore, loExclusiveKg, hiInclusiveKg, bodyWeightKg, gender, age } = params;
  if (!(hiInclusiveKg > loExclusiveKg)) return null;

  const hiScore = forwardCompositeScore({
    smmKg: hiInclusiveKg,
    bodyWeightKg,
    gender,
    age,
  });
  if (hiScore === null || hiScore < targetScore) return null;

  let lo = loExclusiveKg;
  let hi = hiInclusiveKg;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    const score = forwardCompositeScore({
      smmKg: mid,
      bodyWeightKg,
      gender,
      age,
    });
    if (score !== null && score >= targetScore) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return hi;
}

/**
 * WHY: Spec panel shows ΔSMM kg at fixed body weight (product “maintain weight, add skeletal muscle”).
 * IMPACT: null when inputs invalid, already past, or unreachable under sex SMM ceiling.
 * Delta is verified through {@link calculateMuscleScores} so Beast handoff cannot under-promise.
 */
export function resolveMuscleMilestoneRawGap(params: {
  nextMilestoneScore: number;
  currentSmmKg: number;
  bodyWeightKg: number;
  gender: MuscleMilestoneGender;
  age: number;
}): MuscleMilestoneRawGap | null {
  const {
    nextMilestoneScore,
    currentSmmKg,
    bodyWeightKg,
    gender,
    age,
  } = params;

  if (
    !Number.isFinite(nextMilestoneScore) ||
    nextMilestoneScore <= 0 ||
    !Number.isFinite(currentSmmKg) ||
    currentSmmKg <= 0 ||
    !Number.isFinite(bodyWeightKg) ||
    bodyWeightKg <= 0 ||
    !Number.isFinite(age) ||
    age <= 0
  ) {
    return null;
  }

  const ceiling = getSmmKgCeilingForGender(gender);
  if (currentSmmKg > ceiling) return null;

  const currentScore = forwardCompositeScore({
    smmKg: currentSmmKg,
    bodyWeightKg,
    gender,
    age,
  });
  if (currentScore === null) return null;
  if (currentScore >= nextMilestoneScore) return null;

  const requiredSmm = invertCompositeScoreToSmmKg({
    targetScore: nextMilestoneScore,
    loExclusiveKg: currentSmmKg,
    hiInclusiveKg: ceiling,
    bodyWeightKg,
    gender,
    age,
  });
  if (requiredSmm === null) return null;

  const exactDelta = requiredSmm - currentSmmKg;
  if (exactDelta <= 0) return null;

  let delta = Math.max(0.1, ceil1(exactDelta));

  for (let guard = 0; guard < 40; guard += 1) {
    const nextSmm = currentSmmKg + delta;
    if (nextSmm > ceiling) return null;

    const score = forwardCompositeScore({
      smmKg: nextSmm,
      bodyWeightKg,
      gender,
      age,
    });
    if (score === null) return null;
    if (score >= nextMilestoneScore) {
      return { delta, unit: 'kg' };
    }
    delta = round1(delta + 0.1);
  }

  return null;
}

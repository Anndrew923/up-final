/**
 * Single-lift strength milestone raw-gap — invert one lift’s DOTS score → Δweight kg at fixed BW/reps.
 * WHY: Keep strengthAssessment forward scoring lean; per-lift invert avoids composite-average dilution.
 */
import type { StrengthLiftKey } from '../../types/strengthInputs';
import { calculateStrengthScore, clampScoreMapValue, type ExerciseType } from './scoring';
import { clampStrengthWeightKg, STRENGTH_WEIGHT_LIMIT_KG } from './strengthWeightLimits';

const HALF_KG = 0.5;

/** Barbell/stack-friendly 0.5 kg steps without under-promising. */
const ceilHalfKg = (n: number) => Math.ceil(n / HALF_KG - 1e-12) * HALF_KG;

const roundHalf = (n: number) => Math.round(n / HALF_KG) * HALF_KG;

const LIFT_TO_EXERCISE: Record<StrengthLiftKey, ExerciseType> = {
  benchPress: 'Bench Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
  latPulldown: 'Lat Pulldown',
  shoulderPress: 'Overhead Press',
};

export type SingleLiftMilestoneGender = 'male' | 'female';

export type SingleLiftMilestoneRawGap = {
  delta: number;
  unit: 'kg';
};

/**
 * Production per-lift score at a candidate weight (clamped to model ceiling + axis clamp).
 */
function forwardLiftScore(params: {
  liftType: StrengthLiftKey;
  weightKg: number;
  reps: number;
  bodyWeightKg: number;
  gender: SingleLiftMilestoneGender;
  age: number;
}): number | null {
  const { usedKg } = clampStrengthWeightKg(params.liftType, params.weightKg);
  if (!(usedKg > 0)) return null;
  try {
    const breakdown = calculateStrengthScore({
      exerciseType: LIFT_TO_EXERCISE[params.liftType],
      weight: usedKg,
      reps: params.reps,
      bodyWeight: params.bodyWeightKg,
      gender: params.gender,
      age: params.age,
    });
    return clampScoreMapValue(breakdown.finalScore);
  } catch {
    return null;
  }
}

/**
 * Binary search minimum weight (kg) in (lo, hi] that clears targetScore under production scoring.
 * WHY: DOTS + Brzycki + McCulloch has no clean closed inverse; search stays deterministic.
 */
function invertLiftScoreToWeightKg(params: {
  targetScore: number;
  loExclusiveKg: number;
  hiInclusiveKg: number;
  liftType: StrengthLiftKey;
  reps: number;
  bodyWeightKg: number;
  gender: SingleLiftMilestoneGender;
  age: number;
}): number | null {
  const {
    targetScore,
    loExclusiveKg,
    hiInclusiveKg,
    liftType,
    reps,
    bodyWeightKg,
    gender,
    age,
  } = params;
  if (!(hiInclusiveKg > loExclusiveKg)) return null;

  const hiScore = forwardLiftScore({
    liftType,
    weightKg: hiInclusiveKg,
    reps,
    bodyWeightKg,
    gender,
    age,
  });
  if (hiScore === null || hiScore < targetScore) return null;

  let lo = loExclusiveKg;
  let hi = hiInclusiveKg;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    const score = forwardLiftScore({
      liftType,
      weightKg: mid,
      reps,
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
 * WHY: Per-lift cards show athletic Δkg; composite average must stay points-only (no diluted “+X kg on one lift”).
 * IMPACT: null when inputs invalid, already past, or unreachable under the lift’s model ceiling.
 * Delta uses 0.5 kg steps (barbell/stack realism) and verifies through production scoring.
 */
export function resolveSingleLiftMilestoneRawGap(params: {
  liftType: StrengthLiftKey;
  currentWeightKg: number;
  /** Fixed reps for this set — Brzycki path stays aligned with the scored row. */
  reps: number;
  bodyWeightKg: number;
  gender: SingleLiftMilestoneGender;
  age: number;
  nextMilestoneScore: number;
}): SingleLiftMilestoneRawGap | null {
  const {
    liftType,
    currentWeightKg,
    reps,
    bodyWeightKg,
    gender,
    age,
    nextMilestoneScore,
  } = params;

  if (
    !Number.isFinite(nextMilestoneScore) ||
    nextMilestoneScore <= 0 ||
    !Number.isFinite(currentWeightKg) ||
    currentWeightKg <= 0 ||
    !Number.isFinite(reps) ||
    !Number.isInteger(reps) ||
    reps < 1 ||
    !Number.isFinite(bodyWeightKg) ||
    bodyWeightKg <= 0 ||
    !Number.isFinite(age) ||
    age <= 0
  ) {
    return null;
  }

  const ceilingKg = STRENGTH_WEIGHT_LIMIT_KG[liftType];
  const { usedKg: currentUsedKg } = clampStrengthWeightKg(liftType, currentWeightKg);
  if (!(currentUsedKg > 0) || currentUsedKg > ceilingKg) return null;

  const currentScore = forwardLiftScore({
    liftType,
    weightKg: currentUsedKg,
    reps,
    bodyWeightKg,
    gender,
    age,
  });
  if (currentScore === null) return null;
  if (currentScore >= nextMilestoneScore) return null;

  const requiredKg = invertLiftScoreToWeightKg({
    targetScore: nextMilestoneScore,
    loExclusiveKg: currentUsedKg,
    hiInclusiveKg: ceilingKg,
    liftType,
    reps,
    bodyWeightKg,
    gender,
    age,
  });
  if (requiredKg === null) return null;

  const exactDelta = requiredKg - currentUsedKg;
  if (exactDelta <= 0) return null;

  let delta = Math.max(HALF_KG, ceilHalfKg(exactDelta));

  for (let guard = 0; guard < 80; guard += 1) {
    const nextWeight = currentUsedKg + delta;
    if (nextWeight > ceilingKg + 1e-9) return null;

    const score = forwardLiftScore({
      liftType,
      weightKg: nextWeight,
      reps,
      bodyWeightKg,
      gender,
      age,
    });
    if (score === null) return null;
    if (score >= nextMilestoneScore) {
      return { delta, unit: 'kg' };
    }
    delta = roundHalf(delta + HALF_KG);
  }

  return null;
}

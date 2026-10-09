import type { GripInputsPersisted } from '../../types/gripInputs';
import type { ScoreMap } from '../../types/scoring';
import type { PhysicalProfile } from '../../types/userProfile';
import { normalizeGenderForNormTables } from './genderNormalize';
import { isPhysicalProfileComplete } from './physicalProfile';
import { clampScoreMapValue, SCORE_AXIS_MAX } from './scoring';

export const GRIP_MALE_MULTIPLIER = 1.4;
export const GRIP_FEMALE_COMPENSATION = 1.6;
/** Female linear-zone multiplier — 1.4 × 1.6 = 2.24 century-gate slope. */
export const GRIP_FEMALE_MULTIPLIER = GRIP_MALE_MULTIPLIER * GRIP_FEMALE_COMPENSATION;

/**
 * Sex-specific peak ceilings — male 200 kg closes radar at SCORE_AXIS_MAX;
 * female 110 kg mirrors the same dual-slope closure under the 2.24× track.
 */
export const GRIP_MAX_PEAK_KG_MALE = 200;
export const GRIP_MAX_PEAK_KG_FEMALE = 110;

/** Century-gate peak (kg) where raw score hits GRIP_CENTURY_SCORE before W_factor. */
export const GRIP_CENTURY_PEAK_KG_MALE = 72;
export const GRIP_CENTURY_PEAK_KG_FEMALE = 45;
/** Raw century gate shared by both sexes at W_factor = 1 (72×1.4 / 45×2.24). */
export const GRIP_CENTURY_SCORE = 100.8;

/**
 * WHY: Derive elite slopes from ceilings so peak kg ↔ SCORE_AXIS_MAX stay locked —
 * hardcoding 0.775 / 1.526 would drift if either constant changes.
 * Male: (200 − 100.8) / (200 − 72) = 0.775; female: (200 − 100.8) / (110 − 45) ≈ 1.52615.
 */
export const GRIP_ELITE_SLOPE_MALE =
  (SCORE_AXIS_MAX - GRIP_CENTURY_SCORE) /
  (GRIP_MAX_PEAK_KG_MALE - GRIP_CENTURY_PEAK_KG_MALE);
export const GRIP_ELITE_SLOPE_FEMALE =
  (SCORE_AXIS_MAX - GRIP_CENTURY_SCORE) /
  (GRIP_MAX_PEAK_KG_FEMALE - GRIP_CENTURY_PEAK_KG_FEMALE);

/** Male allometric grip anchor — 72 kg peak × 1.4 → ~100.8 elite century gate at 75 kg. */
export const GRIP_BASE_WEIGHT_KG_MALE = 75;
/**
 * Female allometric grip anchor — 45 kg peak × 2.24 → ~100.8 century gate at 55 kg.
 * WHY: square–cube scaling applies to both sexes; reusing the male 75 kg anchor would stack W_factor
 * boost on the existing 1.6× sex compensation and inflate typical 50–60 kg female scores.
 */
export const GRIP_BASE_WEIGHT_KG_FEMALE = 55;

/** Lighter-than-anchor: √(anchor/W) rewards relative-strength performers without 1:1 grip÷BW punishment. */
export const GRIP_WEIGHT_EXPONENT_LIGHT = 0.5;
/**
 * Heavier-than-anchor: ∛(anchor/W) dampens mass dilution per square–cube / allometric scaling —
 * absolute monsters keep TIER_140+ without linear power creep on the six-axis radar.
 */
export const GRIP_WEIGHT_EXPONENT_HEAVY = 0.3333;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export interface GripPeakCapResult {
  inputKg: number;
  usedKg: number;
  capped: boolean;
  maxKg: number;
}

/** Sex-specific peak ceiling for clamp / UI cap notice. */
export function resolveGripMaxPeakKg(gender: string | null | undefined): number {
  return normalizeGenderForNormTables(gender) === 'female'
    ? GRIP_MAX_PEAK_KG_FEMALE
    : GRIP_MAX_PEAK_KG_MALE;
}

export function applyGripPeakCap(
  peakKg: number,
  gender: string | null | undefined = 'male'
): GripPeakCapResult {
  const numeric = Number(peakKg);
  const inputKg = Number.isFinite(numeric) ? numeric : 0;
  const safeInput = Math.max(0, inputKg);
  const maxKg = resolveGripMaxPeakKg(gender);
  const usedKg = Math.min(safeInput, maxKg);
  return {
    inputKg,
    usedKg,
    capped: safeInput > maxKg,
    maxKg,
  };
}

/**
 * WHY: Sex-specific golden anchors decouple W_factor from the 1.6× female grip compensation —
 * prevents double inflation when most women sit well below the male 75 kg reference mass.
 * IMPACT: male 75 kg / female 55 kg; defaults to sex-appropriate anchor when weight missing.
 */
export function resolveGripBaseWeightKg(gender: string | null | undefined): number {
  return normalizeGenderForNormTables(gender) === 'female'
    ? GRIP_BASE_WEIGHT_KG_FEMALE
    : GRIP_BASE_WEIGHT_KG_MALE;
}

/**
 * WHY: Allometric body-mass correction per square–cube law — mass scales faster than muscle cross-section.
 * IMPACT: W_factor = 1.0 at sex-specific anchor; lighter bodies get ^0.5 lift, heavier get gentler ^⅓ dampening.
 */
export function resolveGripWeightFactor(
  weightKg: number | null | undefined,
  gender: string | null | undefined = 'male'
): number {
  const baseWeight = resolveGripBaseWeightKg(gender);
  const currentWeight =
    weightKg != null && Number.isFinite(Number(weightKg)) && Number(weightKg) > 0
      ? Number(weightKg)
      : baseWeight;

  if (currentWeight <= baseWeight) {
    return Math.pow(baseWeight / currentWeight, GRIP_WEIGHT_EXPONENT_LIGHT);
  }
  return Math.pow(baseWeight / currentWeight, GRIP_WEIGHT_EXPONENT_HEAVY);
}

/**
 * Dual-slope raw score before W_factor — keeps century gate flat, compresses elite peaks into SCORE_AXIS_MAX.
 * WHY: Single linear ×1.4 overflowed past 200 at world-record grips; elite slope closes the radar scale.
 */
function resolveGripDualSlopeRaw(usedKg: number, gender: string | null | undefined): number {
  const isFemale = normalizeGenderForNormTables(gender) === 'female';
  if (isFemale) {
    if (usedKg <= GRIP_CENTURY_PEAK_KG_FEMALE) {
      return usedKg * GRIP_FEMALE_MULTIPLIER;
    }
    return (
      GRIP_CENTURY_SCORE + (usedKg - GRIP_CENTURY_PEAK_KG_FEMALE) * GRIP_ELITE_SLOPE_FEMALE
    );
  }
  if (usedKg <= GRIP_CENTURY_PEAK_KG_MALE) {
    return usedKg * GRIP_MALE_MULTIPLIER;
  }
  return GRIP_CENTURY_SCORE + (usedKg - GRIP_CENTURY_PEAK_KG_MALE) * GRIP_ELITE_SLOPE_MALE;
}

/**
 * WHY: Dual-slope + allometric W_factor — century gates unchanged; WR-class peaks land ~175–183;
 * sex-specific kg ceilings close at SCORE_AXIS_MAX (200).
 * IMPACT: Grip axis only — ladder shard and aura bands unchanged.
 */
export function calculateGripStrengthScore(
  peakKg: number,
  weightKg: number | null | undefined,
  gender: string | null | undefined = 'male'
): number {
  const { usedKg } = applyGripPeakCap(peakKg, gender);
  if (usedKg <= 0) return 0;

  const wFactor = resolveGripWeightFactor(weightKg, gender);
  const raw = resolveGripDualSlopeRaw(usedKg, gender) * wFactor;
  return clampScoreMapValue(round1(raw));
}

/**
 * Invert dual-slope raw (pre–W_factor) → peak kg. Continuous; caller rounds / nudges for score gates.
 */
function invertGripDualSlopeRaw(dualSlopeRaw: number, gender: string | null | undefined): number {
  if (!Number.isFinite(dualSlopeRaw) || dualSlopeRaw <= 0) return 0;
  const isFemale = normalizeGenderForNormTables(gender) === 'female';
  if (isFemale) {
    if (dualSlopeRaw <= GRIP_CENTURY_SCORE) {
      return dualSlopeRaw / GRIP_FEMALE_MULTIPLIER;
    }
    return (
      GRIP_CENTURY_PEAK_KG_FEMALE +
      (dualSlopeRaw - GRIP_CENTURY_SCORE) / GRIP_ELITE_SLOPE_FEMALE
    );
  }
  if (dualSlopeRaw <= GRIP_CENTURY_SCORE) {
    return dualSlopeRaw / GRIP_MALE_MULTIPLIER;
  }
  return (
    GRIP_CENTURY_PEAK_KG_MALE + (dualSlopeRaw - GRIP_CENTURY_SCORE) / GRIP_ELITE_SLOPE_MALE
  );
}

/**
 * WHY: Milestone copy needs peak kg that reaches a target score — invert dual-slope × W_factor,
 * then nudge by 0.1 kg so round1(forward) still clears the gate.
 * IMPACT: Returns null when target is non-positive or unreachable under the sex-specific peak cap.
 */
export function invertGripStrengthScoreToPeakKg(
  targetScore: number,
  weightKg: number | null | undefined,
  gender: string | null | undefined = 'male'
): number | null {
  if (!Number.isFinite(targetScore) || targetScore <= 0) return null;

  const maxKg = resolveGripMaxPeakKg(gender);
  const ceilingScore = calculateGripStrengthScore(maxKg, weightKg, gender);
  if (targetScore > ceilingScore) return null;

  const wFactor = resolveGripWeightFactor(weightKg, gender);
  // round1(x) >= T requires x >= T - 0.05; epsilon avoids float sitting on the half-down edge.
  const minProduct = targetScore - 0.05 + 1e-9;
  const dualNeeded = minProduct / wFactor;
  let peakKg = invertGripDualSlopeRaw(dualNeeded, gender);
  peakKg = Math.min(Math.max(0, peakKg), maxKg);
  peakKg = round1(peakKg);

  while (
    peakKg < maxKg &&
    calculateGripStrengthScore(peakKg, weightKg, gender) < targetScore
  ) {
    peakKg = round1(peakKg + 0.1);
  }

  if (calculateGripStrengthScore(peakKg, weightKg, gender) < targetScore) return null;
  return peakKg;
}

export type GripMilestoneRawGap = {
  delta: number;
  unit: 'kg';
};

/**
 * WHY: Spec panel shows athletic gap (kg), not only abstract score points.
 * Floor 0.1 kg only when a positive gap exists — never invent progress if already at/past required peak.
 */
export function resolveGripMilestoneRawGap(input: {
  currentPeakKg: number;
  targetScore: number;
  weightKg: number | null | undefined;
  gender: string | null | undefined;
}): GripMilestoneRawGap | null {
  const { currentPeakKg, targetScore, weightKg, gender } = input;
  if (!Number.isFinite(currentPeakKg) || currentPeakKg <= 0) return null;

  const requiredKg = invertGripStrengthScoreToPeakKg(targetScore, weightKg, gender);
  if (requiredKg === null) return null;

  const { usedKg } = applyGripPeakCap(currentPeakKg, gender);
  const exactDelta = requiredKg - usedKg;
  if (exactDelta <= 0) return null;

  return { delta: Math.max(0.1, round1(exactDelta)), unit: 'kg' };
}

export function resolveGripStrengthScoreFromInputs(
  profile: PhysicalProfile | null | undefined,
  inputs: GripInputsPersisted | null | undefined
): number | null {
  if (!profile || !isPhysicalProfileComplete(profile)) return null;
  const rawPeakKg = inputs?.peakKg;
  const peakKg = Number(rawPeakKg);
  if (!Number.isFinite(peakKg) || peakKg <= 0) return null;
  return calculateGripStrengthScore(peakKg, profile.weightKg, profile.gender);
}

export function mergeScoreMapWithResolvedGripStrength(
  scores: ScoreMap,
  profile: PhysicalProfile | null | undefined,
  inputs: GripInputsPersisted | null | undefined
): ScoreMap {
  const resolved = resolveGripStrengthScoreFromInputs(profile, inputs);
  if (resolved === null) return { ...scores };
  return { ...scores, gripStrength: resolved };
}

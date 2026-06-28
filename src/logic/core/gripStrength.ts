import type { GripInputsPersisted } from '../../types/gripInputs';
import type { ScoreMap } from '../../types/scoring';
import type { PhysicalProfile } from '../../types/userProfile';
import { normalizeGenderForNormTables } from './genderNormalize';
import { isPhysicalProfileComplete } from './physicalProfile';
import { resolveAuraFromBandId } from './performanceAura';
import { resolveScoreBand } from './scoreMeaningCatalog';
import { clampScoreMapValue } from './scoring';

export const GRIP_MALE_MULTIPLIER = 1.4;
export const GRIP_FEMALE_COMPENSATION = 1.6;
/** Product model ceiling aligned with Magnus Samuelsson-level public records context. */
export const GRIP_MAX_PEAK_KG = 160;

/** Male allometric grip anchor — 72 kg peak × 1.4 → ~100.8 elite century gate at 75 kg. */
export const GRIP_BASE_WEIGHT_KG_MALE = 75;
/**
 * Female allometric grip anchor — 45 kg peak × 2.24 → ~100.8 century gate at 55 kg.
 * WHY: square–cube scaling applies to both sexes; reusing the male 75 kg anchor would stack W_factor
 * boost on the existing 1.6× sex compensation and inflate typical 50–60 kg female scores.
 */
export const GRIP_BASE_WEIGHT_KG_FEMALE = 55;
/** @deprecated Use GRIP_BASE_WEIGHT_KG_MALE — kept for import stability. */
export const GRIP_BASE_WEIGHT_KG = GRIP_BASE_WEIGHT_KG_MALE;

/** Lighter-than-anchor: √(anchor/W) rewards relative-strength performers without 1:1 grip÷BW punishment. */
export const GRIP_WEIGHT_EXPONENT_LIGHT = 0.5;
/**
 * Heavier-than-anchor: ∛(anchor/W) dampens mass dilution per square–cube / allometric scaling —
 * absolute monsters keep TIER_140+ without linear power creep on the six-axis radar.
 */
export const GRIP_WEIGHT_EXPONENT_HEAVY = 0.3333;

export type GripBandId =
  | 'BASE'
  | 'TIER_40'
  | 'TIER_50'
  | 'TIER_60'
  | 'TIER_70'
  | 'TIER_80'
  | 'TIER_90'
  | 'TIER_100'
  | 'TIER_110'
  | 'TIER_120'
  | 'TIER_130'
  | 'TIER_140'
  | 'TIER_150'
  | 'TIER_160'
  | 'TIER_170'
  | 'PANTHEON';

export type GripAuraKey =
  | 'none'
  | 'pulse'
  | 'flow'
  | 'shimmer'
  | 'lightning'
  | 'void_flame'
  | 'divine_light';

export type GripRankColor = 'gray' | 'green' | 'blue' | 'purple' | 'red' | 'black' | 'gold';

export type GripRankMetadata = {
  rankKey: GripBandId;
  color: GripRankColor;
  aura: GripAuraKey;
};

const AURA_COLORS: Record<GripAuraKey, GripRankColor> = {
  none: 'gray',
  pulse: 'green',
  flow: 'blue',
  shimmer: 'purple',
  lightning: 'red',
  void_flame: 'black',
  divine_light: 'gold',
};

/** Delegates to shared band→aura map in performanceAura. */
export function resolveGripAuraFromBandId(bandId: string): GripAuraKey {
  return resolveAuraFromBandId(bandId);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export interface GripPeakCapResult {
  inputKg: number;
  usedKg: number;
  capped: boolean;
}

export function applyGripPeakCap(peakKg: number): GripPeakCapResult {
  const numeric = Number(peakKg);
  const inputKg = Number.isFinite(numeric) ? numeric : 0;
  const safeInput = Math.max(0, inputKg);
  const usedKg = Math.min(safeInput, GRIP_MAX_PEAK_KG);
  return {
    inputKg,
    usedKg,
    capped: safeInput > GRIP_MAX_PEAK_KG,
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
  gender: string | null | undefined = 'male',
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

function resolveGripGenderMultiplier(gender: string | null | undefined): number {
  return normalizeGenderForNormTables(gender) === 'female'
    ? GRIP_MALE_MULTIPLIER * GRIP_FEMALE_COMPENSATION
    : GRIP_MALE_MULTIPLIER;
}

/**
 * WHY: Dual-track anchors — male 72 kg @ 75 kg BW and female 45 kg @ 55 kg BW both land ~100.8 century gate.
 * IMPACT: Grip axis only — ladder shard and aura bands unchanged; stored score still clamped 0–200.
 */
export function calculateGripStrengthScore(
  peakKg: number,
  weightKg: number | null | undefined,
  gender: string | null | undefined = 'male',
): number {
  const { usedKg } = applyGripPeakCap(peakKg);
  if (usedKg <= 0) return 0;

  const wFactor = resolveGripWeightFactor(weightKg, gender);
  const genderMultiplier = resolveGripGenderMultiplier(gender);
  return round1(usedKg * genderMultiplier * wFactor);
}

export function getGripRankMetadata(score: number): GripRankMetadata {
  const band = resolveScoreBand('gripStrength', score);
  const rankKey = band.id as GripBandId;
  const aura = resolveGripAuraFromBandId(band.id);
  return {
    rankKey,
    color: AURA_COLORS[aura],
    aura,
  };
}

export function resolveGripStrengthScoreFromInputs(
  profile: PhysicalProfile | null | undefined,
  inputs: GripInputsPersisted | null | undefined
): number | null {
  if (!profile || !isPhysicalProfileComplete(profile)) return null;
  const rawPeakKg = inputs?.peakKg;
  const peakKg = Number(rawPeakKg);
  if (!Number.isFinite(peakKg) || peakKg <= 0) return null;
  const score = calculateGripStrengthScore(peakKg, profile.weightKg, profile.gender);
  return clampScoreMapValue(score);
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

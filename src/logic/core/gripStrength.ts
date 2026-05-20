import type { GripInputsPersisted } from '../../types/gripInputs';
import type { ScoreMap } from '../../types/scoring';
import type { PhysicalProfile } from '../../types/userProfile';
import { isPhysicalProfileComplete } from './physicalProfile';
import { resolveAuraFromBandId } from './performanceAura';
import { resolveScoreBand } from './scoreMeaningCatalog';
import { clampScoreMapValue } from './scoring';

export const GRIP_MALE_MULTIPLIER = 1.4;
export const GRIP_FEMALE_COMPENSATION = 1.6;
/** Product model ceiling aligned with Magnus Samuelsson-level public records context. */
export const GRIP_MAX_PEAK_KG = 175;

export type GripBandId =
  | 'BASE'
  | 'TIER_41'
  | 'TIER_51'
  | 'TIER_61'
  | 'TIER_71'
  | 'TIER_81'
  | 'TIER_91'
  | 'TIER_101'
  | 'TIER_111'
  | 'TIER_121'
  | 'TIER_131'
  | 'TIER_141'
  | 'TIER_151'
  | 'TIER_161'
  | 'TIER_171'
  | 'LEGEND'
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
 * WHY: 1.4 is calibrated so 72 kg -> 100.8 (Titan threshold), keeping continuity with the product scale.
 * IMPACT: Removes hard 100 caps so mythical records can continue to separate above elite ranges.
 */
export function calculateGripStrengthScore(
  peakKg: number,
  gender: 'male' | 'female' = 'male'
): number {
  const { usedKg } = applyGripPeakCap(peakKg);
  if (usedKg <= 0) return 0;
  const multiplier =
    gender === 'female' ? GRIP_MALE_MULTIPLIER * GRIP_FEMALE_COMPENSATION : GRIP_MALE_MULTIPLIER;
  return round1(usedKg * multiplier);
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
  const score = calculateGripStrengthScore(peakKg, profile.gender);
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

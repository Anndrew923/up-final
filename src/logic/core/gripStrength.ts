import type { GripInputsPersisted } from '../../types/gripInputs';
import type { ScoreMap } from '../../types/scoring';
import type { PhysicalProfile } from '../../types/userProfile';
import { isPhysicalProfileComplete } from './physicalProfile';
import { clampScoreMapValue } from './scoring';

export const GRIP_MALE_MULTIPLIER = 1.4;
export const GRIP_FEMALE_COMPENSATION = 1.6;
/** Product model ceiling aligned with Magnus Samuelsson-level public records context. */
export const GRIP_MAX_PEAK_KG = 160;

export type GripRankMetadata = {
  rankKey:
    | 'ironApprentice'
    | 'athleticElite'
    | 'vanguard'
    | 'bossClass'
    | 'titan'
    | 'grandmaster'
    | 'godHand';
  color: 'gray' | 'green' | 'blue' | 'purple' | 'red' | 'black' | 'gold';
  aura: 'none' | 'pulse' | 'flow' | 'shimmer' | 'lightning' | 'void_flame' | 'divine_light';
};

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
  const multiplier = gender === 'female'
    ? GRIP_MALE_MULTIPLIER * GRIP_FEMALE_COMPENSATION
    : GRIP_MALE_MULTIPLIER;
  return round1(usedKg * multiplier);
}

export function getGripRankMetadata(score: number): GripRankMetadata {
  if (score < 40) return { rankKey: 'ironApprentice', color: 'gray', aura: 'none' };
  if (score < 65) return { rankKey: 'athleticElite', color: 'green', aura: 'pulse' };
  if (score < 85) return { rankKey: 'vanguard', color: 'blue', aura: 'flow' };
  if (score < 100) return { rankKey: 'bossClass', color: 'purple', aura: 'shimmer' };
  if (score < 140) return { rankKey: 'titan', color: 'red', aura: 'lightning' };
  if (score < 200) return { rankKey: 'grandmaster', color: 'black', aura: 'void_flame' };
  return { rankKey: 'godHand', color: 'gold', aura: 'divine_light' };
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

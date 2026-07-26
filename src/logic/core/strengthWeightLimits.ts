/**
 * Per-lift model ceilings (kg) for strength scoring — inputs above cap are clamped before DOTS / 1RM.
 *
 * WHY:
 * - Prevents absurd outliers from distorting UX and keeps scores within a defensible "elite / WR-class" band.
 * - Anchors are product guardrails only — not meet rules or drug-tested verification.
 *
 * Baseline notes (Raw / strongman all-time class — illustrative only):
 * - Bench: Julius Maddox raw WR class (~355 kg)
 * - Squat: Ray Williams raw w/ wraps class (~490 kg)
 * - Deadlift: Hafthor Bjornsson elephant bar / 501 kg class
 * - Overhead: Zydrunas Savickas log / strict press class
 * - Lat pulldown: stack-machine elite context extended to 300 kg product ceiling
 */
import type { StrengthLiftKey } from '../../types/strengthInputs';
import { snapNearMetricLimit } from './unitConverters';

export const STRENGTH_WEIGHT_LIMIT_KG = {
  benchPress: 370,
  squat: 510,
  deadlift: 550,
  shoulderPress: 244,
  latPulldown: 300,
} as const satisfies Record<StrengthLiftKey, number>;

/**
 * WHY: 1-decimal lb display round-trips (300 kg → 661.4 lb → ~300.017 kg) must not
 * false-trigger model-ceiling notices after a valid imperial toggle.
 */
export const STRENGTH_WEIGHT_CEILING_EPSILON_KG = 0.05;

export function clampStrengthWeightKg(
  lift: StrengthLiftKey,
  weightKg: number
): { usedKg: number; capped: boolean; maxKg: number } {
  const maxKg = STRENGTH_WEIGHT_LIMIT_KG[lift];
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return { usedKg: weightKg, capped: false, maxKg };
  }
  const snapped = snapNearMetricLimit(weightKg, maxKg, STRENGTH_WEIGHT_CEILING_EPSILON_KG);
  if (snapped > maxKg) {
    return { usedKg: maxKg, capped: true, maxKg };
  }
  return { usedKg: snapped, capped: false, maxKg };
}

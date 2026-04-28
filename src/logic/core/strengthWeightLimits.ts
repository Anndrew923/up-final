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
 * - Lat pulldown: stack-machine elite context (e.g. Coleman-class stack)
 */
import type { StrengthLiftKey } from '../../types/strengthInputs';

export const STRENGTH_WEIGHT_LIMIT_KG = {
  benchPress: 370,
  squat: 510,
  deadlift: 550,
  shoulderPress: 245,
  latPulldown: 225,
} as const satisfies Record<StrengthLiftKey, number>;

export function clampStrengthWeightKg(
  lift: StrengthLiftKey,
  weightKg: number
): { usedKg: number; capped: boolean; maxKg: number } {
  const maxKg = STRENGTH_WEIGHT_LIMIT_KG[lift];
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return { usedKg: weightKg, capped: false, maxKg };
  }
  if (weightKg > maxKg) {
    return { usedKg: maxKg, capped: true, maxKg };
  }
  return { usedKg: weightKg, capped: false, maxKg };
}

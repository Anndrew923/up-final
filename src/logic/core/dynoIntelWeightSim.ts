import type { PhysicalProfile } from '../../types/userProfile';
import { isPhysicalProfileComplete, PHYSICAL_LIMITS } from './physicalProfile';

/** Default cut for weight-simulation briefing when user has not picked a target. */
export const DYNO_WEIGHT_SIM_DEFAULT_DELTA_KG = 8;

/**
 * Picks a downward weight target for strength DOTS simulation.
 * WHY: AI must not invent kg — logic layer derives a plausible cut from profile only.
 */
export function resolveWeightSimulationTargetKg(
  profile: PhysicalProfile | null | undefined,
  deltaKg: number = DYNO_WEIGHT_SIM_DEFAULT_DELTA_KG
): number | undefined {
  if (!profile || !isPhysicalProfileComplete(profile)) return undefined;

  const target = Math.round((profile.weightKg - deltaKg) * 10) / 10;
  if (!Number.isFinite(target)) return undefined;
  if (target >= profile.weightKg) return undefined;
  if (target < PHYSICAL_LIMITS.weightKgMin || target > PHYSICAL_LIMITS.weightKgMax) {
    return undefined;
  }
  return target;
}

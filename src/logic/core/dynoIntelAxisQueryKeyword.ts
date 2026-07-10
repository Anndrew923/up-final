import type { SixAxisMetric } from '../../types/scoring';

/**
 * Routing-safe English axis tokens for suggestion-chip payloads.
 * WHY: Brand surface labels (Traction, Horsepower) do not match intent regex gates.
 */
export const DYNO_INTEL_AXIS_QUERY_KEYWORD: Record<SixAxisMetric, string> = {
  gripStrength: 'grip',
  strength: 'strength',
  explosivePower: 'explosive',
  cardio: 'cardio',
  muscleMass: 'muscle mass',
  bodyFat: 'FFMI',
};

export function resolveDynoIntelAxisQueryKeyword(axis: SixAxisMetric): string {
  return DYNO_INTEL_AXIS_QUERY_KEYWORD[axis];
}

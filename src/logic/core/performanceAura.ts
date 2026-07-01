import type { SixAxisMetric } from '../../types/scoring';
import { resolveScoreMeaningBand, type ScoreMeaningBandMetric } from './scoreMeaningCatalog';

export type PerformanceAuraKey =
  | 'none'
  | 'pulse'
  | 'flow'
  | 'shimmer'
  | 'lightning'
  | 'void_flame'
  | 'divine_light';

/**
 * Band id → aura presentation map for assessment breakthrough surfaces.
 * WHY: scoreMeaningCatalog owns decade gates; aura is presentation-only.
 */
export function resolveAuraFromBandId(bandId: string): PerformanceAuraKey {
  switch (bandId) {
    case 'BASE':
    case 'TIER_40':
    case 'TIER_50':
      return 'none';
    case 'TIER_60':
    case 'TIER_70':
      return 'pulse';
    case 'TIER_80':
      return 'flow';
    case 'TIER_90':
    case 'TIER_100':
      return 'shimmer';
    case 'TIER_110':
    case 'TIER_120':
      return 'lightning';
    case 'TIER_130':
    case 'TIER_140':
      return 'void_flame';
    case 'LEGEND':
    case 'PANTHEON':
      return 'divine_light';
    default:
      return 'none';
  }
}

export function resolvePerformanceAura(metric: SixAxisMetric, score: number): PerformanceAuraKey {
  return resolveAuraFromBandId(resolveScoreMeaningBand(metric, score).id);
}

export function resolvePerformanceAuraForMetric(
  metric: ScoreMeaningBandMetric,
  score: number
): PerformanceAuraKey {
  return resolveAuraFromBandId(resolveScoreMeaningBand(metric, score).id);
}

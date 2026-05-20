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
 * Band id → aura presentation map for assessment breakthrough surfaces (13- or 14-tier axes).
 * WHY: scoreMeaningCatalog owns bands; aura is presentation-only and must stay in sync across axes.
 */
export function resolveAuraFromBandId(bandId: string): PerformanceAuraKey {
  switch (bandId) {
    case 'BASE':
    case 'TIER_41':
    case 'TIER_51':
      return 'none';
    case 'TIER_61':
    case 'TIER_71':
      return 'pulse';
    case 'TIER_81':
      return 'flow';
    case 'TIER_91':
    case 'TIER_101':
      return 'shimmer';
    case 'TIER_111':
    case 'TIER_121':
      return 'lightning';
    case 'TIER_131':
    case 'TIER_141':
    case 'TIER_151':
    case 'TIER_161':
    case 'TIER_171':
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

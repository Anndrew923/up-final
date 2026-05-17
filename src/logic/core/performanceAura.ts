import type { SixAxisMetric } from '../../types/scoring';
import { resolveScoreBand } from './scoreMeaningCatalog';

export type PerformanceAuraKey =
  | 'none'
  | 'pulse'
  | 'flow'
  | 'shimmer'
  | 'lightning'
  | 'void_flame'
  | 'divine_light';

/**
 * Shared 13-band → 7-tier aura map for assessment breakthrough surfaces.
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
      return 'void_flame';
    case 'LEGEND':
      return 'divine_light';
    default:
      return 'none';
  }
}

export function resolvePerformanceAura(metric: SixAxisMetric, score: number): PerformanceAuraKey {
  const band = resolveScoreBand(metric, score);
  return resolveAuraFromBandId(band.id);
}

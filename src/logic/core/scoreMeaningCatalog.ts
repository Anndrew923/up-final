import type { SixAxisMetric } from '../../types/scoring';

export interface ScoreBand {
  id: string;
  min: number;
  max: number;
}

export type AxisTitleMapping = Record<SixAxisMetric, readonly ScoreBand[]>;

export const DEFAULT_SCORE_BANDS: readonly ScoreBand[] = [
  { id: 'BASE', min: 0, max: 40 },
  { id: 'TIER_41', min: 41, max: 70 },
  { id: 'TIER_71', min: 71, max: 90 },
  { id: 'TIER_91', min: 91, max: Number.POSITIVE_INFINITY },
] as const;

export const CARDIO_SCORE_BANDS: readonly ScoreBand[] = [
  { id: 'BASE', min: 0, max: 40 },
  { id: 'TIER_41', min: 41, max: 50 },
  { id: 'TIER_51', min: 51, max: 60 },
  { id: 'TIER_61', min: 61, max: 70 },
  { id: 'TIER_71', min: 71, max: 79 },
  { id: 'TIER_81', min: 80, max: 90 },
  { id: 'TIER_91', min: 91, max: 100 },
  { id: 'TIER_101', min: 101, max: 110 },
  { id: 'TIER_111', min: 111, max: 120 },
  { id: 'TIER_121', min: 121, max: 130 },
  { id: 'TIER_131', min: 131, max: 140 },
  { id: 'TIER_141', min: 141, max: 150 },
  { id: 'LEGEND', min: 151, max: Number.POSITIVE_INFINITY },
] as const;

export const STRENGTH_SCORE_BANDS: readonly ScoreBand[] = [
  { id: 'BASE', min: 0, max: 40 },
  { id: 'TIER_41', min: 41, max: 50 },
  { id: 'TIER_51', min: 51, max: 60 },
  { id: 'TIER_61', min: 61, max: 70 },
  { id: 'TIER_71', min: 71, max: 80 },
  { id: 'TIER_81', min: 81, max: 90 },
  { id: 'TIER_91', min: 91, max: 100 },
  { id: 'TIER_101', min: 101, max: 110 },
  { id: 'TIER_111', min: 111, max: 120 },
  { id: 'TIER_121', min: 121, max: 130 },
  { id: 'TIER_131', min: 131, max: 140 },
  { id: 'TIER_141', min: 141, max: 150 },
  { id: 'LEGEND', min: 151, max: Number.POSITIVE_INFINITY },
] as const;

export const SCORE_MEANING_CATALOG: AxisTitleMapping = {
  strength: STRENGTH_SCORE_BANDS,
  explosivePower: DEFAULT_SCORE_BANDS,
  cardio: CARDIO_SCORE_BANDS,
  muscleMass: DEFAULT_SCORE_BANDS,
  bodyFat: DEFAULT_SCORE_BANDS,
  gripStrength: DEFAULT_SCORE_BANDS,
};

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, score);
}

export function resolveScoreBand(metric: SixAxisMetric, score: number): ScoreBand {
  const bands = [...SCORE_MEANING_CATALOG[metric]].sort((a, b) => a.min - b.min);
  const safe = normalizeScore(score);
  if (bands.length === 0) {
    return { id: 'BASE', min: 0, max: Number.POSITIVE_INFINITY };
  }

  for (let i = 0; i < bands.length - 1; i += 1) {
    const current = bands[i];
    const next = bands[i + 1];
    if (safe < next.min) return current;
  }

  return bands[bands.length - 1];
}

export function getAxisMeaningI18nPrefix(metric: SixAxisMetric): string {
  return `scoreMeaning.axis.${metric}`;
}

export function getBandMeaningI18nPrefix(metric: SixAxisMetric, bandId: string): string {
  return `scoreMeaning.bands.${metric}.${bandId}`;
}

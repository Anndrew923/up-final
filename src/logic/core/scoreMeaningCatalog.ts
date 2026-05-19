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

/**
 * Grip-only 18-tier ladder — high bands split 151–200; PANTHEON for model overflow (191+).
 * WHY: Grip raw scores routinely exceed 150 after the 1.4× formula; other axes keep 13/14 tiers.
 */
export const GRIP_SCORE_BANDS: readonly ScoreBand[] = [
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
  { id: 'TIER_151', min: 151, max: 160 },
  { id: 'TIER_161', min: 161, max: 170 },
  { id: 'TIER_171', min: 171, max: 180 },
  { id: 'LEGEND', min: 181, max: 190 },
  { id: 'PANTHEON', min: 191, max: Number.POSITIVE_INFINITY },
] as const;

/**
 * Shared 14-tier ladder — LEGEND caps at 180; PANTHEON for limit-break scores (181+).
 * WHY: FFMI and muscle-mass axes share identical score steps; one source prevents drift.
 */
export const FOURTEEN_TIER_SCORE_BANDS: readonly ScoreBand[] = [
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
  { id: 'LEGEND', min: 151, max: 180 },
  { id: 'PANTHEON', min: 181, max: Number.POSITIVE_INFINITY },
] as const;

/** 14-tier FFMI (bodyFat axis). */
export const FFMI_SCORE_BANDS = FOURTEEN_TIER_SCORE_BANDS;

/** 14-tier muscle-mass axis. */
export const MUSCLE_SCORE_BANDS = FOURTEEN_TIER_SCORE_BANDS;

/** 14-tier explosive power (Torque Spec). */
export const EXPLOSIVE_SCORE_BANDS = FOURTEEN_TIER_SCORE_BANDS;

/** 14-tier arm size (Rim Spec) — optional storage; same ladder as explosive/muscle 14-tier. */
export const ARM_SIZE_SCORE_BANDS = FOURTEEN_TIER_SCORE_BANDS;

/** 14-tier homologation grade for Overall Score (共鳴出力) — LEGEND caps at 180; PANTHEON for 181+. */
export const OVERALL_SCORE_BANDS: readonly ScoreBand[] = [
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
  { id: 'LEGEND', min: 151, max: 180 },
  { id: 'PANTHEON', min: 181, max: Number.POSITIVE_INFINITY },
] as const;

export function resolveOverallGradeBand(score: number): string {
  const safe = Math.max(0, Number(score) || 0);
  for (let i = 0; i < OVERALL_SCORE_BANDS.length - 1; i += 1) {
    if (safe < OVERALL_SCORE_BANDS[i + 1].min) return OVERALL_SCORE_BANDS[i].id;
  }
  return 'PANTHEON';
}

export const SCORE_MEANING_CATALOG: AxisTitleMapping = {
  strength: STRENGTH_SCORE_BANDS,
  explosivePower: EXPLOSIVE_SCORE_BANDS,
  cardio: CARDIO_SCORE_BANDS,
  muscleMass: MUSCLE_SCORE_BANDS,
  bodyFat: FFMI_SCORE_BANDS,
  gripStrength: GRIP_SCORE_BANDS,
};

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, score);
}

export function resolveScoreBandFromBands(bands: readonly ScoreBand[], score: number): ScoreBand {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  const safe = normalizeScore(score);
  if (sorted.length === 0) {
    return { id: 'BASE', min: 0, max: Number.POSITIVE_INFINITY };
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (safe < next.min) return current;
  }

  return sorted[sorted.length - 1];
}

export function resolveScoreBand(metric: SixAxisMetric, score: number): ScoreBand {
  return resolveScoreBandFromBands(SCORE_MEANING_CATALOG[metric], score);
}

export function resolveArmSizeScoreBand(score: number): ScoreBand {
  return resolveScoreBandFromBands(ARM_SIZE_SCORE_BANDS, score);
}

export type ScoreMeaningBandMetric = SixAxisMetric | 'armSize';

export function getScoreMeaningBands(metric: ScoreMeaningBandMetric): readonly ScoreBand[] {
  return metric === 'armSize' ? ARM_SIZE_SCORE_BANDS : SCORE_MEANING_CATALOG[metric];
}

export function resolveScoreMeaningBand(metric: ScoreMeaningBandMetric, score: number): ScoreBand {
  return resolveScoreBandFromBands(getScoreMeaningBands(metric), score);
}

export interface ScoreMeaningMilestone {
  currentBand: ScoreBand;
  nextMilestone: number | null;
  remainingPoints: number | null;
}

/** Next-tier milestone for UI and breakthrough modal — single source for band index walks. */
export function resolveScoreMeaningMilestone(
  metric: ScoreMeaningBandMetric,
  score: number,
): ScoreMeaningMilestone {
  const safeScore = normalizeScore(score);
  const currentBand = resolveScoreMeaningBand(metric, safeScore);
  const bands = getScoreMeaningBands(metric);
  const currentIndex = bands.findIndex((band) => band.id === currentBand.id);
  const nextBand = currentIndex >= 0 ? bands[currentIndex + 1] : undefined;
  if (!nextBand) {
    return { currentBand, nextMilestone: null, remainingPoints: null };
  }
  const nextMilestone = nextBand.min;
  return {
    currentBand,
    nextMilestone,
    remainingPoints: Math.max(0, Math.ceil(nextMilestone - safeScore)),
  };
}

export function getAxisMeaningI18nPrefix(metric: SixAxisMetric): string {
  return `scoreMeaning.axis.${metric}`;
}

export function getBandMeaningI18nPrefix(metric: ScoreMeaningBandMetric, bandId: string): string {
  return `scoreMeaning.bands.${metric}.${bandId}`;
}

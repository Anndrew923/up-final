import type { CardioAssessmentTab } from './cardioScoring';
import type { SixAxisMetric } from '../../types/scoring';

export interface ScoreBand {
  id: string;
  min: number;
  max: number;
}

export type AxisTitleMapping = Record<SixAxisMetric, readonly ScoreBand[]>;

/**
 * Shared decade gates for six-axis + armSize (Score >= min).
 * WHY: Aligns with OVERALL_GRADE_TIERS left-digit UX; single source prevents axis/overall drift.
 */
export const DECADE_AXIS_TIER_BANDS: readonly ScoreBand[] = [
  { id: 'BASE', min: 0, max: 39.99 },
  { id: 'TIER_40', min: 40, max: 49.99 },
  { id: 'TIER_50', min: 50, max: 59.99 },
  { id: 'TIER_60', min: 60, max: 69.99 },
  { id: 'TIER_70', min: 70, max: 79.99 },
  { id: 'TIER_80', min: 80, max: 89.99 },
  { id: 'TIER_90', min: 90, max: 99.99 },
  { id: 'TIER_100', min: 100, max: 109.99 },
  { id: 'TIER_110', min: 110, max: 119.99 },
  { id: 'TIER_120', min: 120, max: 129.99 },
  { id: 'TIER_130', min: 130, max: 139.99 },
  { id: 'TIER_140', min: 140, max: 149.99 },
  { id: 'LEGEND', min: 150, max: 179.99 },
  { id: 'PANTHEON', min: 180, max: 999 },
] as const;

/** @deprecated Use `DECADE_AXIS_TIER_BANDS`. */
export const FOURTEEN_TIER_SCORE_BANDS = DECADE_AXIS_TIER_BANDS;

/**
 * Grip-only 18-tier ladder — decade mids + 150/160/170 high bands; PANTHEON >= 180.
 * WHY: Grip scores often exceed 150 after formula; extra tens before pantheon match product scale.
 */
export const DECADE_GRIP_TIER_BANDS: readonly ScoreBand[] = [
  { id: 'BASE', min: 0, max: 39.99 },
  { id: 'TIER_40', min: 40, max: 49.99 },
  { id: 'TIER_50', min: 50, max: 59.99 },
  { id: 'TIER_60', min: 60, max: 69.99 },
  { id: 'TIER_70', min: 70, max: 79.99 },
  { id: 'TIER_80', min: 80, max: 89.99 },
  { id: 'TIER_90', min: 90, max: 99.99 },
  { id: 'TIER_100', min: 100, max: 109.99 },
  { id: 'TIER_110', min: 110, max: 119.99 },
  { id: 'TIER_120', min: 120, max: 129.99 },
  { id: 'TIER_130', min: 130, max: 139.99 },
  { id: 'TIER_140', min: 140, max: 149.99 },
  { id: 'TIER_150', min: 150, max: 159.99 },
  { id: 'TIER_160', min: 160, max: 169.99 },
  { id: 'TIER_170', min: 170, max: 179.99 },
  { id: 'PANTHEON', min: 180, max: 999 },
] as const;

export const GRIP_SCORE_BANDS = DECADE_GRIP_TIER_BANDS;

export const DEFAULT_SCORE_BANDS: readonly ScoreBand[] = [
  { id: 'BASE', min: 0, max: 39.99 },
  { id: 'TIER_40', min: 40, max: 69.99 },
  { id: 'TIER_70', min: 70, max: 89.99 },
  { id: 'TIER_90', min: 90, max: 999 },
] as const;

export const CARDIO_SCORE_BANDS = DECADE_AXIS_TIER_BANDS;

/** Copy-only metric for Cooper 12-min band text — shares cardio decade gates, not a six-axis id. */
export const COOPER_SCORE_MEANING_METRIC = 'cooper' as const;
export const STRENGTH_SCORE_BANDS = DECADE_AXIS_TIER_BANDS;
export const FFMI_SCORE_BANDS = DECADE_AXIS_TIER_BANDS;
export const MUSCLE_SCORE_BANDS = DECADE_AXIS_TIER_BANDS;
export const EXPLOSIVE_SCORE_BANDS = DECADE_AXIS_TIER_BANDS;
export const ARM_SIZE_SCORE_BANDS = DECADE_AXIS_TIER_BANDS;

/**
 * Decade-bound homologation tiers for Overall Score (整車性能指數).
 * WHY: Score >= min crosses a round-ten gate (left-digit UX); separate from axis band copy in core.json.
 */
export const OVERALL_GRADE_TIERS: readonly ScoreBand[] = [
  { id: 'BASE', min: 0, max: 39.99 },
  { id: 'TIER_40', min: 40, max: 49.99 },
  { id: 'TIER_50', min: 50, max: 59.99 },
  { id: 'TIER_60', min: 60, max: 69.99 },
  { id: 'TIER_70', min: 70, max: 79.99 },
  { id: 'TIER_80', min: 80, max: 89.99 },
  { id: 'TIER_90', min: 90, max: 99.99 },
  { id: 'TIER_100', min: 100, max: 109.99 },
  { id: 'TIER_110', min: 110, max: 119.99 },
  { id: 'TIER_120', min: 120, max: 129.99 },
  { id: 'TIER_130', min: 130, max: 139.99 },
  { id: 'TIER_140', min: 140, max: 149.99 },
  { id: 'LEGEND', min: 150, max: 179.99 },
  { id: 'PANTHEON', min: 180, max: 999 },
] as const;

/** @deprecated Use `OVERALL_GRADE_TIERS`. */
export const OVERALL_SCORE_BANDS = OVERALL_GRADE_TIERS;

/** Homologation tier ids — must stay aligned with `OVERALL_GRADE_TIERS`. */
export const OVERALL_GRADE_BAND_IDS = [
  'BASE',
  'TIER_40',
  'TIER_50',
  'TIER_60',
  'TIER_70',
  'TIER_80',
  'TIER_90',
  'TIER_100',
  'TIER_110',
  'TIER_120',
  'TIER_130',
  'TIER_140',
  'LEGEND',
  'PANTHEON',
] as const;

export type OverallGradeBandId = (typeof OVERALL_GRADE_BAND_IDS)[number];

export function resolveOverallGradeBand(score: number): OverallGradeBandId {
  return resolveScoreBandFromBands(OVERALL_GRADE_TIERS, score).id as OverallGradeBandId;
}

/** Centralizes i18n key paths for homologation grade copy — avoids scattered string templates in UI. */
export function getOverallGradeKeys(bandId: OverallGradeBandId) {
  return {
    name: `home.overallGrade.${bandId}.name`,
    desc: `home.overallGrade.${bandId}.desc`,
    representativeCar: `home.overallGrade.${bandId}.representativeCar`,
    carPrice: `home.overallGrade.${bandId}.carPrice`,
    carSpecLabel: 'home.overallGrade.carSpecLabel',
    priceLabel: 'home.overallGrade.priceLabel',
    kicker: 'home.overallGrade.kicker',
    hint: 'home.overallGrade.viewDetailHint',
  } as const;
}

/** Full reveal line for resonance ritual (name + desc) — homepage badge uses name only. */
export function formatOverallGradeRevealLine(name: string, desc: string): string {
  return `${name}\n${desc}`;
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

export type ScoreMeaningBandMetric = SixAxisMetric | 'armSize' | typeof COOPER_SCORE_MEANING_METRIC;

export function getScoreMeaningBands(metric: ScoreMeaningBandMetric): readonly ScoreBand[] {
  if (metric === 'armSize') return ARM_SIZE_SCORE_BANDS;
  if (metric === COOPER_SCORE_MEANING_METRIC) return CARDIO_SCORE_BANDS;
  return SCORE_MEANING_CATALOG[metric];
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
  score: number
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

/** Maps cardio assessment tab → band-copy i18n metric (Cooper vs 5km cruise). */
export function scoreMeaningMetricForCardioTab(tab: CardioAssessmentTab): ScoreMeaningBandMetric {
  return tab === 'cooper' ? COOPER_SCORE_MEANING_METRIC : 'cardio';
}

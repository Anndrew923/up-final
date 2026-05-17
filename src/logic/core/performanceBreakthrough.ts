import type { TFunction } from 'i18next';
import { getGripRankMetadata } from './gripStrength';
import { resolvePerformanceAuraForMetric, type PerformanceAuraKey } from './performanceAura';
import { translateScoreBandMeaning } from './scoreMeaningCopy';
import {
  getBandMeaningI18nPrefix,
  resolveScoreMeaningBand,
  resolveScoreMeaningMilestone,
  type ScoreMeaningBandMetric,
} from './scoreMeaningCatalog';

export type BreakthroughMetric = ScoreMeaningBandMetric;

export interface PerformanceBreakthroughMilestone {
  currentMin: number;
  nextMin: number | null;
  progress01: number;
  remainingPoints: number | null;
}

export interface PerformanceBreakthroughPayload {
  metric: BreakthroughMetric;
  score: number;
  scoreDisplay: string;
  title: string;
  summary: string;
  auraKey: PerformanceAuraKey;
  auraLabel: string;
  rankLabel: string;
  milestone: PerformanceBreakthroughMilestone;
}

export function computeMilestoneProgress(
  score: number,
  currentMin: number,
  nextMin: number | null,
): number {
  if (nextMin === null) return 1;
  const span = nextMin - currentMin;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (score - currentMin) / span));
}

function resolveRankLabel(t: TFunction, metric: BreakthroughMetric, score: number): string {
  const band = resolveScoreMeaningBand(metric, score);
  if (metric === 'gripStrength') {
    const rank = getGripRankMetadata(score);
    const label = t(`grip.ranks.${rank.rankKey}`);
    return label === `grip.ranks.${rank.rankKey}` ? band.id : label;
  }
  const prefix = getBandMeaningI18nPrefix(metric, band.id);
  const label = t(`${prefix}.title`);
  return label === `${prefix}.title` ? band.id : label;
}

export function buildPerformanceBreakthroughPayload(
  t: TFunction,
  metric: BreakthroughMetric,
  score: number,
  scoreDecimals: number,
): PerformanceBreakthroughPayload | null {
  if (!Number.isFinite(score)) return null;
  const safeScore = Math.max(0, score);
  const meaning = translateScoreBandMeaning(t, metric, safeScore);
  const auraKey = resolvePerformanceAuraForMetric(metric, safeScore);
  const auraLabel = t(`assessment.auras.${auraKey}`);
  const resolvedAura =
    auraLabel === `assessment.auras.${auraKey}` ? auraKey : auraLabel;
  const { currentBand, nextMilestone, remainingPoints } = resolveScoreMeaningMilestone(
    metric,
    safeScore,
  );

  return {
    metric,
    score: safeScore,
    scoreDisplay: safeScore.toFixed(scoreDecimals),
    title: meaning.title,
    summary: meaning.summary,
    auraKey,
    auraLabel: resolvedAura,
    rankLabel: resolveRankLabel(t, metric, safeScore),
    milestone: {
      currentMin: currentBand.min,
      nextMin: nextMilestone,
      progress01: computeMilestoneProgress(safeScore, currentBand.min, nextMilestone),
      remainingPoints,
    },
  };
}

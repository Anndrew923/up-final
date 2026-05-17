import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../../types/scoring';
import { getGripRankMetadata } from './gripStrength';
import { resolvePerformanceAura, type PerformanceAuraKey } from './performanceAura';
import {
  resolveScoreBand,
  SCORE_MEANING_CATALOG,
  getBandMeaningI18nPrefix,
} from './scoreMeaningCatalog';

export interface PerformanceBreakthroughMilestone {
  currentMin: number;
  nextMin: number | null;
  progress01: number;
  remainingPoints: number | null;
}

export interface PerformanceBreakthroughPayload {
  metric: SixAxisMetric;
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
  nextMin: number | null
): number {
  if (nextMin === null) return 1;
  const span = nextMin - currentMin;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (score - currentMin) / span));
}

function readScoreMeaning(
  t: TFunction,
  metric: SixAxisMetric,
  score: number
): { title: string; summary: string } {
  const band = resolveScoreBand(metric, score);
  const prefix = getBandMeaningI18nPrefix(metric, band.id);
  const fallbackTitle = t('scoreMeaning.fallback.title');
  const fallbackSummary = t('scoreMeaning.fallback.summary');
  const resolvedTitle = t(`${prefix}.title`);
  const resolvedSummary = t(`${prefix}.summary`);
  return {
    title: resolvedTitle === `${prefix}.title` ? fallbackTitle : resolvedTitle,
    summary: resolvedSummary === `${prefix}.summary` ? fallbackSummary : resolvedSummary,
  };
}

function resolveMilestone(metric: SixAxisMetric, score: number): PerformanceBreakthroughMilestone {
  const safeScore = Math.max(0, score);
  const band = resolveScoreBand(metric, safeScore);
  const bands = [...SCORE_MEANING_CATALOG[metric]].sort((a, b) => a.min - b.min);
  const currentIndex = bands.findIndex((entry) => entry.id === band.id);
  const nextBand = currentIndex >= 0 ? bands[currentIndex + 1] : undefined;
  const nextMin = nextBand ? nextBand.min : null;
  const remainingPoints =
    nextMin === null ? null : Math.max(0, Math.ceil(nextMin - safeScore));

  return {
    currentMin: band.min,
    nextMin,
    progress01: computeMilestoneProgress(safeScore, band.min, nextMin),
    remainingPoints,
  };
}

function resolveRankLabel(t: TFunction, metric: SixAxisMetric, score: number): string {
  const band = resolveScoreBand(metric, score);
  if (metric === 'gripStrength') {
    const rank = getGripRankMetadata(score);
    const label = t(`grip.ranks.${rank.rankKey}`);
    return label === `grip.ranks.${rank.rankKey}` ? band.id : label;
  }
  const label = t(`assessment.breakthrough.ranks.${band.id}`);
  return label === `assessment.breakthrough.ranks.${band.id}` ? band.id : label;
}

export function buildPerformanceBreakthroughPayload(
  t: TFunction,
  metric: SixAxisMetric,
  score: number,
  scoreDecimals: number
): PerformanceBreakthroughPayload | null {
  if (!Number.isFinite(score)) return null;
  const safeScore = Math.max(0, score);
  const meaning = readScoreMeaning(t, metric, safeScore);
  const auraKey = resolvePerformanceAura(metric, safeScore);
  const auraLabel = t(`assessment.auras.${auraKey}`);
  const resolvedAura =
    auraLabel === `assessment.auras.${auraKey}` ? auraKey : auraLabel;

  return {
    metric,
    score: safeScore,
    scoreDisplay: safeScore.toFixed(scoreDecimals),
    title: meaning.title,
    summary: meaning.summary,
    auraKey,
    auraLabel: resolvedAura,
    rankLabel: resolveRankLabel(t, metric, safeScore),
    milestone: resolveMilestone(metric, safeScore),
  };
}

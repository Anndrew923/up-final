import type { TFunction } from 'i18next';
import {
  getBandMeaningI18nPrefix,
  resolveScoreMeaningBand,
  type ScoreMeaningBandMetric,
} from './scoreMeaningCatalog';

/** Resolves tier title/summary via i18n with fallback — shared by hook and breakthrough modal. */
export function translateScoreBandMeaning(
  t: TFunction,
  metric: ScoreMeaningBandMetric,
  score: number
): { title: string; summary: string } {
  const band = resolveScoreMeaningBand(metric, score);
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

/** Codex row copy for a fixed band id — same fallback rules as score-based lookup. */
export function resolveCodexBandRowCopy(
  t: TFunction,
  metric: ScoreMeaningBandMetric,
  bandId: string
): { title: string; summary: string } {
  const prefix = getBandMeaningI18nPrefix(metric, bandId);
  const fallbackTitle = t('scoreMeaning.fallback.title');
  const fallbackSummary = t('scoreMeaning.fallback.summary');
  const resolvedTitle = t(`${prefix}.title`);
  const resolvedSummary = t(`${prefix}.summary`);
  return {
    title: resolvedTitle === `${prefix}.title` ? fallbackTitle : resolvedTitle,
    summary: resolvedSummary === `${prefix}.summary` ? fallbackSummary : resolvedSummary,
  };
}

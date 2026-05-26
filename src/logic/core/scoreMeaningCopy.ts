import type { TFunction } from 'i18next';
import {
  getBandMeaningI18nPrefix,
  resolveScoreMeaningBand,
  type ScoreMeaningBandMetric,
} from './scoreMeaningCatalog';

export interface ScoreBandCopy {
  title: string;
  summary: string;
}

/** Shared i18n resolution + fallback for any `scoreMeaning.bands.*` prefix. */
function resolveBandCopyByPrefix(t: TFunction, prefix: string): ScoreBandCopy {
  const fallbackTitle = t('scoreMeaning.fallback.title');
  const fallbackSummary = t('scoreMeaning.fallback.summary');
  const resolvedTitle = t(`${prefix}.title`);
  const resolvedSummary = t(`${prefix}.summary`);
  return {
    title: resolvedTitle === `${prefix}.title` ? fallbackTitle : resolvedTitle,
    summary: resolvedSummary === `${prefix}.summary` ? fallbackSummary : resolvedSummary,
  };
}

/** Resolves tier title/summary via i18n with fallback — shared by hook and breakthrough modal. */
export function translateScoreBandMeaning(
  t: TFunction,
  metric: ScoreMeaningBandMetric,
  score: number
): ScoreBandCopy {
  const band = resolveScoreMeaningBand(metric, score);
  return resolveBandCopyByPrefix(t, getBandMeaningI18nPrefix(metric, band.id));
}

/** Codex row copy for a fixed band id — same fallback rules as score-based lookup. */
export function resolveCodexBandRowCopy(
  t: TFunction,
  metric: ScoreMeaningBandMetric,
  bandId: string
): ScoreBandCopy {
  return resolveBandCopyByPrefix(t, getBandMeaningI18nPrefix(metric, bandId));
}

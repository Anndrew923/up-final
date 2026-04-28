import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SixAxisMetric } from '../types/scoring';
import { SCORE_MEANING_CATALOG, getBandMeaningI18nPrefix, resolveScoreBand } from '../logic/core/scoreMeaningCatalog';

export interface ScoreMeaningResult {
  title: string;
  summary: string;
  nextMilestone: number | null;
  remainingPoints: number | null;
}

export function useScoreMeaning(metric: SixAxisMetric, score: number | null | undefined): ScoreMeaningResult | null {
  const { t } = useTranslation('common');

  return useMemo(() => {
    if (!Number.isFinite(score ?? NaN)) return null;
    const safeScore = Math.max(0, Number(score));
    const currentBand = resolveScoreBand(metric, safeScore);
    const prefix = getBandMeaningI18nPrefix(metric, currentBand.id);
    const fallbackTitle = t('scoreMeaning.fallback.title');
    const fallbackSummary = t('scoreMeaning.fallback.summary');

    const resolvedTitle = t(`${prefix}.title`);
    const resolvedSummary = t(`${prefix}.summary`);
    const title = resolvedTitle === `${prefix}.title` ? fallbackTitle : resolvedTitle;
    const summary = resolvedSummary === `${prefix}.summary` ? fallbackSummary : resolvedSummary;

    const bands = SCORE_MEANING_CATALOG[metric];
    const currentIndex = bands.findIndex((band) => band.id === currentBand.id);
    const nextBand = currentIndex >= 0 ? bands[currentIndex + 1] : undefined;
    if (!nextBand) {
      return {
        title,
        summary,
        nextMilestone: null,
        remainingPoints: null,
      };
    }

    const nextMilestone = nextBand.min;
    const remainingPoints = Math.max(0, Math.ceil(nextMilestone - safeScore));
    return {
      title,
      summary,
      nextMilestone,
      remainingPoints,
    };
  }, [metric, score, t]);
}

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { translateScoreBandMeaning } from '../logic/core/scoreMeaningCopy';
import {
  resolveScoreMeaningMilestone,
  type ScoreMeaningBandMetric,
} from '../logic/core/scoreMeaningCatalog';

export type ScoreMeaningMetric = ScoreMeaningBandMetric;

export interface ScoreMeaningResult {
  title: string;
  summary: string;
  nextMilestone: number | null;
  remainingPoints: number | null;
}

export function useScoreMeaning(
  metric: ScoreMeaningMetric,
  score: number | null | undefined
): ScoreMeaningResult | null {
  const { t } = useTranslation('common');

  return useMemo(() => {
    if (!Number.isFinite(score ?? NaN)) return null;
    const safeScore = Math.max(0, Number(score));
    const { title, summary } = translateScoreBandMeaning(t, metric, safeScore);
    const { nextMilestone, remainingPoints } = resolveScoreMeaningMilestone(metric, safeScore);
    return { title, summary, nextMilestone, remainingPoints };
  }, [metric, score, t]);
}

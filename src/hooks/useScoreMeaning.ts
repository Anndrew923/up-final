import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  resolveHumanScaleMetaFromBandId,
  type HumanScaleDecadeKey,
} from '../logic/core/humanScaleBandResolver';
import { translateScoreBandMeaning } from '../logic/core/scoreMeaningCopy';
import {
  resolveScoreMeaningMilestone,
  type ScoreMeaningBandMetric,
} from '../logic/core/scoreMeaningCatalog';

export type ScoreMeaningMetric = ScoreMeaningBandMetric;

export interface ScoreMeaningResult {
  title: string;
  summary: string;
  bandId: string;
  decadeKey: HumanScaleDecadeKey;
  populationClass: string;
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
    const { currentBand, nextMilestone, remainingPoints } = resolveScoreMeaningMilestone(
      metric,
      safeScore
    );
    // WHY: Reuse milestone bandId — avoid a second scoreMeaningCatalog walk.
    const { decadeKey, populationClass } = resolveHumanScaleMetaFromBandId(t, currentBand.id);
    return {
      title,
      summary,
      bandId: currentBand.id,
      decadeKey,
      populationClass,
      nextMilestone,
      remainingPoints,
    };
  }, [metric, score, t]);
}

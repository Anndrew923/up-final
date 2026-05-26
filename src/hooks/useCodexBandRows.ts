import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveOverallGradeTierCopy } from '../i18n/resolveOverallGradeCopy';
import {
  formatCodexTierRange,
  getBandsForCodexTab,
  getMetricForCodexTab,
  getUserScoreForCodexTab,
  isOverallGradeBandId,
  type CodexTab,
  type VehicleCodexScores,
} from '../logic/core/codexCatalog';
import { resolveCodexBandRowCopy } from '../logic/core/scoreMeaningCopy';
import {
  resolveOverallGradeBand,
  resolveScoreMeaningBand,
} from '../logic/core/scoreMeaningCatalog';

export interface CodexBandRowModel {
  bandId: string;
  title: string;
  summary: string;
  rangeDisplay: string;
  isActive: boolean;
}

export function useCodexBandRows(activeTab: CodexTab, scores: VehicleCodexScores) {
  const { t, i18n } = useTranslation('common');

  const rows = useMemo((): CodexBandRowModel[] => {
    const isOverall = activeTab === 'overall';
    const metric = getMetricForCodexTab(activeTab);
    const userScore = getUserScoreForCodexTab(activeTab, scores);
    const bands = getBandsForCodexTab(activeTab);

    const activeBandId = isOverall
      ? resolveOverallGradeBand(userScore)
      : metric
        ? resolveScoreMeaningBand(metric, userScore).id
        : '';

    return bands.map((band) => {
      let title = '';
      let summary = '';

      if (isOverall && isOverallGradeBandId(band.id)) {
        const copy = resolveOverallGradeTierCopy(t, band.id);
        title = copy.name;
        summary = copy.desc;
      } else if (metric) {
        const rowCopy = resolveCodexBandRowCopy(t, metric, band.id);
        title = rowCopy.title;
        summary = rowCopy.summary;
      }

      return {
        bandId: band.id,
        title,
        summary,
        rangeDisplay: formatCodexTierRange(band),
        isActive: band.id === activeBandId,
      };
    });
  }, [activeTab, scores, t, i18n.language]);

  return rows;
}

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SixAxisMetric } from '../types/scoring';
import { resolveDynoIntelAxisQueryKeyword } from '../logic/core/dynoIntelAxisQueryKeyword';
import {
  buildDynoIntelSuggestions,
  resolveDynoIntelAxisSuggestionQuery,
} from '../logic/core/buildDynoIntelSuggestions';

/**
 * UI-facing adapter: maps i18n label/query assets + weakest axis into chip payloads.
 */
export function useDynoIntelSuggestions(weakestAxis: SixAxisMetric | null) {
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language === 'zh-Hant' ? 'zh-Hant' : 'en';

  return useMemo(() => {
    const axisQuery = weakestAxis
      ? resolveDynoIntelAxisSuggestionQuery(
          weakestAxis,
          t('dynoIntel.suggestions.axis.queryTemplate'),
          (axis) =>
            locale === 'zh-Hant'
              ? t(`axisLexicon.input.short.${axis}`)
              : resolveDynoIntelAxisQueryKeyword(axis)
        )
      : null;

    return buildDynoIntelSuggestions({
      overallLabel: t('dynoIntel.suggestions.overall.label'),
      overallQuery: t('dynoIntel.suggestions.overall.query'),
      axisLabel: t('dynoIntel.suggestions.axis.label'),
      axisQuery,
      methodologyLabel: t('dynoIntel.suggestions.methodology.label'),
      methodologyQuery: t('dynoIntel.suggestions.methodology.query'),
    });
  }, [locale, t, weakestAxis]);
}

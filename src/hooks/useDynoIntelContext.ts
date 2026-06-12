import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildDynoIntelContext } from '../logic/core/buildDynoIntelContext';
import type { BuildDynoIntelContextInput, DynoIntelContextV1 } from '../logic/core/dynoIntelTypes';
import { useDynoIntelContextBuilder } from './useDynoIntelContextBuilder';

export interface UseDynoIntelContextInput
  extends Pick<BuildDynoIntelContextInput, 'mode' | 'focusAxis' | 'targetWeightKg'> {}

/**
 * Facade: gathers local-first radar + history slices, then delegates to pure logic builder.
 */
export function useDynoIntelContext(input: UseDynoIntelContextInput): DynoIntelContextV1 {
  const { i18n } = useTranslation();
  const getSnapshot = useDynoIntelContextBuilder();

  return useMemo(() => {
    const snapshot = getSnapshot();
    const locale = i18n.language === 'zh-Hant' ? 'zh-Hant' : 'en';
    return buildDynoIntelContext({
      radarInput: snapshot,
      historyRecords: snapshot.historyRecords,
      locale,
      mode: input.mode,
      focusAxis: input.focusAxis,
      targetWeightKg: input.targetWeightKg,
    });
  }, [getSnapshot, i18n.language, input.focusAxis, input.mode, input.targetWeightKg]);
}

import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../types/scoring';
import { resolveSixAxisChartLabel } from './resolveSixAxisChartLabel';

export interface SixAxisDataGridLabelParts {
  chart: string;
  inputShort: string;
  code: string;
}

/**
 * Home / ladder data-grid label parts (WHY): One scan line bridges radar chart copy,
 * fitness input.short, and output.code — `home.radar.axisChart` stays chart parity source.
 */
export function resolveSixAxisDataGridLabelParts(
  t: TFunction,
  metric: SixAxisMetric
): SixAxisDataGridLabelParts {
  return {
    chart: resolveSixAxisChartLabel(t, metric),
    inputShort: t(`axisLexicon.input.short.${metric}`, { ns: 'common' }),
    code: t(`axisLexicon.output.code.${metric}`, { ns: 'common' }),
  };
}

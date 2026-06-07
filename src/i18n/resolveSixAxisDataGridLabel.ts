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

/** Visible grid label — rigid dual-track (WHY): 2×3 data grid stays symmetric; locale keeps chart ≠ input.short. */
export function formatSixAxisDataGridVisibleLabel(parts: SixAxisDataGridLabelParts): string {
  return `${parts.chart} · ${parts.inputShort}`;
}

/** Hover spec sheet — mirrors visible collapse, then appends // CODE for power users. */
export function formatSixAxisDataGridTitle(parts: SixAxisDataGridLabelParts): string {
  return `${formatSixAxisDataGridVisibleLabel(parts)} // ${parts.code}`;
}

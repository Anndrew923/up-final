import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../types/scoring';

/**
 * Hex radar vertex labels (WHY): `output.full` strings truncate on the SVG ring;
 * the chart track uses compact copy under `home.radar.axisChart`, parity-locked to
 * `axisLexicon.output.chart` in `sixAxisLexicon.test.ts`.
 */
export function resolveSixAxisChartLabel(t: TFunction, metric: SixAxisMetric): string {
  return t(`home.radar.axisChart.${metric}`, { ns: 'common' });
}

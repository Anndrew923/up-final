import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../types/scoring';

/**
 * Hex radar vertex labels (WHY): Fitness-first compact copy under `home.radar.axisChart`,
 * parity-locked to `axisLexicon.output.chart`. Mechanical `output.full` stays on
 * `home.radar.axis` / assessment / ladder mirrors — not on the SVG ring.
 */
export function resolveSixAxisChartLabel(t: TFunction, metric: SixAxisMetric): string {
  return t(`home.radar.axisChart.${metric}`, { ns: 'common' });
}

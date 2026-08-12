import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../types/scoring';

/**
 * Fitness-science axis labels (WHY): History table headers and data-grid input track
 * read `axisLexicon.input.short` — intentionally not the mechanical `output.full` track.
 */
export function resolveSixAxisInputShortLabel(t: TFunction, metric: SixAxisMetric): string {
  return t(`axisLexicon.input.short.${metric}`, { ns: 'common' });
}

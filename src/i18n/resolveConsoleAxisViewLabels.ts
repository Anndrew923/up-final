import type { TFunction } from 'i18next';
import type { ConsoleAxisViewMode } from '../logic/core/consoleAxisViewMode';
import type { SixAxisMetric } from '../types/scoring';
import { resolveSixAxisChartLabel } from './resolveSixAxisChartLabel';

/**
 * Console radar vertex labels by view mode (WHY): Fitness keeps sport chart copy;
 * telemetry flips to compact mechanical nouns (`mechShort`) without touching score math.
 */
export function resolveConsoleRadarVertexLabel(
  t: TFunction,
  metric: SixAxisMetric,
  mode: ConsoleAxisViewMode
): string {
  if (mode === 'telemetry') {
    return t(`axisLexicon.output.mechShort.${metric}`, { ns: 'common' });
  }
  return resolveSixAxisChartLabel(t, metric);
}

/**
 * Console 2×3 HUD primary line by view mode (WHY): Fitness stays pure sport primary;
 * telemetry uses hard-mapped `Noun // CODE` strings (no stacked secondary tier).
 */
export function resolveConsoleDataGridPrimary(
  t: TFunction,
  metric: SixAxisMetric,
  mode: ConsoleAxisViewMode
): string {
  if (mode === 'telemetry') {
    return t(`axisLexicon.output.telemetryGrid.${metric}`, { ns: 'common' });
  }
  return t(`axisLexicon.input.grid.${metric}`, { ns: 'common' });
}

/**
 * Console hero index label by view mode (WHY): Fitness uses combat/power framing;
 * telemetry keeps vehicle chassis wording — closes the lexicon gap on the big readout.
 */
export function resolveConsoleOverallAverageLabel(
  t: TFunction,
  mode: ConsoleAxisViewMode
): string {
  return t(`home.consoleAxisView.overallAverage.${mode}`, { ns: 'common' });
}

/**
 * Map a LogEvolutionReport → isolated evolution canvas input.
 *
 * WHY: Keeps i18n / axis label resolution out of `evolutionCardComposer` so the
 * painter stays UI-agnostic and share copy cannot hardcode product strings.
 */
import type { TFunction } from 'i18next';
import { resolveSixAxisChartLabel } from '../i18n/resolveSixAxisChartLabel';
import type { EvolutionCardComposeInput } from '../lib/evolutionCardComposer';
import { formatEvolutionCardDate } from '../logic/core/formatEvolutionCardDate';
import type { LogEvolutionReport } from '../logic/core/logEvolutionReport';
import { buildSixAxisRadarData } from '../logic/core/scoring';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../types/scoring';

export function buildEvolutionCardComposeInput(
  report: LogEvolutionReport,
  t: TFunction
): EvolutionCardComposeInput {
  const emptyScore = t('history.valueEmpty', { ns: 'common' });
  const axisLabels = Object.fromEntries(
    SIX_AXIS_METRICS.map((axis) => [axis, resolveSixAxisChartLabel(t, axis)])
  ) as Record<SixAxisMetric, string>;

  const baselineDate = formatEvolutionCardDate(report.baseline?.createdAt, emptyScore);
  const currentDate = formatEvolutionCardDate(report.current?.createdAt, emptyScore);
  const dateRange = t('history.evolution.cardDateRange', {
    ns: 'common',
    from: baselineDate,
    to: currentDate,
  });

  const localizeAxes = (scores: Parameters<typeof buildSixAxisRadarData>[0]) =>
    buildSixAxisRadarData(scores).map((point) => ({
      ...point,
      label: axisLabels[point.key as SixAxisMetric] ?? point.label,
    }));

  return {
    mode: report.mode,
    baselineOverall: report.baseline?.overallScore ?? null,
    currentOverall: report.current?.overallScore ?? null,
    overallDelta: report.overallDelta,
    baselineAxes: report.baseline ? localizeAxes(report.baseline.scores) : [],
    currentAxes: report.current ? localizeAxes(report.current.scores) : [],
    deltas: report.deltas,
    copy: {
      brandHeader: t('history.evolution.cardBrand', { ns: 'common' }),
      dateRange,
      overallLabel: t('history.evolution.overallLabel', { ns: 'common' }),
      baselineLocked: t('history.evolution.baselineLocked', { ns: 'common' }),
      prBadge: t('history.evolution.prBadge', { ns: 'common' }),
      emptyScore,
      legendBaseline: t('history.evolution.legendBaseline', {
        ns: 'common',
        date: baselineDate,
      }),
      legendCurrent: t('history.evolution.legendCurrent', {
        ns: 'common',
        date: currentDate,
      }),
      axisLabels,
    },
  };
}

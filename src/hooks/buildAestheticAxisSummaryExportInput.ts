/**
 * Map an axis composite score into dual-hero telemetry compose input.
 * WHY: Parallel to single-leaf builder — keeps max(leaf) CTAs out of composite assess flow.
 */
import type { TFunction } from 'i18next';
import {
  AXIS_SUMMARY_OVERFLOW_HERO,
  type AestheticAxisSummaryAxis,
} from '../logic/aesthetic/axisSummaryReport';
import {
  formatMuscleAxisMeasuredReading,
  isValidMuscleAxisMeasured,
  type MuscleAxisMeasuredMetrics,
} from '../logic/aesthetic/muscleAxisMeasured';
import { resolveTelemetryVerdictForTarget } from '../logic/aesthetic/telemetryVerdictCatalog';
import { resolveHumanScaleBandMeta } from '../logic/core/humanScaleBandResolver';
import { formatOverallResonanceScore } from '../logic/core/scoring';
import type { UnitSystem } from '../logic/core/unitConverters';
import {
  resolveLanguageFromT,
  resolveUiLocale,
  type TelemetryUiLocale,
} from '../i18n/language';
import type { TelemetryAxisSummaryCardInput } from '../lib/telemetryReportTypes';
import type { TelemetryBackgroundSource } from '../lib/telemetryCardCover';
import type { TelemetryCardAspectRatio } from '../lib/telemetryCardTypes';

function resolveCoverageReading(
  t: TFunction,
  axis: AestheticAxisSummaryAxis,
  coveredCount: number,
  uiLocale: TelemetryUiLocale
): string {
  const n = Math.max(0, Math.floor(coveredCount));
  if (uiLocale === 'en') {
    const unitKey =
      axis === 'strength'
        ? 'aesthetic.axisSummary.coverageUnitLifts'
        : 'aesthetic.axisSummary.coverageUnitTests';
    return `${n} ${t(unitKey)}`;
  }
  return t('aesthetic.axisSummary.coverageReadingZh', { count: n });
}

export function buildAestheticAxisSummaryExportInput(
  t: TFunction,
  source: {
    axis: AestheticAxisSummaryAxis;
    heroScore: number;
    coveredCount: number;
    muscleMeasured?: MuscleAxisMeasuredMetrics;
  },
  extras: {
    mode: 'carbon' | 'selfie';
    aspectRatio: TelemetryCardAspectRatio;
    background?: TelemetryBackgroundSource | null;
    brandHeader?: string;
    uiLocale?: TelemetryUiLocale;
    /** Active display system for muscle dual raw (defaults metric). */
    unitSystem?: UnitSystem;
  }
): TelemetryAxisSummaryCardInput {
  const year = new Date().getFullYear();
  const scoreText = formatOverallResonanceScore(source.heroScore);
  const { populationClass } = resolveHumanScaleBandMeta(
    t,
    source.axis,
    source.heroScore
  );
  const uiLocale = resolveUiLocale(resolveLanguageFromT(t), extras.uiLocale);
  const unitSystem = extras.unitSystem ?? 'metric';
  const muscleMeasured =
    source.axis === 'muscleMass' && isValidMuscleAxisMeasured(source.muscleMeasured)
      ? source.muscleMeasured
      : null;
  const verdict =
    extras.mode === 'carbon'
      ? resolveTelemetryVerdictForTarget(
          { reportType: 'axis-summary', axis: source.axis },
          source.heroScore,
          uiLocale
        )
      : undefined;

  return {
    reportType: 'axis-summary',
    mode: extras.mode,
    aspectRatio: extras.aspectRatio,
    axis: source.axis,
    coveredCount: source.coveredCount,
    leafTitleZh: t(`aesthetic.axisSummary.${source.axis}.titleZh`),
    leafTitleEn: t(`aesthetic.axisSummary.${source.axis}.titleEn`),
    uiLocale,
    rawReading: muscleMeasured
      ? formatMuscleAxisMeasuredReading(muscleMeasured, unitSystem, {
          kg: t('units.weight.kg'),
          lb: t('units.weight.lb'),
        })
      : resolveCoverageReading(t, source.axis, source.coveredCount, uiLocale),
    heroScore: source.heroScore,
    heroScoreText: scoreText,
    isOverflow: source.heroScore >= AXIS_SUMMARY_OVERFLOW_HERO,
    // WHY dedicated muscleDualMetricLabel: dual raw is SMM + BW% — not generic RAW METRIC.
    rawMetricLabel: muscleMeasured
      ? t('aesthetic.axisSummary.muscleDualMetricLabel')
      : t('aesthetic.axisSummary.coverageLabel'),
    upRatingLabel: t('aesthetic.singleLeaf.upRatingLabel'),
    tierCapsule: populationClass,
    ...(verdict ? { verdict } : {}),
    year,
    verifiedStamp: t('aesthetic.singleLeaf.verifiedStamp', { year }),
    brandHeader: extras.brandHeader ?? t('aesthetic.labels.brandHeader'),
    background: extras.background ?? null,
  };
}

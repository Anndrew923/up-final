/**
 * Map aesthetic certificate model + six-axis scores into telemetry compose input.
 * WHY: Keeps DOM-free copy resolution out of the modal so share/selfie paths share one payload.
 */
import type { TFunction } from 'i18next';
import {
  resolveAestheticBandCopy,
  resolveAestheticVisualLine,
} from '../logic/aesthetic/aestheticSpecCopy';
import { buildSixAxisRadarData, formatOverallResonanceScore } from '../logic/core/scoring';
import { resolveSixAxisChartLabel } from '../i18n/resolveSixAxisChartLabel';
import type {
  TelemetryCardInput,
  TelemetryMeterLine,
  TelemetrySpecLine,
} from '../lib/telemetryCardComposer';
import type { ScoreMap, SixAxisMetric } from '../types/scoring';
import type { AestheticSpecCardModel } from './useAestheticSpecCard';

const OVERFLOW_SCORE = 100;

function meterLine(
  t: TFunction,
  labelKey: string,
  score: number | null
): TelemetryMeterLine {
  const unmeasuredLabel = t('aesthetic.labels.unmeasured');
  const overflowBadge = t('aesthetic.labels.overflowBadge');
  const overflow = score != null && score >= OVERFLOW_SCORE;
  return {
    label: t(labelKey),
    value: score != null ? formatOverallResonanceScore(score) : unmeasuredLabel,
    fillPct: score == null ? 0 : Math.min(100, Math.max(0, score)),
    badge: overflow ? overflowBadge : null,
  };
}

export function buildAestheticTelemetryExportInput(
  t: TFunction,
  model: AestheticSpecCardModel,
  scores: ScoreMap,
  extras: Pick<TelemetryCardInput, 'mode' | 'background' | 'brandHeader'>
): TelemetryCardInput {
  const unmeasuredLabel = t('aesthetic.labels.unmeasured');
  const { spec, overallScore, battleCode, gender, bodyFatPct } = model;
  const year = new Date().getFullYear();

  const overallTitle = t(`aesthetic.overall.${spec.overallTitleId}`);
  const visualTitle = spec.visual.id
    ? t(`aesthetic.visual.${spec.visual.id}.title`)
    : unmeasuredLabel;
  const visualSubtitle = spec.visual.id
    ? t(`aesthetic.visual.${spec.visual.id}.subtitle`)
    : unmeasuredLabel;
  const forceCopy = resolveAestheticBandCopy(t, 'force', gender, spec.force.id);
  const kineticCopy = resolveAestheticBandCopy(t, 'kinetic', gender, spec.kinetic.id);
  const visualLine = resolveAestheticVisualLine(t, {
    visualSubtitle,
    unmeasured: spec.visual.unmeasured,
    bodyFatMissing: spec.visual.bodyFatMissing,
    bodyFatPct,
  });

  const specs: TelemetrySpecLine[] = [
    {
      kicker: t('aesthetic.labels.visual'),
      title: visualTitle,
      subtitle: visualLine,
    },
    {
      kicker: t('aesthetic.labels.force'),
      title: forceCopy.title,
      subtitle: forceCopy.subtitle,
    },
    {
      kicker: t('aesthetic.labels.kinetic'),
      title: kineticCopy.title,
      subtitle: kineticCopy.subtitle,
    },
  ];

  const meters: TelemetryMeterLine[] = [
    meterLine(t, 'aesthetic.labels.visualMetric', spec.visual.score),
    meterLine(t, 'aesthetic.labels.forceMetric', spec.force.score),
    meterLine(t, 'aesthetic.labels.kineticMetric', spec.kinetic.score),
  ];

  const axes = buildSixAxisRadarData(scores).map((point) => ({
    key: point.key,
    label: resolveSixAxisChartLabel(t, point.key as SixAxisMetric),
    value: point.value,
  }));

  return {
    mode: extras.mode,
    battleCode,
    title: overallTitle,
    overallScore,
    specs,
    meters,
    year,
    verifiedStamp: t('aesthetic.labels.verifiedStamp', { year }),
    axes,
    background: extras.background,
    brandHeader: extras.brandHeader ?? t('aesthetic.labels.brandHeader'),
  };
}

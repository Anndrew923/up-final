/**
 * Map a resolved single-leaf hero report into telemetry compose input.
 * WHY: Parallel to `buildAestheticTelemetryExportInput` without touching that locked file.
 */
import type { TFunction } from 'i18next';
import type { SingleLeafReportResult } from '../logic/aesthetic/singleLeafReport';
import {
  scoreMeaningMetricForSingleLeaf,
  singleLeafEnTitle,
  singleLeafZhTitle,
} from '../logic/aesthetic/singleLeafScoreMeaning';
import { resolveHumanScaleBandMeta } from '../logic/core/humanScaleBandResolver';
import { formatOverallResonanceScore } from '../logic/core/scoring';
import type { TelemetrySingleLeafCardInput } from '../lib/telemetryReportTypes';
import type { TelemetryBackgroundSource } from '../lib/telemetryCardCover';
import type { TelemetryCardAspectRatio } from '../lib/telemetryCardTypes';

function resolveUiLocale(
  language: string | undefined,
  override?: 'zh' | 'en'
): 'zh' | 'en' {
  if (override) return override;
  return (language ?? '').toLowerCase().startsWith('en') ? 'en' : 'zh';
}

export function buildAestheticSingleLeafExportInput(
  t: TFunction,
  leafResult: Extract<SingleLeafReportResult, { status: 'ok' }>,
  extras: {
    mode: 'carbon' | 'selfie';
    aspectRatio: TelemetryCardAspectRatio;
    background?: TelemetryBackgroundSource | null;
    brandHeader?: string;
    /** Optional override; defaults from `t.language` / zh. */
    uiLocale?: 'zh' | 'en';
  }
): TelemetrySingleLeafCardInput {
  const year = new Date().getFullYear();
  const scoreText = formatOverallResonanceScore(leafResult.heroScore);
  const metric = scoreMeaningMetricForSingleLeaf(leafResult.leaf);
  const { populationClass } = resolveHumanScaleBandMeta(t, metric, leafResult.heroScore);
  const tLang =
    typeof (t as { language?: string }).language === 'string'
      ? (t as { language?: string }).language
      : undefined;

  return {
    reportType: 'single-leaf',
    mode: extras.mode,
    aspectRatio: extras.aspectRatio,
    leaf: leafResult.leaf,
    leafTitleZh: singleLeafZhTitle(leafResult.leaf),
    leafTitleEn: singleLeafEnTitle(leafResult.leaf),
    uiLocale: resolveUiLocale(tLang, extras.uiLocale),
    rawReading: leafResult.rawReading,
    heroScore: leafResult.heroScore,
    heroScoreText: scoreText,
    isOverflow: leafResult.isOverflow,
    overflowBadge: t('aesthetic.labels.overflowBadge'),
    rawMetricLabel: t('aesthetic.singleLeaf.rawMetricLabel'),
    upRatingLabel: t('aesthetic.singleLeaf.upRatingLabel'),
    tierCapsule: populationClass,
    verdictPlaceholder: t('aesthetic.singleLeaf.verdictPlaceholder'),
    year,
    verifiedStamp: t('aesthetic.singleLeaf.verifiedStamp', { year }),
    brandHeader: extras.brandHeader ?? t('aesthetic.labels.brandHeader'),
    background: extras.background ?? null,
  };
}

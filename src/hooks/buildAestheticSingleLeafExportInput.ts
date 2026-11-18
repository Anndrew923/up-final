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
import { resolveTelemetryVerdictForTarget } from '../logic/aesthetic/telemetryVerdictCatalog';
import { resolveHumanScaleBandMeta } from '../logic/core/humanScaleBandResolver';
import { formatOverallResonanceScore } from '../logic/core/scoring';
import {
  resolveLanguageFromT,
  resolveUiLocale,
  type TelemetryUiLocale,
} from '../i18n/language';
import type { TelemetrySingleLeafCardInput } from '../lib/telemetryReportTypes';
import type { TelemetryBackgroundSource } from '../lib/telemetryCardCover';
import type { TelemetryCardAspectRatio } from '../lib/telemetryCardTypes';

export function buildAestheticSingleLeafExportInput(
  t: TFunction,
  leafResult: Extract<SingleLeafReportResult, { status: 'ok' }>,
  extras: {
    mode: 'carbon' | 'selfie';
    aspectRatio: TelemetryCardAspectRatio;
    background?: TelemetryBackgroundSource | null;
    brandHeader?: string;
    /** Optional override; defaults from `t.resolvedLanguage ?? t.language`. */
    uiLocale?: TelemetryUiLocale;
  }
): TelemetrySingleLeafCardInput {
  const year = new Date().getFullYear();
  const scoreText = formatOverallResonanceScore(leafResult.heroScore);
  const metric = scoreMeaningMetricForSingleLeaf(leafResult.leaf);
  const { populationClass } = resolveHumanScaleBandMeta(t, metric, leafResult.heroScore);
  const uiLocale = resolveUiLocale(resolveLanguageFromT(t), extras.uiLocale);
  const verdict =
    extras.mode === 'carbon'
      ? resolveTelemetryVerdictForTarget(
          { reportType: 'single-leaf', leaf: leafResult.leaf },
          leafResult.heroScore,
          uiLocale
        )
      : undefined;

  return {
    reportType: 'single-leaf',
    mode: extras.mode,
    aspectRatio: extras.aspectRatio,
    leaf: leafResult.leaf,
    leafTitleZh: singleLeafZhTitle(leafResult.leaf),
    leafTitleEn: singleLeafEnTitle(leafResult.leaf),
    uiLocale,
    rawReading: leafResult.rawReading,
    heroScore: leafResult.heroScore,
    heroScoreText: scoreText,
    isOverflow: leafResult.isOverflow,
    rawMetricLabel: t('aesthetic.singleLeaf.rawMetricLabel'),
    upRatingLabel: t('aesthetic.singleLeaf.upRatingLabel'),
    tierCapsule: populationClass,
    ...(verdict ? { verdict } : {}),
    year,
    verifiedStamp: t('aesthetic.singleLeaf.verifiedStamp', { year }),
    brandHeader: extras.brandHeader ?? t('aesthetic.labels.brandHeader'),
    background: extras.background ?? null,
  };
}

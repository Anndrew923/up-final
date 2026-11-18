/**
 * Discriminated report input for full six-axis vs single-leaf vs axis-summary plates.
 * WHY: Orthogonal to mode (carbon|selfie) and aspect (9:16|4:5) so cache stamps
 * can invalidate on reportType/leaf/axis without touching locked telemetryCardTypes.
 */
import type { AestheticAxisSummaryAxis } from '../logic/aesthetic/axisSummaryReport';
import type { SingleLeafId } from '../logic/aesthetic/singleLeafReport';
import type { TelemetryVerdictCopy } from '../logic/aesthetic/telemetryVerdictCatalog';
import type { TelemetryUiLocale } from '../i18n/language';
import type { TelemetryCardInput } from './telemetryCardComposer';
import type { TelemetryBackgroundSource } from './telemetryCardCover';
import type { TelemetryCardAspectRatio } from './telemetryCardTypes';

export type { TelemetryVerdictCopy, TelemetryUiLocale };

export type TelemetryReportMode = 'carbon' | 'selfie';
export type TelemetryReportAspect = TelemetryCardAspectRatio;

/**
 * Fixed verdict slot height on the logical carbon plate (115–130 stage).
 * WHY: Shared by Canvas rhythm + DOM preview so coach copy never reflows the stamp.
 */
export const SINGLE_LEAF_VERDICT_SLOT_HEIGHT = 125;

/**
 * Shared dual-hero paint fields (Carbon + Selfie).
 * WHY: Axis-summary reuses the single-leaf geometry without polluting SINGLE_LEAF_IDS.
 */
export interface TelemetryDualHeroPlateFields {
  mode: TelemetryReportMode;
  aspectRatio: TelemetryReportAspect;
  /** Language-stable Chinese title (Carbon ZH foil primary; payload retained for EN). */
  leafTitleZh: string;
  /** Language-stable English title (Carbon EN foil primary / ZH secondary texture). */
  leafTitleEn: string;
  /**
   * UI locale for plate copy:
   * - Selfie: single-line hero (zh→leafTitleZh, en→leafTitleEn).
   * - Carbon ZH: foil ZH primary + EN secondary; Carbon EN: EN foil only (no ZH secondary).
   * - Also selects Carbon verdict catalog language.
   */
  uiLocale?: TelemetryUiLocale;
  rawReading: string;
  heroScore: number;
  /** Pre-formatted score (e.g. `70.40`). */
  heroScoreText: string;
  /** Drives gold foil on the tier plaque when heroScore >= 100; never overrides copy. */
  isOverflow: boolean;
  /** Column kicker — left metric. */
  rawMetricLabel: string;
  /** Column kicker — UP rating. */
  upRatingLabel: string;
  /** Decade population class for the tier plaque (incl. 100–150+ titles). */
  tierCapsule: string;
  /**
   * Carbon-only coach verdict (epithet + critique).
   * WHY: Selfie HUD stays data-only — omit / leave undefined when mode === 'selfie'.
   */
  verdict?: TelemetryVerdictCopy;
  brandHeader?: string;
  year?: number;
  verifiedStamp?: string;
  background?: TelemetryBackgroundSource | null;
}

export interface TelemetrySingleLeafCardInput extends TelemetryDualHeroPlateFields {
  reportType: 'single-leaf';
  leaf: SingleLeafId;
}

export interface TelemetryAxisSummaryCardInput extends TelemetryDualHeroPlateFields {
  reportType: 'axis-summary';
  axis: AestheticAxisSummaryAxis;
  coveredCount: number;
}

export type TelemetryDualHeroCardInput =
  | TelemetrySingleLeafCardInput
  | TelemetryAxisSummaryCardInput;

export type TelemetryFullReportInput = TelemetryCardInput & {
  reportType: 'full';
};

export type TelemetryReportInput = TelemetryFullReportInput | TelemetryDualHeroCardInput;

export function isSingleLeafReportInput(
  input: TelemetryReportInput
): input is TelemetrySingleLeafCardInput {
  return input.reportType === 'single-leaf';
}

export function isAxisSummaryReportInput(
  input: TelemetryReportInput
): input is TelemetryAxisSummaryCardInput {
  return input.reportType === 'axis-summary';
}

export function isDualHeroReportInput(
  input: TelemetryReportInput
): input is TelemetryDualHeroCardInput {
  return input.reportType === 'single-leaf' || input.reportType === 'axis-summary';
}

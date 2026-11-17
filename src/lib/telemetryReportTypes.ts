/**
 * Discriminated report input for full six-axis vs single-leaf share plates.
 * WHY: Orthogonal to mode (carbon|selfie) and aspect (9:16|4:5) so cache stamps
 * can invalidate on reportType/leaf without touching locked telemetryCardTypes.
 */
import type { SingleLeafId } from '../logic/aesthetic/singleLeafReport';
import type { TelemetryCardInput } from './telemetryCardComposer';
import type { TelemetryBackgroundSource } from './telemetryCardCover';
import type { TelemetryCardAspectRatio } from './telemetryCardTypes';

export type TelemetryReportMode = 'carbon' | 'selfie';
export type TelemetryReportAspect = TelemetryCardAspectRatio;

/** Fixed verdict slot height on the logical plate — P2 copy must fit without reflow. */
export const SINGLE_LEAF_VERDICT_SLOT_HEIGHT = 92;

export interface TelemetrySingleLeafCardInput {
  reportType: 'single-leaf';
  mode: TelemetryReportMode;
  aspectRatio: TelemetryReportAspect;
  leaf: SingleLeafId;
  /** Language-stable Chinese primary title (e.g. 去脂指數) — not UI-locale dependent. */
  leafTitleZh: string;
  /** Language-stable formal English secondary title (e.g. FAT-FREE MASS INDEX). */
  leafTitleEn: string;
  rawReading: string;
  heroScore: number;
  /** Pre-formatted undiluted hero score (e.g. `80.31`). */
  heroScoreText: string;
  isOverflow: boolean;
  overflowBadge: string;
  /** Column kicker — 實測數據 / RAW METRIC. */
  rawMetricLabel: string;
  /** Column kicker — 戰力評分 / UP RATING. */
  upRatingLabel: string;
  /** Decade population class capsule; ignored when `isOverflow` (use overflowBadge). */
  tierCapsule: string;
  /** P1 placeholder inside the fixed verdict slot. */
  verdictPlaceholder: string;
  brandHeader?: string;
  year?: number;
  verifiedStamp?: string;
  background?: TelemetryBackgroundSource | null;
}

export type TelemetryFullReportInput = TelemetryCardInput & {
  reportType: 'full';
};

export type TelemetryReportInput = TelemetryFullReportInput | TelemetrySingleLeafCardInput;

export function isSingleLeafReportInput(
  input: TelemetryReportInput
): input is TelemetrySingleLeafCardInput {
  return input.reportType === 'single-leaf';
}

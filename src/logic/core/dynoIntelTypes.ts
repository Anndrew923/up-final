import type { RoutePath } from '../../config/routes';
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import type { PhysicalProfile } from '../../types/userProfile';
import type { RadarMergedScoresInput } from './radarMergedScores';
import type { VehicleClassId } from './vehicleResolver';

/** De-identified age bucket — never ship exact age to the AI pipeline. */
export type DynoAgeBucket =
  | '10-12'
  | '13-17'
  | '18-30'
  | '31-40'
  | '41-50'
  | '51-60'
  | '61-70'
  | '71-80'
  | 'unknown';

export type DynoIntelMode = 'single-axis' | 'cross-axis' | 'weight-simulation';

/** Minimal history slice — keeps logic/core free of storage service imports. */
export interface DynoHistoryRecordSlice {
  createdAt: string;
  scores: ScoreMap;
  overallScore: number;
}

export interface DynoAxisGap {
  axis: SixAxisMetric;
  assessmentRoute: RoutePath;
}

/** Resolved scoreMeaning band copy — official card title/summary for progressive disclosure. */
export interface DynoAxisCardCopy {
  title: string;
  summary: string;
}

/** Supplemental telemetry outside the six-axis radar constitution. */
export type DynoSupplementalMetricId = 'armSize' | 'cooper' | '5km';

export interface DynoSupplementalMetricSnapshot {
  metric: DynoSupplementalMetricId;
  score: number;
  tierBandId: string;
  meaningI18nPrefix: string;
  /** Optional enriched copy from scoreMeaning i18n — set client-side before Callable. */
  cardCopy?: DynoAxisCardCopy | null;
}

/** Official App scoring methodology slice — sourced from assessment page i18n. */
export type DynoScoringMethodologyMetricId = SixAxisMetric | DynoSupplementalMetricId;

export interface DynoScoringMethodologyBrief {
  metric: DynoScoringMethodologyMetricId;
  title: string;
  body: string;
}

export interface DynoAxisSnapshot {
  axis: SixAxisMetric;
  score: number | null;
  tierBandId: string | null;
  meaningI18nPrefix: string | null;
  weightInvariant: boolean;
  /** Optional enriched copy from scoreMeaning i18n — set client-side before Callable. */
  cardCopy?: DynoAxisCardCopy | null;
}

export interface DynoAxisDelta {
  axis: SixAxisMetric;
  previous: number | null;
  current: number | null;
  delta: number | null;
}

export interface DynoWeightSimulation {
  enabled: boolean;
  currentWeightKg: number;
  targetWeightKg: number;
  assumption: 'strength-only-dots-recalc';
  strength: {
    currentScore: number | null;
    simulatedScore: number | null;
    delta: number | null;
  };
}

export interface DynoIntelContextV1 {
  schemaVersion: 1;
  locale: 'zh-Hant' | 'en';
  mode: DynoIntelMode;
  focusAxis: SixAxisMetric | null;
  /** Bridges UI surface names (e.g. FFMI) to axes[].telemetry keys for the model. */
  focusAxisLexicon?: {
    axis: SixAxisMetric;
    telemetryKey: SixAxisMetric;
    surfaceLabel: string;
  } | null;
  overallScore: number | null;
  axes: DynoAxisSnapshot[];
  gaps: DynoAxisGap[];
  momentum: {
    hasHistory: boolean;
    deltas: DynoAxisDelta[];
    overallDelta: number | null;
  };
  weightSimulation: DynoWeightSimulation | null;
  profile: {
    gender: PhysicalProfile['gender'];
    ageBucket: DynoAgeBucket;
    heightCm: number;
    weightKg: number;
  } | null;
  vehicleClassId: VehicleClassId | null;
  /** Pre-computed hint for off-topic redirect and model grounding. */
  weakestAxis: SixAxisMetric | null;
  /** Arm-size + cardio sub-test telemetry — does not alter six-axis radar math. */
  supplementalMetrics: DynoSupplementalMetricSnapshot[];
  /** Page focus for supplemental decode (armSize page, Cooper tab, 5km tab). */
  focusSupplemental: DynoSupplementalMetricId | null;
  /** Product scoring methodology — client resolves from assessment i18n before Callable. */
  scoringMethodologyBriefs: DynoScoringMethodologyBrief[];
  /** Locale-resolved nudge — invite users to assessment pages for fuller copy. */
  assessmentDeepDiveNudge: string;
  /** Beat-3 data-anchored emotional closing — selected client-side from telemetry. */
  replyClosingCue: string;
  generatedAt: string;
}

export interface BuildDynoIntelContextInput {
  radarInput: RadarMergedScoresInput;
  historyRecords: readonly DynoHistoryRecordSlice[];
  locale: 'zh-Hant' | 'en';
  mode: DynoIntelMode;
  focusAxis?: SixAxisMetric | null;
  focusSupplemental?: DynoSupplementalMetricId | null;
  targetWeightKg?: number;
  now?: Date;
}

/** Gemini structured output contract — mirrored server-side for validation. */
export interface DynoIntelChatResponseV1 {
  commentary: string;
  action_directive: string;
  is_off_topic: boolean;
  detected_weakest_axis: SixAxisMetric | string;
}

export interface DynoIntelChatRequestV1 {
  context: DynoIntelContextV1;
  promptTemplateId: string;
  userQuestion: string;
  mode: DynoIntelMode;
}

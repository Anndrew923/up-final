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

export interface DynoAxisSnapshot {
  axis: SixAxisMetric;
  score: number | null;
  tierBandId: string | null;
  meaningI18nPrefix: string | null;
  weightInvariant: boolean;
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
  generatedAt: string;
}

export interface BuildDynoIntelContextInput {
  radarInput: RadarMergedScoresInput;
  historyRecords: readonly DynoHistoryRecordSlice[];
  locale: 'zh-Hant' | 'en';
  mode: DynoIntelMode;
  focusAxis?: SixAxisMetric | null;
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

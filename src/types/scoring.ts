/**
 * Score storage uses partial maps; **armSize** is optional storage only.
 * **Core six radar + overall** use `SIX_AXIS_METRICS` + linear `calculateSixAxisOverall` (see `logic/core/scoring.ts`).
 */
export type ScoreMetric =
  | 'strength'
  | 'explosivePower'
  | 'cardio'
  | 'muscleMass'
  | 'bodyFat'
  | 'armSize'
  | 'gripStrength';

/** Fixed order for radar vertices and overall — excludes `armSize` (stored but not assessed here). */
export const SIX_AXIS_METRICS = [
  'strength',
  'explosivePower',
  'cardio',
  'muscleMass',
  'bodyFat',
  'gripStrength',
] as const;

export type SixAxisMetric = (typeof SIX_AXIS_METRICS)[number];

export const SIX_AXIS_COUNT = SIX_AXIS_METRICS.length;

export type ScoreMap = Partial<Record<ScoreMetric, number>>;

export interface RadarPoint {
  key: ScoreMetric;
  label: string;
  value: number;
}

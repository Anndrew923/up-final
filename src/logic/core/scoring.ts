/**
 * Ultimate Physique - Core Scoring Engine
 *
 * WHY:
 * - Unifies strength scoring, Nen-inspired ability scaling, and radar normalization in one pure module.
 * - Keeps mathematics framework-agnostic so UI layers can render the same truth on web and future iOS clients.
 *
 * POTENTIAL IMPACT:
 * - Stable, deterministic formulas reduce ranking drift across releases.
 * - Radar normalization preserves progression above 100 without visual saturation.
 */
import type { ScoreMap, RadarPoint as CoreRadarPoint, ScoreMetric } from '../../types/scoring';
import { SIX_AXIS_COUNT, SIX_AXIS_METRICS } from '../../types/scoring';

export const ANCHOR_DOTS = {
  Deadlift: 150,
  Squat: 140,
  'Bench Press': 90,
  'Lat Pulldown': 88,
  'Overhead Press': 60,
  'Pull-ups': 88,
} as const;

export type ExerciseType = keyof typeof ANCHOR_DOTS;
export type Gender = 'male' | 'female';

export interface StrengthScoreInput {
  exerciseType: ExerciseType;
  weight: number;
  reps: number;
  bodyWeight: number;
  gender: Gender | '男性' | '女性';
  age: number;
}

export interface StrengthScoreBreakdown {
  oneRepMax: number;
  rawDots: number;
  ageCoefficient: number;
  correctedDots: number;
  anchorDots: number;
  finalScore: number;
}

export interface StrengthRadarPointInput {
  key: string;
  score: number;
}

/** Legacy strength radar pipeline output (normalized chart slice). Distinct from `types/scoring` six-axis `RadarPoint`. */
export interface StrengthRadarDatum {
  key: string;
  rawScore: number;
  normalized: number;
}

export interface NenScoresInput {
  strength: number;
  explosivePower: number;
  cardio: number;
  muscleMass: number;
  bodyFat: number;
}

export type NenType =
  | 'enhancer'
  | 'emitter'
  | 'manipulator'
  | 'conjurer'
  | 'transmuter'
  | 'specialist';

export interface NenProfile {
  type: NenType;
  affinityScore: number;
  confidence: number;
  explanation: string;
}

export interface LevelBand {
  min: number;
  key: 'novice' | 'guardian' | 'vanguard' | 'knight' | 'sovereign';
  label: string;
}

export const LEVEL_BANDS: ReadonlyArray<LevelBand> = [
  { min: 100, key: 'sovereign', label: '主權級' },
  { min: 80, key: 'knight', label: '騎士級' },
  { min: 60, key: 'vanguard', label: '先鋒級' },
  { min: 40, key: 'guardian', label: '守護級' },
  { min: 0, key: 'novice', label: '新手' },
];

const DOTS_COEFFICIENTS: Record<Gender, { A: number; B: number; C: number; D: number; E: number }> =
  {
    male: {
      A: -0.000001093,
      B: 0.0007391293,
      C: -0.191875104,
      D: 24.0900756,
      E: -307.75076,
    },
    female: {
      A: -0.0000010706,
      B: 0.0005158568,
      C: -0.1126655495,
      D: 13.6175032,
      E: -57.96288,
    },
  };

const NEN_AXIS_ORDER = ['strength', 'explosivePower', 'cardio', 'muscleMass'] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function normalizeGender(input: StrengthScoreInput['gender']): Gender {
  return input === 'female' || input === '女性' ? 'female' : 'male';
}

export function calculateOneRepMax(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) {
    throw new Error('Weight and reps must be positive finite numbers.');
  }

  if (reps === 1) return weight;

  // WHY: Brzycki is stable for submaximal sets and was shared by both reference stacks.
  // POTENTIAL IMPACT: Keeps comparability with historical score distributions.
  const cappedReps = clamp(reps, 1, 15);
  return weight * (36 / (37 - cappedReps));
}

export function getMcCullochCoefficient(age: number): number {
  if (!Number.isFinite(age) || age <= 0) return 1;
  if (age < 14) return 1.23;
  if (age <= 23) return 1.23 - ((age - 14) / 9) * 0.23;
  if (age <= 40) return 1.0;
  if (age <= 44) return 1.045;
  if (age <= 49) return 1.11;
  if (age <= 54) return 1.15;
  if (age <= 59) return 1.2;
  if (age <= 64) return 1.25;
  if (age <= 69) return 1.3;
  if (age <= 74) return 1.35;
  if (age <= 79) return 1.4;
  return 1.45;
}

export function calculateDots(bodyWeight: number, liftedWeight: number, gender: Gender): number {
  if (
    !Number.isFinite(bodyWeight) ||
    !Number.isFinite(liftedWeight) ||
    bodyWeight <= 0 ||
    liftedWeight <= 0
  ) {
    throw new Error('Bodyweight and lifted weight must be positive finite numbers.');
  }

  const coeff = DOTS_COEFFICIENTS[gender];
  const bw = bodyWeight;
  const denominator =
    coeff.A * bw ** 4 + coeff.B * bw ** 3 + coeff.C * bw ** 2 + coeff.D * bw + coeff.E;

  if (denominator <= 0) {
    throw new Error('Invalid DOTS denominator.');
  }

  return (liftedWeight * 500) / denominator;
}

export function calculateStrengthScore(input: StrengthScoreInput): StrengthScoreBreakdown {
  const { exerciseType, weight, reps, bodyWeight, age } = input;
  const gender = normalizeGender(input.gender);

  if (!ANCHOR_DOTS_HAS(exerciseType)) {
    throw new Error(`Unknown exercise type: ${exerciseType}`);
  }

  const liftWeight = exerciseType === 'Pull-ups' ? bodyWeight + weight : weight;
  const oneRepMax = calculateOneRepMax(liftWeight, reps);
  const rawDots = calculateDots(bodyWeight, oneRepMax, gender);
  const ageCoefficient = getMcCullochCoefficient(age);
  const correctedDots = rawDots * ageCoefficient;
  const anchorDots = ANCHOR_DOTS[exerciseType];
  const finalScore = (correctedDots / anchorDots) * 100;

  return {
    oneRepMax: round2(oneRepMax),
    rawDots: round2(rawDots),
    ageCoefficient: round2(ageCoefficient),
    correctedDots: round2(correctedDots),
    anchorDots,
    finalScore: round2(finalScore),
  };
}

function ANCHOR_DOTS_HAS(value: string): value is ExerciseType {
  return Object.prototype.hasOwnProperty.call(ANCHOR_DOTS, value);
}

/**
 * WHY:
 * - Radar should keep "readability first" for 0-100 while still differentiating elite scores >100.
 * - Simple capping (Math.min(score, 100)) hides high-end progression and weakens competitive UX.
 *
 * POTENTIAL IMPACT:
 * - Better visual stratification for advanced users without exploding chart scale.
 */
export function normalizeRadarValue(
  score: number,
  options?: { baseCap?: number; softCap?: number; chartCeiling?: number }
): number {
  const baseCap = options?.baseCap ?? 100;
  const softCap = options?.softCap ?? 180;
  const chartCeiling = options?.chartCeiling ?? 130;
  const safeScore = Math.max(0, Number(score) || 0);

  if (safeScore <= baseCap) {
    return round2(safeScore);
  }

  const capped = Math.min(safeScore, softCap);
  const growthRatio = (capped - baseCap) / (softCap - baseCap);
  const compressed =
    baseCap + (Math.log1p(growthRatio * 4) / Math.log1p(4)) * (chartCeiling - baseCap);
  return round2(clamp(compressed, 0, chartCeiling));
}

export function buildRadarDataset(
  points: ReadonlyArray<StrengthRadarPointInput>
): StrengthRadarDatum[] {
  return points.map((point) => ({
    key: point.key,
    rawScore: round2(Math.max(0, point.score)),
    normalized: normalizeRadarValue(point.score),
  }));
}

/**
 * Nen-inspired ability scaling.
 *
 * WHY:
 * - Keeps the reference apps' fantasy flavor, but removes subscription/VIP hardcoding.
 * - Uses performance distribution (dominance + balance) instead of one-off if/else privileges.
 *
 * POTENTIAL IMPACT:
 * - Fairer archetype assignment and more stable personalization as user data grows.
 */
export function calculateNenProfile(scores: NenScoresInput): NenProfile {
  const axes = {
    strength: Math.max(0, scores.strength),
    explosivePower: Math.max(0, scores.explosivePower),
    cardio: Math.max(0, scores.cardio),
    muscleMass: Math.max(0, scores.muscleMass),
  };

  const axisValues = NEN_AXIS_ORDER.map((k) => axes[k]);
  const axisMean = mean(axisValues);
  const axisStdDev = standardDeviation(axisValues);
  const sorted = [...axisValues].sort((a, b) => b - a);
  const top = sorted[0] ?? 0;
  const second = sorted[1] ?? 0;

  const dominance = top === 0 ? 0 : clamp((top - second) / top, 0, 1);
  const balance = 1 - clamp(axisStdDev / 40, 0, 1);
  const normalizedAverage = clamp(axisMean / 100, 0, 1.5);

  const dominantAxisIndex = axisValues.indexOf(top);
  const dominantAxis = NEN_AXIS_ORDER[Math.max(0, dominantAxisIndex)] ?? 'strength';
  const baseTypeMap: Record<(typeof NEN_AXIS_ORDER)[number], NenType> = {
    strength: 'enhancer',
    explosivePower: 'emitter',
    cardio: 'manipulator',
    muscleMass: 'conjurer',
  };

  const isTransmuter = scores.bodyFat > 0 && scores.bodyFat < 12 && axes.muscleMass >= axisMean;
  const isSpecialist = balance >= 0.8 && normalizedAverage >= 0.72;

  let type: NenType;
  let explanation: string;

  if (isTransmuter) {
    type = 'transmuter';
    explanation =
      'Low body-fat with above-average muscle expression indicates transmuter-like adaptability.';
  } else if (isSpecialist) {
    type = 'specialist';
    explanation =
      'High balance and high overall output indicate specialist-level multi-axis integration.';
  } else {
    type = baseTypeMap[dominantAxis];
    explanation = `Primary dominance in ${dominantAxis} indicates ${type} alignment.`;
  }

  const affinityScore = round2(clamp(normalizedAverage * 70 + dominance * 30, 0, 100));
  const confidence = round2(clamp((isSpecialist ? balance : dominance) * 100, 0, 100));

  return {
    type,
    affinityScore,
    confidence,
    explanation,
  };
}

export function getLevelFromScore(score: number): LevelBand {
  const safe = Number(score) || 0;
  return LEVEL_BANDS.find((band) => safe >= band.min) ?? LEVEL_BANDS[LEVEL_BANDS.length - 1];
}

/**
 * Core six dimensions (linear): strength, explosive, cardio, muscle, body-fat, grip.
 * `armSize` may be stored but is excluded from radar and from this overall.
 *
 * Overall = sum(clamped raw_i) / 6; missing key ⇒ 0. No gamma / no artificial ceiling on the formula.
 */

/** Default chart radius scale — extends automatically if any axis > 100 (limit-break style). */
export const RADAR_DISPLAY_MIN = 100;

export function normalizeScore(value: number, min = 0, max = 100): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  if (max <= min) return min;
  const clamped = Math.min(max, Math.max(min, numeric));
  return round2(clamped);
}

/** Every `ScoreMap` entry is stored as raw 0–100 (including `armSize`). */
export function clampScoreMapValue(value: number): number {
  return normalizeScore(value, 0, 100);
}

/** Raw input clamp for forms (same as persisted map values). */
export function clampSixAxisRawInput(raw: number): number {
  return clampScoreMapValue(raw);
}

/** Linear mean of six core dimensions (each slot defaults to 0). */
export function calculateSixAxisOverall(scores: ScoreMap): number {
  const sum = SIX_AXIS_METRICS.reduce(
    (acc, metric) => acc + clampScoreMapValue(scores[metric] ?? 0),
    0
  );
  return round2(sum / SIX_AXIS_COUNT);
}

/** Radar uses the same clamped raw values as the overall (no separate transform). */
export function buildSixAxisRadarData(scores: ScoreMap): CoreRadarPoint[] {
  return SIX_AXIS_METRICS.map((metric) => ({
    key: metric as ScoreMetric,
    label: metric,
    value: clampScoreMapValue(scores[metric] ?? 0),
  }));
}

/** Count of core axes with a value > 0 (for completion UI). */
export function countCoreSixFilled(scores: ScoreMap): number {
  return SIX_AXIS_METRICS.filter((m) => clampScoreMapValue(scores[m] ?? 0) > 0).length;
}

/** Upper bound for radar spoke scaling: at least 100, expands if any axis exceeds 100. */
export function radarDisplayScaleMax(points: ReadonlyArray<{ value: number }>): number {
  let max = RADAR_DISPLAY_MIN;
  for (const p of points) {
    const v = Number(p.value) || 0;
    if (v > max) max = v;
  }
  return Math.max(max, 1e-6);
}

export function calculateOverallScore(scores: ScoreMap): number {
  return calculateSixAxisOverall(scores);
}

/**
 * Training tools core formulas.
 *
 * WHY:
 * - Keep calculator math deterministic and UI-agnostic.
 * - Reuse in pages, hooks, and future tests without coupling to React.
 */

export type OneRmMethod = 'average' | 'epley' | 'brzycki' | 'lombardi';
export type TrainingUnit = 'kg' | 'lb';

export interface PlatePick {
  plateKg: number;
  count: number;
}

export interface PlatePlan {
  ok: boolean;
  perSideKg: number;
  picks: PlatePick[];
  leftoverKg: number;
}

const DEFAULT_PLATE_SET_KG: readonly number[] = [25, 20, 15, 10, 5, 2.5, 1.25];
const KG_TO_LB = 2.2046226218;

export const BARBELL_WEIGHT_PRESETS_KG = {
  olympic20: 20,
  womens15: 15,
  technique10: 10,
} as const;

export const BARBELL_WEIGHT_PRESETS_LB = {
  olympic45: 45,
  technique35: 35,
} as const;

export const PLATE_SET_PRESETS_KG = {
  commercial: [25, 20, 15, 10, 5, 2.5, 1.25],
  competition: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25],
  homeBasic: [20, 15, 10, 5, 2.5, 1.25],
} as const;

export const PLATE_SET_PRESETS_LB = {
  commercial: [45, 35, 25, 10, 5, 2.5],
  competition: [55, 45, 35, 25, 10, 5, 2.5, 1.25],
  homeBasic: [45, 25, 10, 5, 2.5],
} as const;

function sanitizePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function sanitizeNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateOneRmEpley(weightKg: number, reps: number): number {
  const weight = sanitizePositive(weightKg);
  const repCount = sanitizePositive(reps);
  if (weight === 0 || repCount === 0) return 0;
  if (repCount === 1) return weight;
  return weight * (1 + repCount / 30);
}

export function calculateOneRmBrzycki(weightKg: number, reps: number): number {
  const weight = sanitizePositive(weightKg);
  const repCount = sanitizePositive(reps);
  if (weight === 0 || repCount === 0) return 0;
  if (repCount === 1) return weight;
  if (repCount >= 37) return weight;
  return weight * (36 / (37 - repCount));
}

export function calculateOneRmLombardi(weightKg: number, reps: number): number {
  const weight = sanitizePositive(weightKg);
  const repCount = sanitizePositive(reps);
  if (weight === 0 || repCount === 0) return 0;
  if (repCount === 1) return weight;
  return weight * Math.pow(repCount, 0.1);
}

export function calculateOneRm(
  weightKg: number,
  reps: number,
  method: OneRmMethod = 'average'
): number {
  if (method === 'epley') return calculateOneRmEpley(weightKg, reps);
  if (method === 'brzycki') return calculateOneRmBrzycki(weightKg, reps);
  if (method === 'lombardi') return calculateOneRmLombardi(weightKg, reps);

  const epley = calculateOneRmEpley(weightKg, reps);
  const brzycki = calculateOneRmBrzycki(weightKg, reps);
  const lombardi = calculateOneRmLombardi(weightKg, reps);
  if (epley === 0 && brzycki === 0 && lombardi === 0) return 0;
  return (epley + brzycki + lombardi) / 3;
}

export function planBarbellPlates(
  targetTotalKg: number,
  barWeightKg: number,
  plateSetKg: readonly number[] = DEFAULT_PLATE_SET_KG
): PlatePlan {
  const target = sanitizePositive(targetTotalKg);
  const bar = sanitizeNonNegative(barWeightKg);
  const remainder = target - bar;

  if (target === 0 || remainder <= 0) {
    return { ok: false, perSideKg: 0, picks: [], leftoverKg: 0 };
  }

  const perSideKg = remainder / 2;
  if (perSideKg <= 0) {
    return { ok: false, perSideKg: 0, picks: [], leftoverKg: 0 };
  }

  const normalizedPlateSet = [...plateSetKg]
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => b - a);

  let remaining = perSideKg;
  const picks: PlatePick[] = [];
  for (const plateKg of normalizedPlateSet) {
    const count = Math.floor((remaining + 1e-9) / plateKg);
    if (count <= 0) continue;
    picks.push({ plateKg, count });
    remaining -= plateKg * count;
  }

  const leftoverKg = round2(remaining);
  return {
    ok: leftoverKg === 0,
    perSideKg: round2(perSideKg),
    picks,
    leftoverKg,
  };
}

export function convertKgToLb(valueKg: number): number {
  return sanitizeNonNegative(valueKg) * KG_TO_LB;
}

export function convertLbToKg(valueLb: number): number {
  return sanitizeNonNegative(valueLb) / KG_TO_LB;
}

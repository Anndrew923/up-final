/**
 * WHY: Single source for shard→radar axis mapping and preview radar completeness so
 * services/UI do not drift (cost guardrail: one preview doc read per ladder tap).
 */
import type { LeaderboardShardId } from './ladderShards';
import { clampScoreMapValue } from './scoring';
import type { ScoreMap } from '../../types/scoring';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';

export const LEADERBOARD_PREVIEW_SCHEMA_VERSION = 1 as const;

/**
 * Maps a ladder shard id to the six-axis preview bucket.
 * null = specialty-only / branch shard — must not write `radarScores.*` (Plan B: `cardio_5km`,
 * `explosive_sprint`, arm size, per-lift strength, etc.).
 */
export function resolvePreviewRadarMetric(metric: LeaderboardShardId): SixAxisMetric | null {
  switch (metric) {
    case 'strength_totalFive':
      return 'strength';
    case 'cardio':
      return 'cardio';
    case 'explosive_composite':
      return 'explosivePower';
    case 'muscleMass':
      return 'muscleMass';
    case 'bodyFat_ffmi':
      return 'bodyFat';
    case 'gripStrength':
      return 'gripStrength';
    default:
      return null;
  }
}

/** Axes with a positive stored preview value (0 = treated as absent in ladder UI). */
export function countPreviewRadarAxesFilled(radar: Partial<Record<SixAxisMetric, number>>): number {
  return SIX_AXIS_METRICS.filter((m) => {
    const v = radar[m];
    return typeof v === 'number' && Number.isFinite(v) && v > 0;
  }).length;
}

export function isPreviewRadarComplete(radar: Partial<Record<SixAxisMetric, number>>): boolean {
  return countPreviewRadarAxesFilled(radar) >= SIX_AXIS_METRICS.length;
}

/**
 * Build stored radar map from merged local scores (same clamp as Home radar).
 * Only keys with value > 0 (memory / optimistic paths).
 */
export function buildPositivePreviewRadarFromMergedScores(
  merged: ScoreMap
): Partial<Record<SixAxisMetric, number>> {
  const out: Partial<Record<SixAxisMetric, number>> = {};
  for (const m of SIX_AXIS_METRICS) {
    const v = clampScoreMapValue(merged[m] ?? 0);
    if (v > 0) out[m] = v;
  }
  return out;
}

/**
 * Full six-axis map for `leaderboard_previews.radarScores` (Firestore nested map).
 * WHY: `setDoc` merge must use `{ radarScores: { strength: n, ... } }` — flat keys like
 * `"radarScores.strength"` become literal root field names and break `mapPreview` reads.
 */
export function buildFullRadarScoresMapForFirestore(
  merged: ScoreMap
): Record<SixAxisMetric, number> {
  const out = {} as Record<SixAxisMetric, number>;
  for (const m of SIX_AXIS_METRICS) {
    out[m] = clampScoreMapValue(merged[m] ?? 0);
  }
  return out;
}

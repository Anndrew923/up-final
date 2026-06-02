import { SCORE_AXIS_MAX, SIX_AXIS_METRICS } from "../shared/constants.js";

/** Mirror `clampScoreMapValue` / `buildFullRadarScoresMap` in client `scoring.ts`. */
function clampAxis(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(SCORE_AXIS_MAX, value));
}

/** Linear mean of six core axes — same contract as client `calculateSixAxisOverall`. */
export function calculateSixAxisOverallFromMerged(mergedScores) {
  let sum = 0;
  for (const m of SIX_AXIS_METRICS) {
    sum += clampAxis(Number(mergedScores?.[m] ?? 0));
  }
  return Math.round((sum / SIX_AXIS_METRICS.length) * 100) / 100;
}

/**
 * Ensures `ladderScore` is written whenever a batch carries full merged scores for preview.
 * WHY: Defense-in-depth if an older client omits overall from scoped assessment targets.
 */
export function coupleBatchTargetsWithOverall(targets, mergedScores) {
  if (!Array.isArray(targets) || !mergedScores || typeof mergedScores !== "object") {
    return targets;
  }
  const overall = calculateSixAxisOverallFromMerged(mergedScores);
  if (overall <= 0) return targets;

  const map = new Map();
  for (const t of targets) {
    const metric = t?.metric;
    const score = Number(t?.score);
    if (typeof metric !== "string" || !Number.isFinite(score)) continue;
    map.set(metric, score);
  }
  map.set("ladderScore", overall);
  return Array.from(map.entries()).map(([metric, score]) => ({ metric, score }));
}

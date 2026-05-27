import { SIX_AXIS_METRICS } from "../shared/constants.js";

/** Mirror `resolvePreviewRadarMetric` in client `leaderboardPreviewContract.ts`. */
export function resolvePreviewRadarMetric(metric) {
  switch (metric) {
    case "strength_totalFive":
      return "strength";
    case "cardio":
    case "cardio_5km":
      return "cardio";
    case "explosive_composite":
      return "explosivePower";
    case "muscleMass":
      return "muscleMass";
    case "bodyFat_ffmi":
      return "bodyFat";
    case "gripStrength":
      return "gripStrength";
    default:
      return null;
  }
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function buildFullRadarScoresMap(mergedScores) {
  const out = {};
  for (const m of SIX_AXIS_METRICS) {
    const v = clampScore(Number(mergedScores?.[m] ?? 0));
    out[m] = v;
  }
  return out;
}

export function ladderPreviewProfileFields(profile) {
  if (!profile || typeof profile !== "object") return {};
  const allowed = [
    "gender",
    "ageBucket",
    "jobCategory",
    "countryCode",
    "city",
    "district",
    "weeklyTrainingHours",
    "trainingYears",
    "isAnonymousInLadder",
    "age",
    "heightCm",
    "weightKg",
    "heightBucket",
    "weightBucket",
    "region",
    "regionScope",
  ];
  const out = {};
  for (const key of allowed) {
    if (key in profile) out[key] = profile[key];
  }
  return out;
}

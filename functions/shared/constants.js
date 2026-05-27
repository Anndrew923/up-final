/**
 * Ladder quotas — keep in sync with `src/logic/core/ladderUploadPolicy.ts`.
 */
export const LEADERBOARD_UPLOADS_PER_HOUR = 3;
export const FULL_SYNC_COOLDOWN_MS = 90 * 60 * 1000;
export const FULL_SYNC_MAX_PER_DAY = 3;
export const ONE_HOUR_MS = 60 * 60 * 1000;

export const LEADERBOARDS_COLLECTION = "leaderboards";
export const ENTRIES_SUBCOLLECTION = "entries";
export const LEADERBOARD_PREVIEWS_COLLECTION = "leaderboard_previews";
export const LADDER_RATE_LIMITS_COLLECTION = "ladder_rate_limits";
export const LEADERBOARD_PREVIEW_SCHEMA_VERSION = 1;

/** Mirror `KNOWN_LEADERBOARD_SHARD_IDS` in `src/logic/core/ladderShards.ts`. */
export const KNOWN_LEADERBOARD_SHARD_IDS = new Set([
  "ladderScore",
  "totalLoginDays",
  "strength",
  "strength_totalFive",
  "strength_squat",
  "strength_bench",
  "strength_deadlift",
  "strength_ohp",
  "strength_latPull",
  "cardio",
  "cardio_5km",
  "explosivePower",
  "explosive_composite",
  "explosive_vertical",
  "explosive_broad",
  "explosive_sprint",
  "bodyFat",
  "bodyFat_ffmi",
  "muscleMass",
  "muscleMass_weightKg",
  "muscleMass_ratio",
  "gripStrength",
  "armSize",
]);

export const SIX_AXIS_METRICS = [
  "strength",
  "explosivePower",
  "cardio",
  "muscleMass",
  "bodyFat",
  "gripStrength",
];

export const CALLABLE_OPTS = {
  region: process.env.FUNCTIONS_REGION || "us-central1",
  memory: "512MiB",
  timeoutSeconds: 120,
};

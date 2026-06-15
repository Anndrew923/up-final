/**
 * Ladder quotas — keep in sync with `src/logic/core/ladderUploadPolicy.ts`.
 */
export const LEADERBOARD_UPLOADS_PER_HOUR = 3;
export const FULL_SYNC_COOLDOWN_MS = 90 * 60 * 1000;
export const FULL_SYNC_MAX_PER_DAY = 3;
export const ONE_HOUR_MS = 60 * 60 * 1000;

/** Rolling window for ladder report quota — mirror `REPORT_DEDUPE_MS` in reportUserCore.js */
export const LADDER_REPORT_ROLLING_MS = 24 * 60 * 60 * 1000;
export const LADDER_REPORTS_ROLLING_MAX = 10;

export const LEADERBOARDS_COLLECTION = "leaderboards";
export const ENTRIES_SUBCOLLECTION = "entries";
export const LEADERBOARD_PREVIEWS_COLLECTION = "leaderboard_previews";
export const LADDER_RATE_LIMITS_COLLECTION = "ladder_rate_limits";
export const LEADERBOARD_PREVIEW_SCHEMA_VERSION = 1;

/** Mirror `SCORE_AXIS_MAX` in `src/logic/core/scoring.ts` — preview radar clamp ceiling. */
export const SCORE_AXIS_MAX = 200;

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

/** DYNO INTEL — keep in sync with product quotas. */
export const DYNO_INTEL_TRIAL_PER_DAY = 2;
export const DYNO_INTEL_PRO_PER_DAY = 30;
export const DYNO_INTEL_RATE_LIMITS_COLLECTION = "dyno_intel_rate_limits";
export const DYNO_INTEL_CACHE_COLLECTION = "dyno_intel_cache";
export const DYNO_INTEL_CACHE_TTL_MS = 48 * 60 * 60 * 1000;
export const DYNO_INTEL_CONTEXT_SCHEMA_VERSION = 1;
/** Lite engine — default for status/progress/general telemetry reads. */
export const DYNO_INTEL_GEMINI_MODEL_LITE =
  process.env.GEMINI_MODEL_LITE_ID || "gemini-2.5-flash-lite";
/** Quality engine — methodology / scoring-standard questions only. */
export const DYNO_INTEL_GEMINI_MODEL_METHODOLOGY =
  process.env.GEMINI_MODEL_METHODOLOGY_ID || "gemini-2.5-flash";
/** Back-compat alias — points at lite default. */
export const DYNO_INTEL_GEMINI_MODEL = DYNO_INTEL_GEMINI_MODEL_LITE;
/** Explicit Context Cache TTL — Google default is 1h; refresh before expiry. */
export const DYNO_INTEL_GEMINI_CONTEXT_CACHE_TTL_SECONDS = 3600;
export const DYNO_INTEL_GEMINI_CONTEXT_CACHE_REFRESH_BUFFER_MS = 10 * 60 * 1000;
/** Cap structured JSON commentary length — three-beat constitution fits well under 1536. */
export const DYNO_INTEL_GEMINI_MAX_OUTPUT_TOKENS = 1536;

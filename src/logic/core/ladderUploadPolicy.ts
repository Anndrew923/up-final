/**
 * Ladder upload quotas (product + cost guardrails).
 * P1: enforced client-side (UX pacing, not a security boundary).
 * P2: mirror these limits in Callable + Firestore `ladder_rate_limits/{uid}`.
 */
export const LEADERBOARD_UPLOADS_PER_HOUR = 3;

/** Minimum gap between successful full sync-all runs. */
export const FULL_SYNC_COOLDOWN_MS = 90 * 60 * 1000;

/** Max successful full sync-all runs per local calendar day. */
export const FULL_SYNC_MAX_PER_DAY = 3;

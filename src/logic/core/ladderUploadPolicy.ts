/**
 * Ladder upload quotas (product + cost guardrails).
 * P1: enforced client-side in `rateLimitService` (UX pacing, not a security boundary).
 * P2: mirror these limits in Callable + Firestore `ladder_rate_limits/{uid}`.
 */
export const LEADERBOARD_UPLOADS_PER_HOUR = 3;

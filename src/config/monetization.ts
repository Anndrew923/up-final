/**
 * Central feature flags for monetization rollouts.
 *
 * WHY (genesis open access): Ladder read/upload is free while early-bird seats remain.
 * **Authoritative seat enforcement is server-only** (`functions/shared/genesisEarlyBird.js`
 * + `assertLadderUploadAllowed`). This client constant is UI copy / milestones only —
 * tampering it cannot create free seats after the server cap.
 *
 * Manual full cutover (optional, after seats fill or ops decides) still keeps these aligned:
 * 1) this flag → true
 * 2) Functions `LEADERBOARD_PAYWALL_ENABLED=true` (see `functions/.env.<projectId>`)
 * 3) Firestore leaderboard read rules → re-add `hasValidPro`
 * 4) Storage `ladder-avatars` rules → re-wrap write/read with `hasValidPro`
 *
 * Dyno Intel / cloud sync stay Pro-gated via entitlement — independent of this flag.
 */
export const MONETIZATION_CONFIG = {
  leaderboardPaywallEnabled: false,
  leaderboardRequireGoogleSignIn: true,
  /**
   * UI / marketing seat target. Server hard-cap defaults to the same value via
   * `GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT` (optional Functions env override).
   */
  genesisEarlyBirdSeatLimit: 2000,
  leaderboardPromotionMilestones: [1, 3, 10, 100, 500, 1000, 2000] as const,
} as const;

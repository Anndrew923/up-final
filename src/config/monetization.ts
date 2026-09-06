/**
 * Central feature flags for monetization rollouts.
 *
 * WHY (genesis open access): Ladder read/upload is free while early-bird seats remain.
 * **Authoritative seat enforcement is server-only** (`functions/shared/genesisEarlyBird.js`
 * + `assertLadderUploadAllowed`). This client constant is UI copy / milestones only —
 * tampering it cannot create free seats after the server cap.
 *
 * FOMO display reads `public_meta/genesisSeats` (staged summary) — never private
 * `meta/genesisEarlyBird.claimedCount`.
 *
 * Manual full cutover (optional, after seats fill or ops decides) still keeps these aligned:
 * 1) this flag → true
 * 2) Functions `LEADERBOARD_PAYWALL_ENABLED=true` (see `functions/.env.<projectId>`)
 * 3) Firestore leaderboard read rules → re-add `hasValidPro` **or** allow genesis pioneers
 * 4) Storage `ladder-avatars` rules → re-wrap write/read with `hasValidPro` (or genesis)
 * Existing `genesis_early_bird_seats` / `users.isGenesisEarlyBird` holders must keep ladder access.
 *
 * Dyno Intel / cloud sync stay Pro-gated via entitlement — independent of this flag.
 * Genesis seats (`isGenesisEarlyBird` on `users/{uid}`) grandfather ladder after cutover.
 */
export const MONETIZATION_CONFIG = {
  leaderboardPaywallEnabled: false,
  leaderboardRequireGoogleSignIn: true,
  /**
   * UI / marketing seat target. Server hard-cap defaults to the same value via
   * `GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT` (optional Functions env override).
   * Keep aligned with Functions `LEADERBOARD_PAYWALL_ENABLED=false` until seats fill
   * (see `functions/.env.<projectId>`).
   */
  genesisEarlyBirdSeatLimit: 2000,
  leaderboardPromotionMilestones: [1, 3, 10, 100, 500, 1000, 2000] as const,
} as const;

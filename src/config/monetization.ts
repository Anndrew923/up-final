/**
 * Central feature flags for monetization rollouts.
 *
 * WHY (genesis open access): Ladder read/upload is free while the arena grows toward
 * `genesisEarlyBirdSeatLimit`. Keep these three surfaces in lockstep when cutting over:
 * 1) this flag → true
 * 2) Functions `LEADERBOARD_PAYWALL_ENABLED=true` (see `functions/.env.<projectId>`)
 * 3) Firestore leaderboard read rules → re-add `hasValidPro`
 *
 * Cutover MUST ship a grandfather path before promising "permanent" free seats —
 * seat limit today is ops messaging only (not an enforced counter).
 * Dyno Intel / cloud sync stay Pro-gated via entitlement — independent of this flag.
 */
export const MONETIZATION_CONFIG = {
  leaderboardPaywallEnabled: false,
  leaderboardRequireGoogleSignIn: true,
  /** Ops target for open-access messaging / milestones — not an enforced seat counter yet. */
  genesisEarlyBirdSeatLimit: 2000,
  leaderboardPromotionMilestones: [1, 3, 10, 100, 500, 1000, 2000] as const,
} as const;

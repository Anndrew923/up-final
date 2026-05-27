/**
 * Central feature flags for monetization rollouts.
 * Phase 1 (RC + entitlement): keep `leaderboardPaywallEnabled` false for flow validation.
 * Phase 2: set true + enable Functions `LEADERBOARD_PAYWALL_ENABLED` for server/client parity.
 */
export const MONETIZATION_CONFIG = {
  leaderboardPaywallEnabled: false,
  leaderboardRequireGoogleSignIn: true,
  leaderboardPromotionMilestones: [1, 3, 10, 100, 500, 1000] as const,
} as const;

/**
 * Central feature flags for monetization rollouts.
 * Production must never depend on a deploy-time flag to protect paid Firebase traffic.
 * Development remains open so emulator flows can be exercised without billing fixtures.
 */
export const MONETIZATION_CONFIG = {
  leaderboardPaywallEnabled: import.meta.env.PROD,
  leaderboardRequireGoogleSignIn: true,
  leaderboardPromotionMilestones: [1, 3, 10, 100, 500, 1000] as const,
} as const;

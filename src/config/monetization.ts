/**
 * Central feature flags for monetization rollouts.
 * Keep leaderboard paywall off during migration, then switch to true when billing is ready.
 */
export const MONETIZATION_CONFIG = {
  leaderboardPaywallEnabled: false,
  leaderboardRequireGoogleSignIn: true,
  leaderboardPromotionMilestones: [1, 3, 10, 100, 500, 1000] as const,
} as const;

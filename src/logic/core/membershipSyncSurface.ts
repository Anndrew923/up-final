/**
 * Club membership surface for sync CTAs (intent-driven).
 * WHY: Console / Breakthrough show dual capsules when in a club; never a sticky preference.
 */

export type MembershipSyncSurface = 'pending' | 'dual' | 'global-only';

/**
 * `hasGuild === null` while binding loads — avoid flashing dual CTAs.
 */
export function resolveMembershipSyncSurface(
  hasGuild: boolean | null
): MembershipSyncSurface {
  if (hasGuild === null) return 'pending';
  if (hasGuild) return 'dual';
  return 'global-only';
}

/** Pipeline success banner after breakthrough cloud CTA. */
export type BreakthroughCloudOutcome = 'arena' | 'guild';

export function resolvePublishSuccessBannerKey(
  outcome: BreakthroughCloudOutcome
):
  | 'assessment.breakthrough.dashboardAndArenaSuccess'
  | 'assessment.breakthrough.dashboardAndGuildSuccess' {
  if (outcome === 'guild') {
    return 'assessment.breakthrough.dashboardAndGuildSuccess';
  }
  return 'assessment.breakthrough.dashboardAndArenaSuccess';
}

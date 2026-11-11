/**
 * Club membership surface for sync CTAs (intent-driven).
 * WHY: Console / Breakthrough show dual capsules when in a club; never a sticky preference.
 */

import type {
  BreakthroughArenaPipelineBanner,
  BreakthroughCloudOutcome,
} from './breakthroughArenaPipeline';

export type MembershipSyncSurface = 'pending' | 'dual' | 'global-only';

/** Re-export SSOT cloud outcome (banner key mapping lives beside membership copy). */
export type { BreakthroughCloudOutcome };

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

/** Success-banner outcomes that map to emerald publish copy (not dashboard-only / null). */
export type BreakthroughPublishSuccessOutcome = Exclude<
  BreakthroughCloudOutcome,
  null | 'dashboard-only'
>;

export type BreakthroughPublishCopyKey =
  | 'assessment.breakthrough.dashboardAndArenaSuccess'
  | 'assessment.breakthrough.dashboardAndGuildSuccess'
  | 'assessment.breakthrough.dashboardAndArenaGuildSuccess'
  | 'assessment.breakthrough.dashboardPersistedOnly';

export function resolvePublishSuccessBannerKey(
  outcome: BreakthroughPublishSuccessOutcome
): Exclude<BreakthroughPublishCopyKey, 'assessment.breakthrough.dashboardPersistedOnly'> {
  if (outcome === 'arena+guild') {
    return 'assessment.breakthrough.dashboardAndArenaGuildSuccess';
  }
  if (outcome === 'guild') {
    return 'assessment.breakthrough.dashboardAndGuildSuccess';
  }
  return 'assessment.breakthrough.dashboardAndArenaSuccess';
}

/**
 * Single map from pipeline banner → i18n key (keeps modal presentational).
 */
export function resolveBreakthroughPipelineCopyKey(
  banner: BreakthroughArenaPipelineBanner
): BreakthroughPublishCopyKey | null {
  if (banner === 'none') return null;
  if (banner === 'arena-guild-success') return resolvePublishSuccessBannerKey('arena+guild');
  if (banner === 'full-success') return resolvePublishSuccessBannerKey('arena');
  if (banner === 'guild-success') return resolvePublishSuccessBannerKey('guild');
  return 'assessment.breakthrough.dashboardPersistedOnly';
}

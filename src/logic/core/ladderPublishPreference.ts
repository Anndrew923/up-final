/**
 * Global vs crew-only ladder publish preference (client UX contract).
 * WHY: Separates "anonymous on public board" from "do not write public shards at all".
 */

export type LadderPublishPreference = 'global' | 'guild-only' | 'local-only' | 'pending';

export type LadderPublishCtaCopyKey =
  | 'assessment.breakthrough.syncDashboardThenArena'
  | 'assessment.breakthrough.syncDashboardThenArenaGuildOnly'
  | 'assessment.breakthrough.syncDashboardThenArenaLocalOnly';

export type LadderPublishBusyCopyKey =
  | 'assessment.breakthrough.syncDashboardThenArenaBusy'
  | 'assessment.breakthrough.syncDashboardThenArenaGuildOnlyBusy'
  | 'assessment.breakthrough.syncDashboardThenArenaLocalOnlyBusy';

export type LadderPublishHintCopyKey =
  | 'assessment.breakthrough.publishGlobalHint'
  | 'assessment.breakthrough.publishGuildOnlyHint'
  | 'assessment.breakthrough.publishLocalOnlyHint'
  | 'assessment.breakthrough.publishPendingHint';

/**
 * Resolve secondary breakthrough CTA mode from sticky checkbox + guild membership.
 * `hasGuild === null` while binding is still loading — avoid flashing local-only.
 */
export function resolvePublishMode(
  wantsGlobal: boolean,
  hasGuild: boolean | null
): LadderPublishPreference {
  if (wantsGlobal) return 'global';
  if (hasGuild === null) return 'pending';
  if (hasGuild) return 'guild-only';
  return 'local-only';
}

export function resolvePublishCtaCopyKey(
  mode: LadderPublishPreference
): LadderPublishCtaCopyKey {
  if (mode === 'guild-only') {
    return 'assessment.breakthrough.syncDashboardThenArenaGuildOnly';
  }
  if (mode === 'local-only') {
    return 'assessment.breakthrough.syncDashboardThenArenaLocalOnly';
  }
  // pending: keep global CTA label while disabled — avoids flashing "local only".
  return 'assessment.breakthrough.syncDashboardThenArena';
}

export function resolvePublishBusyCopyKey(
  mode: LadderPublishPreference
): LadderPublishBusyCopyKey {
  if (mode === 'guild-only') {
    return 'assessment.breakthrough.syncDashboardThenArenaGuildOnlyBusy';
  }
  if (mode === 'local-only' || mode === 'pending') {
    return 'assessment.breakthrough.syncDashboardThenArenaLocalOnlyBusy';
  }
  return 'assessment.breakthrough.syncDashboardThenArenaBusy';
}

export function resolvePublishHintCopyKey(
  mode: LadderPublishPreference
): LadderPublishHintCopyKey {
  if (mode === 'guild-only') {
    return 'assessment.breakthrough.publishGuildOnlyHint';
  }
  if (mode === 'local-only') {
    return 'assessment.breakthrough.publishLocalOnlyHint';
  }
  if (mode === 'pending') {
    return 'assessment.breakthrough.publishPendingHint';
  }
  return 'assessment.breakthrough.publishGlobalHint';
}

/** Pipeline success banner after secondary CTA (dashboard + optional cloud). */
export function resolvePublishSuccessBannerKey(
  mode: Exclude<LadderPublishPreference, 'pending'>
):
  | 'assessment.breakthrough.dashboardAndArenaSuccess'
  | 'assessment.breakthrough.dashboardAndGuildSuccess'
  | 'assessment.breakthrough.dashboardLocalOnlySuccess' {
  if (mode === 'guild-only') {
    return 'assessment.breakthrough.dashboardAndGuildSuccess';
  }
  if (mode === 'local-only') {
    return 'assessment.breakthrough.dashboardLocalOnlySuccess';
  }
  return 'assessment.breakthrough.dashboardAndArenaSuccess';
}

import {
  hasHighValueLadderTags,
  resolveLadderTagsLocalCloudDecision,
  type LadderTagsLocalCloudDecision,
} from '../logic/core/ladderTags';
import {
  buildLadderTagsRehydrateAttempts,
  type LadderTagsCloudSnapshot,
} from '../logic/core/ladderTagsCloudSync';
import { validatePhysicalProfile } from '../logic/core/physicalProfile';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';
import { loadPhysicalProfile, savePhysicalProfile } from './localStorageService';
import type { PhysicalProfile } from '../types/userProfile';

/**
 * Entry prompt dismiss — first ladder visit soft sheet.
 * WHY: Skip / save must permanently stop entry nags — optional tags must never become a paywall.
 */
const LADDER_TAGS_PROMPT_DISMISSED_KEY = 'up.ladder.tagsPrompt.dismissed.v1';

/**
 * Filter-context nudge dismiss — independent from entry Skip (strategy B).
 * WHY: Skipping the entry announcement must not silence the higher-intent「更多篩選」moment.
 */
const LADDER_FILTER_TAGS_NUDGE_DISMISSED_KEY = 'up.ladder.filterTagsNudge.dismissed.v1';

function localHighValueTagsInput(profile: PhysicalProfile | null) {
  if (!profile) return null;
  return {
    jobCategory: profile.jobCategory ?? '',
    countryCode: profile.countryCode ?? '',
  };
}

function cloudHighValueTagsInput(cloud: LadderTagsCloudSnapshot) {
  if (!cloud) return null;
  return {
    jobCategory: cloud.jobCategory ?? '',
    countryCode: cloud.countryCode ?? '',
  };
}

function resolveDecision(
  local: PhysicalProfile | null,
  cloud: LadderTagsCloudSnapshot,
  dismissed: boolean
): LadderTagsLocalCloudDecision {
  return resolveLadderTagsLocalCloudDecision(
    localHighValueTagsInput(local),
    cloudHighValueTagsInput(cloud),
    dismissed
  );
}

function writeRehydratedLocalProfile(
  local: PhysicalProfile,
  cloud: Exclude<LadderTagsCloudSnapshot, null>
): boolean {
  for (const attempt of buildLadderTagsRehydrateAttempts(local, cloud)) {
    const validated = validatePhysicalProfile(attempt);
    if (!validated.ok) continue;
    // WHY: Invalid enum strings normalize to empty — do not clobber updatedAt with a no-op write.
    if (!hasHighValueLadderTags(validated.profile)) continue;
    savePhysicalProfile(validated.profile);
    return true;
  }
  return false;
}

export function hasDismissedLadderTagsPrompt(): boolean {
  return safeGetItem(LADDER_TAGS_PROMPT_DISMISSED_KEY) === '1';
}

export function dismissLadderTagsPrompt(): void {
  safeSetItem(LADDER_TAGS_PROMPT_DISMISSED_KEY, '1');
}

/**
 * True when first ladder entry may offer the soft tags sheet.
 * Pass settled cloud snapshot (`null` = no myEntry) — never omit after a successful myEntry fetch.
 */
export function shouldShowLadderTagsPrompt(cloud: LadderTagsCloudSnapshot): boolean {
  return resolveDecision(loadPhysicalProfile(), cloud, hasDismissedLadderTagsPrompt()) === 'prompt';
}

export function hasDismissedFilterTagNudge(): boolean {
  return safeGetItem(LADDER_FILTER_TAGS_NUDGE_DISMISSED_KEY) === '1';
}

export function dismissFilterTagNudge(): void {
  safeSetItem(LADDER_FILTER_TAGS_NUDGE_DISMISSED_KEY, '1');
}

/**
 * True when「更多篩選」may offer the soft tags sheet (strategy B — independent dismiss).
 */
export function shouldShowLadderFilterTagsNudge(cloud: LadderTagsCloudSnapshot): boolean {
  return resolveDecision(loadPhysicalProfile(), cloud, hasDismissedFilterTagNudge()) === 'prompt';
}

/**
 * Silently copy Job/Country (+ TW locality when valid) from cloud myEntry into local profile.
 * WHY: Device switch / cleared storage must restore tags without showing the「未填寫」sheet.
 * Returns true when a write succeeded with at least one high-value tag persisted.
 */
export function maybeRehydrateLocalLadderTagsFromCloud(cloud: LadderTagsCloudSnapshot): boolean {
  const local = loadPhysicalProfile();
  // WHY: Dismiss must not block rehydrate — only suppresses the soft prompt.
  if (resolveDecision(local, cloud, false) !== 'rehydrate' || !local || !cloud) return false;
  return writeRehydratedLocalProfile(local, cloud);
}

/** One-shot outcome for arena entry / filter open after myEntry has settled. */
export type LadderTagsCloudSettleResult = 'prompt' | 'rehydrated' | 'none';

/**
 * Rehydrate-or-prompt gate in a single pass (one local profile read).
 * Call only when `myEntryReady` is true so `cloud=null` means「雲端確實無列」.
 */
export function settleLadderTagsWithCloud(
  cloud: LadderTagsCloudSnapshot,
  options: { dismissed: boolean }
): LadderTagsCloudSettleResult {
  const local = loadPhysicalProfile();
  const decision = resolveDecision(local, cloud, options.dismissed);
  if (decision === 'prompt') return 'prompt';
  if (decision === 'rehydrate' && local && cloud) {
    return writeRehydratedLocalProfile(local, cloud) ? 'rehydrated' : 'none';
  }
  return 'none';
}

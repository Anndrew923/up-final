import { shouldPromptForLadderTags } from '../logic/core/ladderTags';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';
import { loadPhysicalProfile } from './localStorageService';

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

function profileMissingHighValueTags(): boolean {
  const profile = loadPhysicalProfile();
  if (!profile) return false;
  return shouldPromptForLadderTags(
    { jobCategory: profile.jobCategory ?? '', countryCode: profile.countryCode ?? '' },
    false
  );
}

export function hasDismissedLadderTagsPrompt(): boolean {
  return safeGetItem(LADDER_TAGS_PROMPT_DISMISSED_KEY) === '1';
}

export function dismissLadderTagsPrompt(): void {
  safeSetItem(LADDER_TAGS_PROMPT_DISMISSED_KEY, '1');
}

/** True when first ladder entry may offer the soft tags sheet. */
export function shouldShowLadderTagsPrompt(): boolean {
  if (hasDismissedLadderTagsPrompt()) return false;
  return profileMissingHighValueTags();
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
export function shouldShowLadderFilterTagsNudge(): boolean {
  if (hasDismissedFilterTagNudge()) return false;
  return profileMissingHighValueTags();
}

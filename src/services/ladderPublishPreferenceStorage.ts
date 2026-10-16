/**
 * Sticky "publish to global ladder" checkbox preference.
 * WHY: Breakthrough + Settings + Sync All share one LocalStorage key so privacy choice survives remounts.
 */
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

export const LADDER_PUBLISH_WANTS_GLOBAL_KEY = 'up:ladder-publish:wants-global:v1';

/** Dispatched after preference write so mounted hooks re-read without remount. */
export const LADDER_PUBLISH_PREFERENCE_CHANGED_EVENT =
  'up-final-ladder-publish-preference-changed';

/** Default ON — preserves historical behavior for existing users. */
export function loadWantsGlobalLadderPublish(): boolean {
  const raw = safeGetItem(LADDER_PUBLISH_WANTS_GLOBAL_KEY);
  if (raw == null) return true;
  if (raw === '0' || raw === 'false') return false;
  if (raw === '1' || raw === 'true') return true;
  return true;
}

export function saveWantsGlobalLadderPublish(wantsGlobal: boolean): void {
  safeSetItem(LADDER_PUBLISH_WANTS_GLOBAL_KEY, wantsGlobal ? '1' : '0');
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(LADDER_PUBLISH_PREFERENCE_CHANGED_EVENT, {
      detail: { wantsGlobal },
    })
  );
}

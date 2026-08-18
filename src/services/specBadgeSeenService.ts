/**
 * Local-only seen-set for spec-badge nav chrome.
 * WHY: Must stay off the footprint blob — Pro backup/restore would otherwise sync "already viewed" across devices.
 */
import { safeGetItem, safeRemoveItem, safeSetItem } from '../lib/safeLocalStorage';
import { hasUnseenBadges, resolveSeenIdsForFirstLaunch } from '../logic/core/specBadgeSeen';
import { parseUnlockedBadgeIds } from '../logic/core/trainingFootprint';

export const SPEC_BADGE_SEEN_STORAGE_KEY = 'up.specBadgeSeen';
export const LOCAL_SPEC_BADGE_SEEN_CHANGED_EVENT = 'up-final-spec-badge-seen-changed';

const SEEN_SCHEMA_VERSION = 1;

interface SpecBadgeSeenStoreV1 {
  schemaVersion: typeof SEEN_SCHEMA_VERSION;
  seenBadgeIds: string[];
}

function notifySeenObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_SPEC_BADGE_SEEN_CHANGED_EVENT));
}

function isSameIdList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function parseSeenStore(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return parseUnlockedBadgeIds(raw);
  if (typeof raw !== 'object') return null;
  const row = raw as SpecBadgeSeenStoreV1;
  if (row.schemaVersion !== SEEN_SCHEMA_VERSION) return null;
  return parseUnlockedBadgeIds(row.seenBadgeIds);
}

/** `null` means first launch — no seen record yet. */
export function loadSeenBadgeIds(): string[] | null {
  const raw = safeGetItem(SPEC_BADGE_SEEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return parseSeenStore(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function markBadgesAsSeen(ids: readonly string[]): void {
  const stored = loadSeenBadgeIds();
  const merged = parseUnlockedBadgeIds([...(stored ?? []), ...ids]);
  if (stored !== null && isSameIdList(stored, merged)) return;
  const payload: SpecBadgeSeenStoreV1 = {
    schemaVersion: SEEN_SCHEMA_VERSION,
    seenBadgeIds: merged,
  };
  if (!safeSetItem(SPEC_BADGE_SEEN_STORAGE_KEY, JSON.stringify(payload))) return;
  notifySeenObservers();
}

/**
 * Pure grandfather resolution for callers that want to initialize later in an effect.
 */
export function resolveGrandfatheredSeen(unlockedIds: readonly string[]): string[] {
  const stored = loadSeenBadgeIds();
  return parseUnlockedBadgeIds(resolveSeenIdsForFirstLaunch(stored, unlockedIds));
}

export function hasUnseenSpecBadges(unlockedIds: readonly string[]): boolean {
  const stored = loadSeenBadgeIds();
  if (stored === null) return false;
  const seen = parseUnlockedBadgeIds(stored);
  return hasUnseenBadges(unlockedIds, seen);
}

export function clearSpecBadgeSeen(): void {
  safeRemoveItem(SPEC_BADGE_SEEN_STORAGE_KEY);
  notifySeenObservers();
}

export function subscribeSpecBadgeSeen(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onCustom = () => onChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === SPEC_BADGE_SEEN_STORAGE_KEY) onChange();
  };
  window.addEventListener(LOCAL_SPEC_BADGE_SEEN_CHANGED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(LOCAL_SPEC_BADGE_SEEN_CHANGED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

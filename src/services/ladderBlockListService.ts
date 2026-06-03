import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

export const LADDER_BLOCKED_UIDS_STORAGE_KEY = 'up.ladder.blocked_uids.v1';

function parseBlockedUids(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export function loadBlockedUids(): string[] {
  return parseBlockedUids(safeGetItem(LADDER_BLOCKED_UIDS_STORAGE_KEY));
}

export function saveBlockedUids(uids: string[]): void {
  const unique = [...new Set(uids.filter((id) => typeof id === 'string' && id.length > 0))];
  safeSetItem(LADDER_BLOCKED_UIDS_STORAGE_KEY, JSON.stringify(unique));
}

export function addBlockedUid(uid: string, current: string[]): string[] {
  if (!uid) return current;
  if (current.includes(uid)) return current;
  const next = [...current, uid];
  saveBlockedUids(next);
  return next;
}

export function removeBlockedUid(uid: string, current: string[]): string[] {
  const next = current.filter((id) => id !== uid);
  saveBlockedUids(next);
  return next;
}

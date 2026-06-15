import { listStorageKeys, safeGetItem, safeRemoveItem, safeSetItem } from '../lib/safeLocalStorage';
import type { DynoClosingBeatKind } from '../logic/core/dynoIntelTypes';
import type { DynoIntelLogEntry } from '../logic/core/dynoIntelLogTypes';

export const DYNO_INTEL_LOG_STORAGE_KEY_PREFIX = 'up.dynoIntelLogs';

function storageKeyForUid(uid: string): string {
  return `${DYNO_INTEL_LOG_STORAGE_KEY_PREFIX}:${uid}`;
}

function safeParseLogs(raw: string | null): DynoIntelLogEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidLogEntry);
  } catch {
    return [];
  }
}

function isValidLogEntry(value: unknown): value is DynoIntelLogEntry {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<DynoIntelLogEntry>;
  return (
    typeof row.id === 'string' &&
    typeof row.uid === 'string' &&
    typeof row.timestamp === 'number' &&
    typeof row.focusAxis === 'string' &&
    typeof row.userQuestion === 'string' &&
    typeof row.commentary === 'string' &&
    typeof row.closingBeatKind === 'string' &&
    isValidClosingBeatKind(row.closingBeatKind)
  );
}

const CLOSING_BEAT_KINDS = new Set<DynoClosingBeatKind>([
  'methodology-nudge',
  'passion-close',
  'return-ritual',
]);

function isValidClosingBeatKind(value: string): value is DynoClosingBeatKind {
  return CLOSING_BEAT_KINDS.has(value as DynoClosingBeatKind);
}

export function loadDynoIntelLogs(uid: string): DynoIntelLogEntry[] {
  if (!uid) return [];
  return safeParseLogs(safeGetItem(storageKeyForUid(uid)));
}

export function saveDynoIntelLogs(uid: string, entries: DynoIntelLogEntry[]): void {
  if (!uid) return;
  safeSetItem(storageKeyForUid(uid), JSON.stringify(entries));
}

/** Removes all per-uid dyno intel log shards — used on account/local wipe. */
export function clearAllDynoIntelLogs(): void {
  listStorageKeys()
    .filter((key) => key.startsWith(`${DYNO_INTEL_LOG_STORAGE_KEY_PREFIX}:`))
    .forEach((key) => safeRemoveItem(key));
}

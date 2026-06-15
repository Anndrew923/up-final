import { create } from 'zustand';
import { buildDynoIntelLogId } from '../logic/core/buildDynoIntelLogId';
import {
  appendDynoIntelLogEntry,
  sortDynoIntelLogsNewestFirst,
} from '../logic/core/dynoIntelLogLimits';
import type { DynoIntelLogEntry } from '../logic/core/dynoIntelLogTypes';
import { hasProAccess } from '../logic/core/entitlement';
import {
  loadDynoIntelLogs,
  saveDynoIntelLogs,
} from '../services/dynoIntelLogPersistence';
import { scheduleDynoIntelLogCloudSync } from '../services/dynoIntelLogCloudSync';
import { readEntitlementSnapshot } from './entitlementSelectors';

export interface DynoIntelLogStore {
  entries: DynoIntelLogEntry[];
  boundUid: string | null;
  hydrated: boolean;
  bindSession(uid: string | null): void;
  loadLocalLogs(): void;
  appendLog(
    input: Omit<DynoIntelLogEntry, 'id' | 'timestamp'> & { timestamp?: number }
  ): void;
  getMostRecent(): DynoIntelLogEntry | null;
  clearLocalLogs(): void;
}

function resolveSessionUid(
  boundUid: string | null,
  inputUid: string
): string | null {
  if (!inputUid) return null;
  if (!boundUid) return inputUid;
  if (boundUid !== inputUid) return null;
  return boundUid;
}

function ensureUniqueTimestamp(
  uid: string,
  entries: readonly DynoIntelLogEntry[],
  requested: number
): number {
  let timestamp = requested;
  while (entries.some((row) => row.id === buildDynoIntelLogId(uid, timestamp))) {
    timestamp += 1;
  }
  return timestamp;
}

export const useDynoIntelLogStore = create<DynoIntelLogStore>((set, get) => ({
  entries: [],
  boundUid: null,
  hydrated: false,

  bindSession(uid) {
    if (uid === get().boundUid) return;
    if (!uid) {
      set({ boundUid: null, entries: [], hydrated: true });
      return;
    }
    set({ boundUid: uid, entries: [], hydrated: false });
    get().loadLocalLogs();
  },

  loadLocalLogs() {
    const uid = get().boundUid;
    if (!uid) {
      set({ entries: [], hydrated: true });
      return;
    }
    const entries = sortDynoIntelLogsNewestFirst(
      loadDynoIntelLogs(uid).filter((row) => row.uid === uid)
    );
    set({ entries, hydrated: true });
  },

  appendLog(input) {
    const sessionUid = resolveSessionUid(get().boundUid, input.uid);
    if (!sessionUid) return;

    let entries = get().entries;
    if (!get().boundUid) {
      entries = sortDynoIntelLogsNewestFirst(
        loadDynoIntelLogs(sessionUid).filter((row) => row.uid === sessionUid)
      );
      set({ boundUid: sessionUid, entries });
    }

    const timestamp = ensureUniqueTimestamp(
      sessionUid,
      entries,
      input.timestamp ?? Date.now()
    );
    const entry: DynoIntelLogEntry = {
      ...input,
      uid: sessionUid,
      id: buildDynoIntelLogId(sessionUid, timestamp),
      timestamp,
    };

    const ent = readEntitlementSnapshot();
    const isPro = hasProAccess(ent);
    const next = appendDynoIntelLogEntry(entries, entry, isPro);
    saveDynoIntelLogs(sessionUid, next);
    set({ entries: next, hydrated: true });
    scheduleDynoIntelLogCloudSync(ent, entry);
  },

  getMostRecent() {
    const sorted = sortDynoIntelLogsNewestFirst(get().entries);
    return sorted[0] ?? null;
  },

  clearLocalLogs() {
    const uid = get().boundUid;
    if (uid) saveDynoIntelLogs(uid, []);
    set({ entries: [], hydrated: true });
  },
}));

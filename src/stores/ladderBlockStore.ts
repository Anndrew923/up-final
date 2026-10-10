import { create } from 'zustand';
import {
  blockedEntriesToUidSet,
  filterBlockedLeaderboardRows,
  isUidBlocked,
  type LadderBlockedEntry,
} from '../logic/core/ladderBlockList';
import type { LeaderboardEntry } from '../services/leaderboardCacheService';
import {
  addBlockedEntry,
  loadBlockedEntries,
  removeBlockedEntry,
} from '../services/ladderBlockListService';

export interface LadderBlockStore {
  blockedEntries: LadderBlockedEntry[];
  blockedSet: ReadonlySet<string>;
  hydrated: boolean;
  hydrate(): void;
  block(uid: string, displayName?: string): void;
  unblock(uid: string): void;
  isBlocked(uid: string | null | undefined): boolean;
  filterRows<T extends Pick<LeaderboardEntry, 'uid'>>(rows: T[]): T[];
}

function snapshot(entries: LadderBlockedEntry[]) {
  return {
    blockedEntries: entries,
    blockedSet: blockedEntriesToUidSet(entries),
  };
}

export const useLadderBlockStore = create<LadderBlockStore>((set, get) => ({
  blockedEntries: [],
  blockedSet: new Set(),
  hydrated: false,
  hydrate() {
    if (get().hydrated) return;
    set({ ...snapshot(loadBlockedEntries()), hydrated: true });
  },
  block(uid: string, displayName = '') {
    const next = addBlockedEntry({ uid, displayName }, get().blockedEntries);
    set(snapshot(next));
  },
  unblock(uid: string) {
    const next = removeBlockedEntry(uid, get().blockedEntries);
    set(snapshot(next));
  },
  isBlocked(uid) {
    return isUidBlocked(get().blockedSet, uid);
  },
  filterRows(rows) {
    return filterBlockedLeaderboardRows(rows, get().blockedSet);
  },
}));

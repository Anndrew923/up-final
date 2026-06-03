import { create } from 'zustand';
import { filterBlockedLeaderboardRows, isUidBlocked } from '../logic/core/ladderBlockList';
import type { LeaderboardEntry } from '../services/leaderboardCacheService';
import {
  addBlockedUid,
  loadBlockedUids,
  removeBlockedUid,
} from '../services/ladderBlockListService';

export interface LadderBlockStore {
  blockedUids: string[];
  blockedSet: ReadonlySet<string>;
  hydrated: boolean;
  hydrate(): void;
  block(uid: string): void;
  unblock(uid: string): void;
  isBlocked(uid: string | null | undefined): boolean;
  filterRows<T extends Pick<LeaderboardEntry, 'uid'>>(rows: T[]): T[];
}

function toSet(uids: string[]): ReadonlySet<string> {
  return new Set(uids);
}

export const useLadderBlockStore = create<LadderBlockStore>((set, get) => ({
  blockedUids: [],
  blockedSet: new Set(),
  hydrated: false,
  hydrate() {
    if (get().hydrated) return;
    const blockedUids = loadBlockedUids();
    set({ blockedUids, blockedSet: toSet(blockedUids), hydrated: true });
  },
  block(uid: string) {
    const next = addBlockedUid(uid, get().blockedUids);
    set({ blockedUids: next, blockedSet: toSet(next) });
  },
  unblock(uid: string) {
    const next = removeBlockedUid(uid, get().blockedUids);
    set({ blockedUids: next, blockedSet: toSet(next) });
  },
  isBlocked(uid) {
    return isUidBlocked(get().blockedSet, uid);
  },
  filterRows(rows) {
    return filterBlockedLeaderboardRows(rows, get().blockedSet);
  },
}));

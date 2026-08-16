import { create } from 'zustand';
import {
  appendHistory,
  loadHistory,
  loadScores,
  saveHistory,
  type LocalHistoryRecord,
} from '../services/localStorageService';
import { scheduleStructuredHistoryPushAfterLocalAppend } from '../services/structuredHistoryPushSchedule';
import { snapshotSpecBadgeDeriveInput } from '../services/specBadgeDeriveSnapshot';
import { recordTrainingFootprint } from '../services/trainingFootprintService';
import { useEntitlementStore } from './entitlementStore';

export interface HistoryStore {
  records: LocalHistoryRecord[];
  loadLocalHistory(): void;
  addHistoryRecord(record: LocalHistoryRecord): void;
  removeHistoryRecord(id: string): void;
  clearHistory(): void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  records: [],
  loadLocalHistory() {
    set({ records: loadHistory() });
  },
  addHistoryRecord(record) {
    const updated = appendHistory(record);
    set({ records: updated });
    // WHY: Snapshot archive is the explicit L2 ritual; Pro history push stays independent.
    recordTrainingFootprint(2, new Date(), snapshotSpecBadgeDeriveInput(loadScores(), updated.length));
    const ent = useEntitlementStore.getState();
    scheduleStructuredHistoryPushAfterLocalAppend(ent, record);
  },
  removeHistoryRecord(id) {
    const next = get().records.filter((record) => record.id !== id);
    saveHistory(next);
    set({ records: next });
  },
  clearHistory() {
    saveHistory([]);
    set({ records: [] });
  },
}));

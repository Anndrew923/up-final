import { create } from 'zustand';
import {
  appendHistory,
  loadHistory,
  saveHistory,
  type LocalHistoryRecord,
} from '../services/localStorageService';
import { scheduleStructuredHistoryPushAfterLocalAppend } from '../services/structuredHistoryPushSchedule';
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

import { create } from 'zustand';
import type { ScoreMap } from '../types/scoring';

/**
 * Assessment-page live preview scores not yet persisted to local storage.
 * WHY: Dyno consult gate must align with in-form draft strength before seal/submit.
 */
interface DynoIntelScoreDraftStore {
  overrides: ScoreMap;
  setLiveScore: (metric: keyof ScoreMap, score: number) => void;
  clearLiveScore: (metric: keyof ScoreMap) => void;
  clearAll: () => void;
}

export const useDynoIntelScoreDraftStore = create<DynoIntelScoreDraftStore>((set) => ({
  overrides: {},
  setLiveScore(metric, score) {
    set((state) => ({
      overrides: { ...state.overrides, [metric]: score },
    }));
  },
  clearLiveScore(metric) {
    set((state) => {
      if (state.overrides[metric] === undefined) return state;
      const next = { ...state.overrides };
      delete next[metric];
      return { overrides: next };
    });
  },
  clearAll() {
    set({ overrides: {} });
  },
}));

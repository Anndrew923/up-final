import { create } from 'zustand';
import type { ScoreMap } from '../types/scoring';
import { calculateSixAxisOverall, clampScoreMapValue } from '../logic/core/scoring';
import { loadScores, saveScores } from '../services/localStorageService';
import { buildWidgetSnapshot, saveWidgetSnapshot } from '../services/widgetSnapshotService';

function persistWidgetSnapshot(scores: ScoreMap, overallScore: number): void {
  saveWidgetSnapshot(buildWidgetSnapshot(scores, overallScore));
}

/**
 * Persists raw 0–100 per `ScoreMetric`. Six-axis overall ignores `armSize` (see `calculateSixAxisOverall`).
 */
export interface ScoreStore {
  scores: ScoreMap;
  overallScore: number;
  setScore(metric: keyof ScoreMap, value: number): void;
  setScores(next: ScoreMap): void;
  recomputeOverall(): void;
  resetScores(): void;
}

const initialScores = loadScores();
const initialOverall = calculateSixAxisOverall(initialScores);
persistWidgetSnapshot(initialScores, initialOverall);

export const useScoreStore = create<ScoreStore>((set, get) => ({
  scores: initialScores,
  overallScore: initialOverall,
  setScore(metric, value) {
    set((state) => {
      const nextScores = { ...state.scores, [metric]: clampScoreMapValue(value) };
      const overallScore = calculateSixAxisOverall(nextScores);
      saveScores(nextScores);
      persistWidgetSnapshot(nextScores, overallScore);
      return { scores: nextScores, overallScore };
    });
  },
  setScores(next) {
    const normalized = Object.entries(next).reduce<ScoreMap>((acc, [key, value]) => {
      acc[key as keyof ScoreMap] = clampScoreMapValue(value ?? 0);
      return acc;
    }, {});
    saveScores(normalized);
    const overallScore = calculateSixAxisOverall(normalized);
    persistWidgetSnapshot(normalized, overallScore);
    set({ scores: normalized, overallScore });
  },
  recomputeOverall() {
    const scores = get().scores;
    const overallScore = calculateSixAxisOverall(scores);
    persistWidgetSnapshot(scores, overallScore);
    set({ overallScore });
  },
  resetScores() {
    saveScores({});
    persistWidgetSnapshot({}, 0);
    set({ scores: {}, overallScore: 0 });
  },
}));

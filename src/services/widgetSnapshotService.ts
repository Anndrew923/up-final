import type { ScoreMap } from '../types/scoring';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

const SNAPSHOT_KEY = 'up.widget.snapshot';

export interface WidgetSnapshot {
  updatedAt: string;
  overallScore: number;
  scores: ScoreMap;
}

export function saveWidgetSnapshot(snapshot: WidgetSnapshot): void {
  safeSetItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function loadWidgetSnapshot(): WidgetSnapshot | null {
  const raw = safeGetItem(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

export function buildWidgetSnapshot(scores: ScoreMap, overallScore: number): WidgetSnapshot {
  return {
    updatedAt: new Date().toISOString(),
    overallScore,
    scores,
  };
}

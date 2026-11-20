/**
 * Collapsed DYNO ARCHIVE summary pills (pure).
 *
 * WHY: History page chrome needs count + lifetime best without re-deriving
 * overall scores in the UI layer.
 */
import type { LocalHistoryRecord } from './localHistoryRecord';

export interface HistoryArchiveSummary {
  count: number;
  bestOverall: number | null;
}

export function buildHistoryArchiveSummary(
  records: readonly LocalHistoryRecord[]
): HistoryArchiveSummary {
  if (!records || records.length === 0) {
    return { count: 0, bestOverall: null };
  }
  let best: number | null = null;
  for (const row of records) {
    if (!Number.isFinite(row.overallScore)) continue;
    if (best == null || row.overallScore > best) best = row.overallScore;
  }
  return { count: records.length, bestOverall: best };
}

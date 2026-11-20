import { describe, expect, it } from 'vitest';
import { buildHistoryArchiveSummary } from '../historyArchiveSummary';
import type { LocalHistoryRecord } from '../localHistoryRecord';

function row(id: string, overall: number): LocalHistoryRecord {
  return {
    id,
    createdAt: '2026-01-01T00:00:00.000Z',
    overallScore: overall,
    scores: { strength: overall },
  };
}

describe('buildHistoryArchiveSummary', () => {
  it('returns zeros for empty archive', () => {
    expect(buildHistoryArchiveSummary([])).toEqual({ count: 0, bestOverall: null });
  });

  it('counts rows and tracks historical max overall', () => {
    expect(buildHistoryArchiveSummary([row('a', 70), row('b', 88.5), row('c', 81)])).toEqual({
      count: 3,
      bestOverall: 88.5,
    });
  });
});

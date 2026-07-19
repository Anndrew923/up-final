import type { ScoreMap } from '../../types/scoring';

export interface LocalHistoryRecord {
  id: string;
  createdAt: string;
  scores: ScoreMap;
  overallScore: number;
  note?: string;
}

function isFiniteScoreMap(value: unknown): value is ScoreMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((score) => typeof score === 'number' && Number.isFinite(score));
}

/** Shared local/cloud boundary guard so restored data is valid before persistence. */
export function isLocalHistoryRecord(value: unknown): value is LocalHistoryRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Partial<LocalHistoryRecord>;
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    row.id.length <= 128 &&
    typeof row.createdAt === 'string' &&
    Number.isFinite(Date.parse(row.createdAt)) &&
    typeof row.overallScore === 'number' &&
    Number.isFinite(row.overallScore) &&
    isFiniteScoreMap(row.scores) &&
    (row.note === undefined || typeof row.note === 'string')
  );
}

import type { AssessmentRawInputsV1 } from '../../types/assessmentRawInputs';
import { ASSESSMENT_RAW_INPUTS_SCHEMA_VERSION } from '../../types/assessmentRawInputs';
import type { ScoreMap } from '../../types/scoring';

export interface LocalHistoryRecord {
  id: string;
  createdAt: string;
  scores: ScoreMap;
  overallScore: number;
  note?: string;
  /** Optional — absent on pre-raw-archive snapshots (downward compatible). */
  rawInputs?: AssessmentRawInputsV1;
}

function isFiniteScoreMap(value: unknown): value is ScoreMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((score) => typeof score === 'number' && Number.isFinite(score));
}

const RAW_INPUT_AXIS_KEYS = [
  'strength',
  'power',
  'cardio',
  'muscle',
  'grip',
  'armSize',
] as const;

/**
 * Shallow guard for optional raw telemetry.
 * WHY: Reject clearly corrupt blobs without requiring deep field parity with every *InputsPersisted revision.
 */
export function isAssessmentRawInputsV1(value: unknown): value is AssessmentRawInputsV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Partial<AssessmentRawInputsV1>;
  if (row.schemaVersion !== ASSESSMENT_RAW_INPUTS_SCHEMA_VERSION) return false;
  if (row.physicalProfileSnapshot !== undefined) {
    const p = row.physicalProfileSnapshot;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
    if (p.gender !== 'male' && p.gender !== 'female') return false;
    if (typeof p.age !== 'number' || !Number.isFinite(p.age)) return false;
    if (typeof p.heightCm !== 'number' || !Number.isFinite(p.heightCm)) return false;
    if (typeof p.weightKg !== 'number' || !Number.isFinite(p.weightKg)) return false;
  }
  if (row.ffmi !== undefined) {
    const f = row.ffmi;
    if (!f || typeof f !== 'object' || Array.isArray(f)) return false;
    if (typeof f.bodyFatPct !== 'number' || !Number.isFinite(f.bodyFatPct)) return false;
  }
  for (const key of RAW_INPUT_AXIS_KEYS) {
    const block = row[key];
    if (block === undefined) continue;
    if (!block || typeof block !== 'object' || Array.isArray(block)) return false;
  }
  return true;
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
    (row.note === undefined || typeof row.note === 'string') &&
    (row.rawInputs === undefined || isAssessmentRawInputsV1(row.rawInputs))
  );
}

/**
 * Restore / append path: keep the score row while dropping only invalid optional fields.
 * WHY: Parity with `parseFirestoreHistoryDoc` — a bad telemetry (or note) blob must not erase the archive.
 */
export function sanitizeLocalHistoryRecord(value: unknown): LocalHistoryRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (isLocalHistoryRecord(value)) return value;

  const row = value as Record<string, unknown>;
  const base: LocalHistoryRecord = {
    id: row.id as string,
    createdAt: row.createdAt as string,
    scores: row.scores as ScoreMap,
    overallScore: row.overallScore as number,
  };
  if (typeof row.note === 'string') base.note = row.note;
  // Keep rawInputs only when shape-valid; never require its presence to attempt salvage.
  if (isAssessmentRawInputsV1(row.rawInputs)) base.rawInputs = row.rawInputs;
  return isLocalHistoryRecord(base) ? base : null;
}

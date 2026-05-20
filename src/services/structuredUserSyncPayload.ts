/**
 * Wire-format types + parsers for Pro structured Firestore sync.
 * Lives under services/ (not types/) because payloads align with localStorage domain types.
 */
import type { ScoreMap } from '../types/scoring';
import type { PhysicalProfile } from '../types/userProfile';
import type { CardioInputsPersisted } from '../types/cardioInputs';
import type { MuscleInputsPersisted } from '../types/muscleInputs';
import type { PowerInputsPersisted } from '../types/powerInputs';
import type { StrengthInputsPersisted } from '../types/strengthInputs';
import type { GripInputsPersisted } from '../types/gripInputs';
import type { ArmSizeInputsPersisted } from '../types/armSizeInputs';
import type { FfmiDraft, LocalHistoryRecord, LocalProfile } from './localStorageService';

export const STRUCTURED_PROFILE_SCHEMA_VERSION = 1 as const;

export interface StructuredProfileFirestoreV1 {
  schemaVersion: typeof STRUCTURED_PROFILE_SCHEMA_VERSION;
  updatedAt: string;
  scores: ScoreMap;
  ladderProfile?: LocalProfile | null;
  physicalProfile?: PhysicalProfile | null;
  ffmiDraft?: FfmiDraft | null;
  cardioInputs?: CardioInputsPersisted | null;
  muscleInputs?: MuscleInputsPersisted | null;
  powerInputs?: PowerInputsPersisted | null;
  strengthInputs?: StrengthInputsPersisted | null;
  gripInputs?: GripInputsPersisted | null;
  armSizeInputs?: ArmSizeInputsPersisted | null;
  legacyBlobMigratedAt?: string | null;
}

export interface StructuredHistoryFirestoreV1 {
  schemaVersion: typeof STRUCTURED_PROFILE_SCHEMA_VERSION;
  cloudUpdatedAt: string;
  id: string;
  createdAt: string;
  scores: ScoreMap;
  overallScore: number;
  note?: string;
}

export function historyRecordToFirestore(
  record: LocalHistoryRecord,
  cloudUpdatedAt: string
): StructuredHistoryFirestoreV1 {
  return {
    schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
    cloudUpdatedAt,
    id: record.id,
    createdAt: record.createdAt,
    scores: record.scores,
    overallScore: record.overallScore,
    ...(record.note !== undefined ? { note: record.note } : {}),
  };
}

function isScoreMapLike(value: unknown): value is ScoreMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates Firestore history doc before merging into local restore.
 * Unknown `schemaVersion` is accepted for forward compatibility; mismatched numeric version is rejected.
 */
export function parseFirestoreHistoryDoc(raw: unknown): LocalHistoryRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Record<string, unknown>;
  if (d.schemaVersion !== undefined && d.schemaVersion !== STRUCTURED_PROFILE_SCHEMA_VERSION)
    return null;
  if (typeof d.id !== 'string' || !d.id) return null;
  if (typeof d.createdAt !== 'string' || !d.createdAt) return null;
  if (typeof d.overallScore !== 'number' || !Number.isFinite(d.overallScore)) return null;
  if (!isScoreMapLike(d.scores)) return null;
  const rec: LocalHistoryRecord = {
    id: d.id,
    createdAt: d.createdAt,
    scores: d.scores as ScoreMap,
    overallScore: d.overallScore,
  };
  if (typeof d.note === 'string') rec.note = d.note;
  return rec;
}

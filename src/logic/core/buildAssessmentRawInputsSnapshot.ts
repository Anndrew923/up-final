/**
 * Packs current local assessment raw inputs into an immutable history snapshot blob.
 * WHY: Axis drafts are LWW overwrite; history must freeze the values that produced the archived scores.
 */
import type {
  AssessmentPhysicalProfileSnapshot,
  AssessmentRawInputsV1,
} from '../../types/assessmentRawInputs';
import { ASSESSMENT_RAW_INPUTS_SCHEMA_VERSION } from '../../types/assessmentRawInputs';
import type { ArmSizeInputsPersisted } from '../../types/armSizeInputs';
import type { CardioInputsPersisted } from '../../types/cardioInputs';
import type { GripInputsPersisted } from '../../types/gripInputs';
import type { MuscleInputsPersisted } from '../../types/muscleInputs';
import type { PowerInputsPersisted } from '../../types/powerInputs';
import type { StrengthInputsPersisted } from '../../types/strengthInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import { parseFfmiBodyFatPctInput } from './ffmiScoring';

/** Minimal draft shape — matches `FfmiDraft` without coupling logic/core to services. */
export interface FfmiDraftLike {
  bodyFatPctInput: string;
}

export interface BuildAssessmentRawInputsSnapshotArgs {
  strengthInputs?: StrengthInputsPersisted | null;
  powerInputs?: PowerInputsPersisted | null;
  cardioInputs?: CardioInputsPersisted | null;
  muscleInputs?: MuscleInputsPersisted | null;
  gripInputs?: GripInputsPersisted | null;
  armSizeInputs?: ArmSizeInputsPersisted | null;
  ffmiDraft?: FfmiDraftLike | null;
  physicalProfile?: PhysicalProfile | null;
}

function hasOwnKeys(value: object): boolean {
  return Object.keys(value).length > 0;
}

function pickPhysicalProfileSnapshot(
  profile: PhysicalProfile | null | undefined
): AssessmentPhysicalProfileSnapshot | undefined {
  if (!profile) return undefined;
  const { gender, age, heightCm, weightKg } = profile;
  if (gender !== 'male' && gender !== 'female') return undefined;
  if (![age, heightCm, weightKg].every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return undefined;
  }
  return { gender, age, heightCm, weightKg };
}

/**
 * Deep-clone JSON-shaped persist blobs so archived history cannot share nested refs with live drafts.
 * WHY: Shallow `{...}` would leave `lifts` / `explosivePower` pointing at mutable localStorage parse trees.
 */
function clonePersisted<T extends object>(value: T | null | undefined): T | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  if (!hasOwnKeys(value)) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

/**
 * Builds a V1 raw-inputs snapshot from current local drafts.
 * Returns `undefined` when there is nothing meaningful to archive (scores-only era / empty device).
 */
export function buildAssessmentRawInputsSnapshot(
  args: BuildAssessmentRawInputsSnapshotArgs
): AssessmentRawInputsV1 | undefined {
  const snapshot: AssessmentRawInputsV1 = {
    schemaVersion: ASSESSMENT_RAW_INPUTS_SCHEMA_VERSION,
  };

  const physicalProfileSnapshot = pickPhysicalProfileSnapshot(args.physicalProfile);
  if (physicalProfileSnapshot) {
    snapshot.physicalProfileSnapshot = physicalProfileSnapshot;
  }

  const strength = clonePersisted(args.strengthInputs);
  if (strength) snapshot.strength = strength;

  const power = clonePersisted(args.powerInputs);
  if (power) snapshot.power = power;

  const cardio = clonePersisted(args.cardioInputs);
  if (cardio) snapshot.cardio = cardio;

  const muscle = clonePersisted(args.muscleInputs);
  if (muscle) snapshot.muscle = muscle;

  const grip = clonePersisted(args.gripInputs);
  if (grip) snapshot.grip = grip;

  const armSize = clonePersisted(args.armSizeInputs);
  if (armSize) snapshot.armSize = armSize;

  const bodyFatPct = parseFfmiBodyFatPctInput(args.ffmiDraft?.bodyFatPctInput);
  if (bodyFatPct !== null) {
    snapshot.ffmi = { bodyFatPct };
  }

  const hasPayload =
    snapshot.physicalProfileSnapshot !== undefined ||
    snapshot.strength !== undefined ||
    snapshot.power !== undefined ||
    snapshot.cardio !== undefined ||
    snapshot.muscle !== undefined ||
    snapshot.grip !== undefined ||
    snapshot.armSize !== undefined ||
    snapshot.ffmi !== undefined;

  return hasPayload ? snapshot : undefined;
}

/**
 * Point-in-time raw telemetry archived with a history snapshot.
 * WHY: Latest `*InputsPersisted` are overwrite-only; history needs an immutable copy.
 */
import type { ArmSizeInputsPersisted } from './armSizeInputs';
import type { CardioInputsPersisted } from './cardioInputs';
import type { GripInputsPersisted } from './gripInputs';
import type { MuscleInputsPersisted } from './muscleInputs';
import type { PowerInputsPersisted } from './powerInputs';
import type { StrengthInputsPersisted } from './strengthInputs';
import type { PhysicalProfile } from './userProfile';

export const ASSESSMENT_RAW_INPUTS_SCHEMA_VERSION = 1 as const;

/** Minimal physique context needed to re-interpret scores later. */
export type AssessmentPhysicalProfileSnapshot = Pick<
  PhysicalProfile,
  'gender' | 'age' | 'heightCm' | 'weightKg'
>;

export interface AssessmentFfmiRawPersisted {
  bodyFatPct: number;
}

export interface AssessmentRawInputsV1 {
  schemaVersion: typeof ASSESSMENT_RAW_INPUTS_SCHEMA_VERSION;
  physicalProfileSnapshot?: AssessmentPhysicalProfileSnapshot;
  strength?: StrengthInputsPersisted;
  /** Mirrors `PowerInputsPersisted` (nested `explosivePower` block) — not the score metric key alone. */
  power?: PowerInputsPersisted;
  cardio?: CardioInputsPersisted;
  muscle?: MuscleInputsPersisted;
  grip?: GripInputsPersisted;
  armSize?: ArmSizeInputsPersisted;
  ffmi?: AssessmentFfmiRawPersisted;
}

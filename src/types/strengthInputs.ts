/**
 * Local persistence for five-lift strength assessment (reference strength suite).
 * Values are stored on device only; scores are recomputed from profile + these fields.
 */

export const STRENGTH_LIFT_KEYS = [
  'benchPress',
  'squat',
  'deadlift',
  'latPulldown',
  'shoulderPress',
] as const;

export type StrengthLiftKey = (typeof STRENGTH_LIFT_KEYS)[number];

export interface StrengthLiftPersisted {
  weightKg?: number;
  reps?: number;
}

export interface StrengthInputsPersisted {
  lifts?: Partial<Record<StrengthLiftKey, StrengthLiftPersisted>>;
  /** Snapshot of profile weight (kg) at last successful submit — for audit / future UX only. */
  bodyWeightKgSnapshot?: number;
}

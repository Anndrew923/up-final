/**
 * Local persistence for grip-strength assessment inputs.
 * Score is always recomputed from profile/input in core logic to avoid UI drift.
 */
export interface GripInputsPersisted {
  /** Peak grip measurement from dynamometer (kg). */
  peakKg?: number;
  /** Optional snapshot for traceability / future audits. */
  genderSnapshot?: 'male' | 'female';
}

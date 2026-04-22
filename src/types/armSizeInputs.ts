/**
 * Local persistence for arm-size assessment inputs.
 * Score is recomputed from arm circumference + body-fat context to keep deterministic output.
 */
export interface ArmSizeInputsPersisted {
  armCircumferenceCm?: number;
  bodyFatPct?: number;
}

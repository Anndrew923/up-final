/**
 * Local persistence for explosive-power raw measurements (reference-app Power suite).
 * Values are stored on device only; scores are recomputed from profile + these fields.
 */
export interface ExplosivePowerRawPersisted {
  /** Vertical jump height (cm). */
  verticalJumpCm?: number;
  /** Standing long jump distance (cm). */
  standingLongJumpCm?: number;
  /** Sprint time — lower is better (seconds). */
  sprintSeconds?: number;
}

export interface PowerInputsPersisted {
  explosivePower?: ExplosivePowerRawPersisted;
}

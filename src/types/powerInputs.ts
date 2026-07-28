/**
 * Local persistence for explosive-power raw measurements (reference-app Power suite).
 * Values are stored on device only; scores are recomputed from profile + these fields.
 * Radar axis uses verticalJumpCm + standingLongJumpCm only; sprintSeconds is specialty-only.
 */
export interface ExplosivePowerRawPersisted {
  /** Vertical jump height (cm) — six-axis core. */
  verticalJumpCm?: number;
  /** Standing long jump distance (cm) — six-axis core. */
  standingLongJumpCm?: number;
  /** 100 m sprint time (seconds, lower better) — specialty / ladder only; never fills radar. */
  sprintSeconds?: number;
}

export interface PowerInputsPersisted {
  explosivePower?: ExplosivePowerRawPersisted;
}

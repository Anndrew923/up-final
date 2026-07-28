/**
 * Local persistence shape for cardio assessment raw inputs.
 * `cardio` (Cooper) feeds the six-axis radar; `run_5km` is specialty-only (ladder `cardio_5km`).
 * Field names mirror reference-app for cloud parity.
 */
export interface CardioCooperPersisted {
  distance?: number;
}

export interface Run5KmPersisted {
  minutes?: number;
  seconds?: number;
  totalSeconds?: number;
  /** Pace per km in seconds (informational; derived from total time / 5). */
  paceInSeconds?: number;
}

export interface CardioInputsPersisted {
  cardio?: CardioCooperPersisted;
  run_5km?: Run5KmPersisted;
}

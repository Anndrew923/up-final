/**
 * Local persistence shape for cardio assessment raw inputs (Cooper / 5 km).
 * Field names mirror reference-app (`run_5km`) for future cloud parity.
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

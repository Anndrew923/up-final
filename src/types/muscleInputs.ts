/**
 * Local persistence for muscle assessment raw input (SMM from scale / InBody).
 */
export interface MuscleInputsPersisted {
  muscle?: {
    smmKg?: number;
  };
}

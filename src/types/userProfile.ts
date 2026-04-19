/**
 * Physical baseline for assessments (body-weight-relative scoring, BMI context, etc.).
 * Stored locally — Core path; units fixed for deterministic formulas.
 */
export type PhysicalProfileGender = 'male' | 'female';

export interface PhysicalProfile {
  gender: PhysicalProfileGender;
  /** Whole years */
  age: number;
  /** Centimeters */
  heightCm: number;
  /** Kilograms */
  weightKg: number;
  updatedAt: string;
}

/**
 * Physical baseline for assessments (body-weight-relative scoring, BMI context, etc.).
 * Stored locally — Core path; units fixed for deterministic formulas.
 */
export type PhysicalProfileGender = 'male' | 'female';
import type { LadderCountryCode, LadderJobCategory } from './ladderProfile';

export interface PhysicalProfile {
  gender: PhysicalProfileGender;
  /** Whole years */
  age: number;
  /** Centimeters */
  heightCm: number;
  /** Kilograms */
  weightKg: number;
  /** Optional ladder segmentation field */
  jobCategory?: LadderJobCategory | '';
  /** Optional training profile metadata */
  weeklyTrainingHours?: number | null;
  /** Optional training profile metadata */
  trainingYears?: number | null;
  /** Optional region metadata for ladder segmentation */
  countryCode?: LadderCountryCode | '';
  /** Optional region metadata for ladder segmentation */
  region?: string;
  /** Optional region metadata for ladder segmentation */
  city?: string;
  /** Optional region metadata for ladder segmentation */
  district?: string;
  /** Ladder privacy preference; defaults to false when absent */
  isAnonymousInLadder?: boolean;
  updatedAt: string;
}

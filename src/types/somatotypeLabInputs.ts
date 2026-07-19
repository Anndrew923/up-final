import type { PhysiqueTier, SomatotypeGender } from '../logic/core/somatotypeLab';

/**
 * Lab-local draft for 人體幾何星圖.
 * WHY: Isolated from physicalProfile so trial/sandbox entries (e.g. testing another athlete)
 * never overwrite the user's real baseline.
 */
export interface SomatotypeLabInputsPersisted {
  heightCm?: number;
  weightKg?: number;
  bodyFatPct?: number;
  wristCm?: number;
  flexedArmGirthCm?: number;
  gender?: SomatotypeGender;
  isVeteran?: boolean;
  physiqueTier?: PhysiqueTier;
}

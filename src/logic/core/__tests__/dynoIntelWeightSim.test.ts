import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  DYNO_WEIGHT_SIM_DEFAULT_DELTA_KG,
  resolveWeightSimulationTargetKg,
} from '../dynoIntelWeightSim';

function profile(weightKg: number): PhysicalProfile {
  return {
    gender: 'male',
    age: 30,
    heightCm: 175,
    weightKg,
    updatedAt: '',
  };
}

describe('resolveWeightSimulationTargetKg', () => {
  it('returns profile weight minus default delta', () => {
    expect(resolveWeightSimulationTargetKg(profile(80))).toBe(72);
    expect(resolveWeightSimulationTargetKg(profile(80), DYNO_WEIGHT_SIM_DEFAULT_DELTA_KG)).toBe(72);
  });

  it('returns undefined when profile is incomplete', () => {
    expect(resolveWeightSimulationTargetKg(null)).toBeUndefined();
    expect(resolveWeightSimulationTargetKg({ ...profile(80), weightKg: 0 })).toBeUndefined();
  });

  it('returns undefined when target would be below physical minimum', () => {
    expect(resolveWeightSimulationTargetKg(profile(40), 8)).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import {
  BOOT_SEQUENCE_STEPS,
  getBootStorePhase,
  getNarrativePhase,
  isProfileInputStep,
} from '../bootSequence';

describe('bootSequence steps', () => {
  it('orders profile_input between phase1 and phase2', () => {
    expect(BOOT_SEQUENCE_STEPS).toEqual(['phase1', 'profile_input', 'phase2', 'phase3']);
  });

  it('maps narrative and profile steps for store phase', () => {
    expect(isProfileInputStep('profile_input')).toBe(true);
    expect(getNarrativePhase('profile_input')).toBeNull();
    expect(getBootStorePhase('profile_input')).toBe(1);
    expect(getBootStorePhase('phase2')).toBe(2);
    expect(getBootStorePhase('phase3')).toBe(3);
  });
});

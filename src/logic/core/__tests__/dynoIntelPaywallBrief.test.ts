import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import { buildDynoIntelContext } from '../buildDynoIntelContext';
import { resolveDynoPaywallWeakestBrief } from '../dynoIntelPaywallBrief';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 72,
  updatedAt: '',
};

describe('resolveDynoPaywallWeakestBrief', () => {
  it('returns weakest scored axis and score', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: {
          strength: 40,
          cardio: 90,
          explosivePower: 70,
          muscleMass: 65,
          bodyFat: 60,
          gripStrength: 55,
        },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'zh-Hant',
      mode: 'cross-axis',
      focusAxis: null,
    });
    const brief = resolveDynoPaywallWeakestBrief(ctx);
    expect(brief.axis).toBe('strength');
    expect(brief.score).toBe(40);
    expect(brief.isBlindSpot).toBe(false);
  });

  it('prioritizes gap axes as blind spots', () => {
    const ctx = buildDynoIntelContext({
      radarInput: {
        scores: { strength: 40, cardio: 90 },
        profile: baseProfile,
        cardioInputs: null,
        muscleInputs: null,
        powerInputs: null,
        strengthInputs: null,
        gripInputs: null,
      },
      historyRecords: [],
      locale: 'en',
      mode: 'cross-axis',
      focusAxis: null,
    });
    const brief = resolveDynoPaywallWeakestBrief(ctx);
    expect(brief.isBlindSpot).toBe(true);
  });
});

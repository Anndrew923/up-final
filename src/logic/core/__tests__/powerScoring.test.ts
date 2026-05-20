import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  calculateExplosivePowerBreakdown,
  calculateExplosivePowerFinalRaw,
  calculateScoreDecreasing,
  calculateScoreIncreasing,
  getPowerAgeRange,
  mergeScoreMapWithResolvedExplosivePower,
  resolveExplosiveLadderScoreBundle,
  resolveExplosivePowerScoreForDisplay,
  tryComputeExplosiveAssessmentScore,
  VERTICAL_JUMP_STANDARDS_MALE,
} from '../powerScoring';

describe('getPowerAgeRange', () => {
  it('maps 13–15 to 12-15 bucket', () => {
    expect(getPowerAgeRange(13)).toBe('12-15');
    expect(getPowerAgeRange(15)).toBe('12-15');
  });
  it('returns null above 80', () => {
    expect(getPowerAgeRange(81)).toBeNull();
    expect(getPowerAgeRange(90)).toBeNull();
  });
});

describe('calculateScoreIncreasing', () => {
  it('interpolates between 0 and 50 anchors', () => {
    const std = VERTICAL_JUMP_STANDARDS_MALE['21-30'];
    // (40 - 30) / (50 - 30) * 50 = 25
    expect(calculateScoreIncreasing(40, std)).toBe(25);
    expect(calculateScoreIncreasing(50, std)).toBe(50);
  });
});

describe('calculateScoreDecreasing', () => {
  it('scores higher when time is at or below 100 anchor', () => {
    const std = { 0: 17, 50: 14, 100: 11 } as const;
    expect(calculateScoreDecreasing(11, std)).toBe(100);
  });
});

describe('calculateExplosivePowerFinalRaw', () => {
  const male25: PhysicalProfile = {
    gender: 'male',
    age: 25,
    heightCm: 175,
    weightKg: 75,
    updatedAt: '',
  };

  it('uses fixed /3 composite (only vertical: raw / 3)', () => {
    const stdRow = VERTICAL_JUMP_STANDARDS_MALE['21-30'];
    const vjOnly = calculateScoreIncreasing(50, stdRow);
    const r = calculateExplosivePowerFinalRaw({
      verticalJumpCm: 50,
      standingLongJumpCm: null,
      sprintSeconds: null,
      profile: male25,
    });
    const expected = Math.round((vjOnly / 3) * 100) / 100;
    expect(r).toBe(expected);
  });

  it('breakdown lists null for skipped branches', () => {
    const b = calculateExplosivePowerBreakdown({
      verticalJumpCm: 50,
      standingLongJumpCm: null,
      sprintSeconds: null,
      profile: male25,
    });
    expect(b).not.toBeNull();
    if (!b) return;
    expect(b.verticalJumpRaw).toBeGreaterThan(0);
    expect(b.standingLongJumpRaw).toBeNull();
    expect(b.sprintRaw).toBeNull();
    expect(b.averageRaw).toBe(
      b.verticalJumpRaw != null ? Math.round((b.verticalJumpRaw / 3) * 100) / 100 : 0
    );
  });

  it('returns null when no positive inputs', () => {
    expect(
      calculateExplosivePowerFinalRaw({
        verticalJumpCm: null,
        standingLongJumpCm: null,
        sprintSeconds: null,
        profile: male25,
      })
    ).toBeNull();
  });
});

describe('tryComputeExplosiveAssessmentScore', () => {
  const profile: PhysicalProfile = {
    gender: 'male',
    age: 25,
    heightCm: 175,
    weightKg: 75,
    updatedAt: '',
  };

  it('rejects without profile', () => {
    const r = tryComputeExplosiveAssessmentScore({
      verticalJumpInput: '50',
      standingLongJumpInput: '',
      sprintInput: '',
      profile: null,
      profileReady: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('missing-profile');
  });

  it('rejects age out of range', () => {
    const r = tryComputeExplosiveAssessmentScore({
      verticalJumpInput: '50',
      standingLongJumpInput: '',
      sprintInput: '',
      profile: { ...profile, age: 85 },
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('age-out-of-range');
  });

  it('accepts single vertical jump and returns persisted payload for storage', () => {
    const r = tryComputeExplosiveAssessmentScore({
      verticalJumpInput: '50',
      standingLongJumpInput: '',
      sprintInput: '',
      profile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.score).toBeGreaterThan(0);
      expect(r.persisted).toEqual({ verticalJumpCm: 50 });
      expect(r.breakdown.verticalJumpRaw).toBeGreaterThan(0);
      expect(r.breakdown.standingLongJumpRaw).toBeNull();
      expect(r.breakdown.sprintRaw).toBeNull();
      expect(r.breakdown.averageRaw).toBe(
        Math.round((r.breakdown.verticalJumpRaw! / 3) * 100) / 100
      );
      expect(r.capApplied.verticalJump).toBe(false);
    }
  });

  it('caps extreme vertical jump for scoring and persistence', () => {
    const r = tryComputeExplosiveAssessmentScore({
      verticalJumpInput: '200',
      standingLongJumpInput: '',
      sprintInput: '',
      profile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.persisted.verticalJumpCm).toBe(135);
      expect(r.capApplied.verticalJump).toBe(true);
    }
  });
});

describe('mergeScoreMapWithResolvedExplosivePower', () => {
  const profile: PhysicalProfile = {
    gender: 'female',
    age: 28,
    heightCm: 165,
    weightKg: 58,
    updatedAt: '',
  };

  it('overrides explosivePower when persisted inputs resolve', () => {
    const merged = mergeScoreMapWithResolvedExplosivePower({ explosivePower: 10 }, profile, {
      explosivePower: { verticalJumpCm: 40 },
    });
    expect(merged.explosivePower).not.toBe(10);
    expect(merged.explosivePower).toBeGreaterThan(0);
  });

  it('leaves scores when no inputs', () => {
    const merged = mergeScoreMapWithResolvedExplosivePower({ explosivePower: 77 }, profile, {});
    expect(merged.explosivePower).toBe(77);
  });
});

describe('resolveExplosivePowerScoreForDisplay', () => {
  it('returns null for incomplete profile', () => {
    expect(
      resolveExplosivePowerScoreForDisplay(null, {
        explosivePower: { verticalJumpCm: 50 },
      })
    ).toBeNull();
  });
});

describe('resolveExplosiveLadderScoreBundle', () => {
  const profile: PhysicalProfile = {
    gender: 'male',
    age: 30,
    heightCm: 175,
    weightKg: 75,
    updatedAt: '',
  };

  it('attributes standing-long-jump norm score to broad shard only, not vertical', () => {
    const b = resolveExplosiveLadderScoreBundle(profile, {
      explosivePower: { standingLongJumpCm: 220 },
    });
    expect(b.vertical).toBeNull();
    expect(b.broad).not.toBeNull();
    expect(b.broad).toBeGreaterThan(0);
    expect(b.sprint).toBeNull();
    const expectedComposite = b.broad != null ? Math.round((b.broad / 3) * 100) / 100 : 0;
    expect(b.composite).toBeCloseTo(expectedComposite, 5);
  });
});

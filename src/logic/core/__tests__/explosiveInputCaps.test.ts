import { describe, expect, it } from 'vitest';
import {
  applyExplosiveInputCaps,
  applyExplosiveInputCapsForProfile,
  EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM,
  EXPLOSIVE_VERTICAL_JUMP_MAX_CM,
  getExplosiveCapNoticeInterpolation,
  getExplosiveSprint100mFloorSeconds,
  hasAnyExplosiveCap,
} from '../explosiveInputCaps';
import { getSprint100mFloorSeconds } from '../sprint100mStandards';
import type { PhysicalProfile } from '../../../types/userProfile';

const maleProfile: PhysicalProfile = {
  age: 25,
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('hasAnyExplosiveCap / getExplosiveCapNoticeInterpolation', () => {
  it('hasAnyExplosiveCap is false when no branch capped', () => {
    expect(
      hasAnyExplosiveCap({ verticalJump: false, standingLongJump: false, sprint: false })
    ).toBe(false);
  });

  it('hasAnyExplosiveCap is true when any branch capped', () => {
    expect(hasAnyExplosiveCap({ verticalJump: true, standingLongJump: false, sprint: false })).toBe(
      true
    );
  });

  it('getExplosiveCapNoticeInterpolation only includes keys for capped branches', () => {
    expect(
      getExplosiveCapNoticeInterpolation(maleProfile, {
        verticalJump: true,
        standingLongJump: false,
        sprint: true,
      })
    ).toEqual({
      maxVerticalJumpCm: EXPLOSIVE_VERTICAL_JUMP_MAX_CM.male,
      sprint100mFloorSeconds: getExplosiveSprint100mFloorSeconds('male', maleProfile.age),
    });
  });
});

describe('getExplosiveSprint100mFloorSeconds (WR SSOT)', () => {
  it('delegates to sprint100mStandards floor = WR − 0.13', () => {
    expect(getExplosiveSprint100mFloorSeconds('male', 45)).toBe(9.8);
    expect(getExplosiveSprint100mFloorSeconds('female', 25)).toBe(10.36);
    expect(getExplosiveSprint100mFloorSeconds('male', 45)).toBe(getSprint100mFloorSeconds('male', 45));
  });

  it('falls back to 21–30 floor when age is missing', () => {
    expect(getExplosiveSprint100mFloorSeconds('male')).toBe(9.45);
    expect(getExplosiveSprint100mFloorSeconds('female')).toBe(10.36);
  });
});

describe('applyExplosiveInputCaps', () => {
  it('caps vertical jump and standing long jump upward for male', () => {
    const r = applyExplosiveInputCaps('male', {
      verticalJumpCm: 200,
      standingLongJumpCm: 500,
      sprintSeconds: 12,
    });
    expect(r.verticalJumpCm).toBe(EXPLOSIVE_VERTICAL_JUMP_MAX_CM.male);
    expect(r.standingLongJumpCm).toBe(EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM.male);
    expect(r.sprintSeconds).toBe(12);
    expect(r.capApplied.verticalJump).toBe(true);
    expect(r.capApplied.standingLongJump).toBe(true);
    expect(r.capApplied.sprint).toBe(false);
  });

  it('floors sprint time when faster than WR−0.13 (male 21–30 → 9.45)', () => {
    const r = applyExplosiveInputCaps(
      'male',
      {
        verticalJumpCm: null,
        standingLongJumpCm: null,
        sprintSeconds: 8,
      },
      { age: 25 }
    );
    expect(r.sprintSeconds).toBe(9.45);
    expect(r.capApplied.sprint).toBe(true);
  });

  it('floors female 21–30 elite times to 10.36s', () => {
    const r = applyExplosiveInputCaps(
      'female',
      {
        verticalJumpCm: 150,
        standingLongJumpCm: 400,
        sprintSeconds: 9,
      },
      { age: 25 }
    );
    expect(r.verticalJumpCm).toBe(135);
    expect(r.standingLongJumpCm).toBe(390);
    expect(r.sprintSeconds).toBe(10.36);
    expect(r.capApplied).toEqual({ verticalJump: true, standingLongJump: true, sprint: true });
  });

  it('floors male 41–50 elite times to 9.80s (not the old 11.4s soft floor)', () => {
    const r = applyExplosiveInputCaps(
      'male',
      {
        verticalJumpCm: null,
        standingLongJumpCm: null,
        sprintSeconds: 9.58,
      },
      { age: 45 }
    );
    expect(r.sprintSeconds).toBe(9.8);
    expect(r.capApplied.sprint).toBe(true);
  });

  it('leaves nulls and in-range values unchanged', () => {
    const r = applyExplosiveInputCaps(
      'male',
      {
        verticalJumpCm: 60,
        standingLongJumpCm: null,
        sprintSeconds: 14,
      },
      { age: 25 }
    );
    expect(r.capApplied).toEqual({ verticalJump: false, standingLongJump: false, sprint: false });
    expect(r.verticalJumpCm).toBe(60);
    expect(r.standingLongJumpCm).toBeNull();
    expect(r.sprintSeconds).toBe(14);
  });

  it('resolves 女性 profile token via normalizeGenderForNormTables', () => {
    const profile: PhysicalProfile = {
      ...maleProfile,
      gender: '女性' as PhysicalProfile['gender'],
    };
    const r = applyExplosiveInputCapsForProfile(profile, {
      verticalJumpCm: 200,
      standingLongJumpCm: null,
      sprintSeconds: null,
    });
    expect(r.capApplied.verticalJump).toBe(true);
    expect(r.verticalJumpCm).toBe(EXPLOSIVE_VERTICAL_JUMP_MAX_CM.female);
  });
});

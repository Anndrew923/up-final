import { describe, expect, it } from 'vitest';
import {
  applyExplosiveInputCaps,
  EXPLOSIVE_SPRINT_100M_FLOOR_SECONDS,
  EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM,
  EXPLOSIVE_VERTICAL_JUMP_MAX_CM,
  getExplosiveCapNoticeInterpolation,
  hasAnyExplosiveCap,
} from '../explosiveInputCaps';
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
      sprint100mFloorSeconds: EXPLOSIVE_SPRINT_100M_FLOOR_SECONDS.male,
    });
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

  it('floors sprint time when faster than model 100 m floor (male)', () => {
    const r = applyExplosiveInputCaps('male', {
      verticalJumpCm: null,
      standingLongJumpCm: null,
      sprintSeconds: 8,
    });
    expect(r.sprintSeconds).toBe(9.4);
    expect(r.capApplied.sprint).toBe(true);
  });

  it('uses female caps', () => {
    const r = applyExplosiveInputCaps('female', {
      verticalJumpCm: 150,
      standingLongJumpCm: 400,
      sprintSeconds: 9,
    });
    expect(r.verticalJumpCm).toBe(135);
    expect(r.standingLongJumpCm).toBe(390);
    expect(r.sprintSeconds).toBe(9.4);
    expect(r.capApplied).toEqual({ verticalJump: true, standingLongJump: true, sprint: true });
  });

  it('leaves nulls and in-range values unchanged', () => {
    const r = applyExplosiveInputCaps('male', {
      verticalJumpCm: 60,
      standingLongJumpCm: null,
      sprintSeconds: 14,
    });
    expect(r.capApplied).toEqual({ verticalJump: false, standingLongJump: false, sprint: false });
    expect(r.verticalJumpCm).toBe(60);
    expect(r.standingLongJumpCm).toBeNull();
    expect(r.sprintSeconds).toBe(14);
  });
});

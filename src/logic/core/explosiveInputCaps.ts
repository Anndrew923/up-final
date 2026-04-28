/**
 * Explosive raw-input ceilings / floors so field-test typos cannot blow past elite-record-class physics
 * in the scoring model. Caps apply before norm-table math; persisted saves use capped values.
 *
 * Standing long jump user spec is in meters (3.80 m / 3.20 m) — this app stores cm everywhere else.
 */
import type { PhysicalProfile } from '../../types/userProfile';

export const EXPLOSIVE_VERTICAL_JUMP_MAX_CM = { male: 135, female: 135 } as const;
export const EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM = { male: 390, female: 390 } as const;
/** 100 m — fastest time (s) the model accepts; faster inputs are floored here (lower s = better). */
export const EXPLOSIVE_SPRINT_100M_FLOOR_SECONDS = { male: 9.4, female: 9.4 } as const;

export type ExplosiveCapApplied = {
  verticalJump: boolean;
  standingLongJump: boolean;
  sprint: boolean;
};

export function getExplosiveVerticalJumpCapCm(gender: 'male' | 'female'): number {
  return EXPLOSIVE_VERTICAL_JUMP_MAX_CM[gender];
}

export function getExplosiveStandingLongJumpCapCm(gender: 'male' | 'female'): number {
  return EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM[gender];
}

export function getExplosiveSprint100mFloorSeconds(gender: 'male' | 'female'): number {
  return EXPLOSIVE_SPRINT_100M_FLOOR_SECONDS[gender];
}

export function hasAnyExplosiveCap(cap: ExplosiveCapApplied): boolean {
  return cap.verticalJump || cap.standingLongJump || cap.sprint;
}

/** i18n interpolation for cap notices — only keys for branches that were capped. */
export function getExplosiveCapNoticeInterpolation(
  profile: PhysicalProfile,
  cap: ExplosiveCapApplied
): {
  maxVerticalJumpCm?: number;
  maxStandingLongJumpCm?: number;
  sprint100mFloorSeconds?: number;
} {
  const gender = profile.gender === 'female' ? 'female' : 'male';
  const out: {
    maxVerticalJumpCm?: number;
    maxStandingLongJumpCm?: number;
    sprint100mFloorSeconds?: number;
  } = {};
  if (cap.verticalJump) out.maxVerticalJumpCm = getExplosiveVerticalJumpCapCm(gender);
  if (cap.standingLongJump) out.maxStandingLongJumpCm = getExplosiveStandingLongJumpCapCm(gender);
  if (cap.sprint) out.sprint100mFloorSeconds = getExplosiveSprint100mFloorSeconds(gender);
  return out;
}

export type ExplosiveCapNoticeInterpolation = ReturnType<typeof getExplosiveCapNoticeInterpolation>;

export function applyExplosiveInputCaps(
  gender: 'male' | 'female',
  input: {
    verticalJumpCm: number | null;
    standingLongJumpCm: number | null;
    sprintSeconds: number | null;
  }
): {
  verticalJumpCm: number | null;
  standingLongJumpCm: number | null;
  sprintSeconds: number | null;
  capApplied: ExplosiveCapApplied;
} {
  const capApplied: ExplosiveCapApplied = {
    verticalJump: false,
    standingLongJump: false,
    sprint: false,
  };

  let verticalJumpCm = input.verticalJumpCm;
  let standingLongJumpCm = input.standingLongJumpCm;
  let sprintSeconds = input.sprintSeconds;

  const vMax = EXPLOSIVE_VERTICAL_JUMP_MAX_CM[gender];
  if (verticalJumpCm !== null && verticalJumpCm > vMax) {
    verticalJumpCm = vMax;
    capApplied.verticalJump = true;
  }

  const sljMax = EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM[gender];
  if (standingLongJumpCm !== null && standingLongJumpCm > sljMax) {
    standingLongJumpCm = sljMax;
    capApplied.standingLongJump = true;
  }

  const spFloor = EXPLOSIVE_SPRINT_100M_FLOOR_SECONDS[gender];
  if (sprintSeconds !== null && sprintSeconds > 0 && sprintSeconds < spFloor) {
    sprintSeconds = spFloor;
    capApplied.sprint = true;
  }

  return { verticalJumpCm, standingLongJumpCm, sprintSeconds, capApplied };
}

export function applyExplosiveInputCapsForProfile(
  profile: PhysicalProfile,
  input: {
    verticalJumpCm: number | null;
    standingLongJumpCm: number | null;
    sprintSeconds: number | null;
  }
): ReturnType<typeof applyExplosiveInputCaps> {
  const g = profile.gender === 'female' ? 'female' : 'male';
  return applyExplosiveInputCaps(g, input);
}

/**
 * Explosive raw-input ceilings / floors so field-test typos cannot blow past elite-record-class physics
 * in the scoring model. Caps apply before norm-table math; persisted saves use capped values.
 *
 * Standing long jump user spec is in meters (3.80 m / 3.20 m) — this app stores cm everywhere else.
 *
 * Sprint floor (WHY): world-record SSOT (`sprint100mStandards`) — floor = WR − 0.13 so elite
 * typos clamp near radar 200 without a second T100 mirror (shared with powerScoring).
 */
import type { PhysicalProfile } from '../../types/userProfile';
import { normalizeGenderForNormTables } from './genderNormalize';
import { getSprint100mFloorSeconds } from './sprint100mStandards';

export const EXPLOSIVE_VERTICAL_JUMP_MAX_CM = { male: 135, female: 135 } as const;
export const EXPLOSIVE_STANDING_LONG_JUMP_MAX_CM = { male: 390, female: 390 } as const;

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

/** Age/sex 100 m floor from WR SSOT (`WR − 0.13`). */
export function getExplosiveSprint100mFloorSeconds(
  gender: 'male' | 'female',
  age?: number | string | null
): number {
  return getSprint100mFloorSeconds(gender, age);
}

/** WHY: cap notices and floors must follow the same sex norm as powerScoring (e.g. 女性 token). */
export function resolveExplosiveCapGender(
  profile: PhysicalProfile
): 'male' | 'female' {
  return normalizeGenderForNormTables(profile.gender) === 'female' ? 'female' : 'male';
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
  const gender = resolveExplosiveCapGender(profile);
  const out: {
    maxVerticalJumpCm?: number;
    maxStandingLongJumpCm?: number;
    sprint100mFloorSeconds?: number;
  } = {};
  if (cap.verticalJump) out.maxVerticalJumpCm = getExplosiveVerticalJumpCapCm(gender);
  if (cap.standingLongJump) out.maxStandingLongJumpCm = getExplosiveStandingLongJumpCapCm(gender);
  if (cap.sprint) {
    out.sprint100mFloorSeconds = getExplosiveSprint100mFloorSeconds(gender, profile.age);
  }
  return out;
}

export type ExplosiveCapNoticeInterpolation = ReturnType<typeof getExplosiveCapNoticeInterpolation>;

export function applyExplosiveInputCaps(
  gender: 'male' | 'female',
  input: {
    verticalJumpCm: number | null;
    standingLongJumpCm: number | null;
    sprintSeconds: number | null;
  },
  opts?: { age?: number | string | null }
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

  const spFloor = getSprint100mFloorSeconds(gender, opts?.age);
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
  const g = resolveExplosiveCapGender(profile);
  return applyExplosiveInputCaps(g, input, { age: profile.age });
}

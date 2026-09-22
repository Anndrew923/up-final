import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  calculateExplosivePowerBreakdown,
  calculateExplosivePowerFinalRaw,
  calculateScoreDecreasing,
  calculateScoreIncreasing,
  calculateSljScore,
  calculateVjumpScore,
  getPowerAgeRange,
  getPowerStandardsForProfile,
  mergeScoreMapWithResolvedExplosivePower,
  resolveExplosiveLadderScoreBundle,
  resolveExplosivePowerScoreForDisplay,
  scoreIncreasingOverflowAboveT100,
  scoreSprintOverflowAboveT100,
  STANDING_LONG_JUMP_STANDARDS_FEMALE,
  STANDING_LONG_JUMP_STANDARDS_MALE,
  tryComputeExplosiveAssessmentScore,
  VERTICAL_JUMP_STANDARDS_MALE,
} from '../powerScoring';
import {
  invertSljScoreToCm,
  invertVjumpScoreToCm,
  resolveExplosiveMilestoneRawGap,
} from '../powerMilestoneGap';
import { clampScoreMapValue } from '../scoring';
import { EXPLOSIVE_SPRINT_100M_FLOOR_SECONDS } from '../explosiveInputCaps';
import { resolveScoreMeaningMilestone } from '../scoreMeaningCatalog';

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

describe('calculateSljScore', () => {
  const maleSlj2130 = STANDING_LONG_JUMP_STANDARDS_MALE['21-30'];
  const femaleSlj2130 = STANDING_LONG_JUMP_STANDARDS_FEMALE['21-30'];

  it('interpolates between 0 and 50 anchors via shared linear band', () => {
    const std = VERTICAL_JUMP_STANDARDS_MALE['21-30'];
    expect(calculateVjumpScore(40, std)).toBe(25);
    expect(calculateVjumpScore(50, std)).toBe(50);
  });

  it('holds T100 anchor at exactly 100.00 (male 21–30 SLJ)', () => {
    expect(calculateSljScore(270, maleSlj2130)).toBe(100);
    expect(calculateScoreIncreasing(270, maleSlj2130)).toBe(100);
  });

  it('applies meter 4th-power warp above T100 (male 21–30 SLJ checkpoints)', () => {
    expect(calculateSljScore(320, maleSlj2130)).toBe(122.81);
    expect(calculateSljScore(370, maleSlj2130)).toBe(185);
    expect(scoreIncreasingOverflowAboveT100(0.5)).toBe(122.81);
    expect(scoreIncreasingOverflowAboveT100(1)).toBe(185);
  });

  it('clamps cap-class SLJ raw into radar 200 via clampScoreMapValue', () => {
    const raw = calculateSljScore(390, maleSlj2130);
    expect(raw).toBe(241.31);
    expect(clampScoreMapValue(raw)).toBe(200);
  });

  it('applies female SLJ norm warp (320 cm on 21–30 row)', () => {
    expect(calculateSljScore(320, femaleSlj2130)).toBe(165.52);
  });

  it('defaults to male SLJ norms when profile gender is undefined', () => {
    const profile = {
      gender: undefined,
      age: 25,
      heightCm: 175,
      weightKg: 75,
      updatedAt: '',
    } as unknown as PhysicalProfile;
    const std = getPowerStandardsForProfile(profile);
    expect(std).not.toBeNull();
    if (!std) return;
    expect(calculateSljScore(370, std.slj)).toBe(185);
  });
});

describe('calculateVjumpScore', () => {
  const maleVj2130 = VERTICAL_JUMP_STANDARDS_MALE['21-30'];

  it('holds T100 anchor at exactly 100.00 (male 21–30)', () => {
    expect(calculateVjumpScore(70, maleVj2130)).toBe(100);
  });

  it('applies cm 4th-power warp above T100 (male 21–30 checkpoints)', () => {
    expect(calculateVjumpScore(90, maleVj2130)).toBe(133.44);
    expect(calculateVjumpScore(103, maleVj2130)).toBe(175);
  });

  it('clamps Sensabaugh-class WR raw into ladder vertical shard 200', () => {
    const raw = calculateVjumpScore(116.84, maleVj2130);
    expect(raw).toBe(273.76);
    expect(clampScoreMapValue(raw)).toBe(200);

    const profile: PhysicalProfile = {
      gender: 'male',
      age: 25,
      heightCm: 175,
      weightKg: 75,
      updatedAt: '',
    };
    const ladder = resolveExplosiveLadderScoreBundle(profile, {
      explosivePower: { verticalJumpCm: 116.84 },
    });
    expect(ladder.vertical).toBe(200);
  });

  it('defaults to male VJump norms when profile gender is undefined', () => {
    const profile = {
      gender: undefined,
      age: 25,
      heightCm: 175,
      weightKg: 75,
      updatedAt: '',
    } as unknown as PhysicalProfile;
    const std = getPowerStandardsForProfile(profile);
    expect(std).not.toBeNull();
    if (!std) return;
    expect(calculateVjumpScore(103, std.vjump)).toBe(175);
  });
});

describe('calculateScoreDecreasing', () => {
  /** Male 21–30 sprint anchors — regression guard for 4th-power warp above T100. */
  const male2130Sprint = { 0: 17, 50: 14, 100: 11 } as const;

  it('interpolates between T50 and T0 without warp (mid-band unchanged)', () => {
    expect(calculateScoreDecreasing(14, male2130Sprint)).toBe(50);
    expect(calculateScoreDecreasing(15, male2130Sprint)).toBeCloseTo(33.33, 2);
    expect(calculateScoreDecreasing(17, male2130Sprint)).toBe(0);
    expect(calculateScoreDecreasing(18, male2130Sprint)).toBe(0);
  });

  it('applies 4th-power warp above T100 (male 21–30 critical checkpoints)', () => {
    expect(calculateScoreDecreasing(11, male2130Sprint)).toBe(100);
    expect(calculateScoreDecreasing(10.2, male2130Sprint)).toBe(120.92);
    expect(calculateScoreDecreasing(10, male2130Sprint)).toBe(132);
    expect(calculateScoreDecreasing(9.92, male2130Sprint)).toBe(137.93);
    expect(calculateScoreDecreasing(9.58, male2130Sprint)).toBe(177.19);
  });

  it('scoreSprintOverflowAboveT100 matches calculateScoreDecreasing at T100 and below', () => {
    expect(scoreSprintOverflowAboveT100(0)).toBe(100);
    expect(scoreSprintOverflowAboveT100(11 - 9.58)).toBe(177.19);
  });

  it('clamps Bolt-class sprint raw into radar 0–200 via clampScoreMapValue', () => {
    const raw = calculateScoreDecreasing(9.58, male2130Sprint);
    expect(raw).toBe(177.19);
    expect(clampScoreMapValue(raw)).toBe(raw);
    expect(clampScoreMapValue(raw)).toBeLessThanOrEqual(200);
  });

  it('floors sub-record sprint input; sprint-only writes specialty shard, not radar composite', () => {
    const profile: PhysicalProfile = {
      gender: 'male',
      age: 25,
      heightCm: 175,
      weightKg: 75,
      updatedAt: '',
    };
    const r = tryComputeExplosiveAssessmentScore({
      verticalJumpInput: '',
      standingLongJumpInput: '',
      sprintInput: '9.0',
      profile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.persisted.sprintSeconds).toBe(EXPLOSIVE_SPRINT_100M_FLOOR_SECONDS.male);
    expect(r.capApplied.sprint).toBe(true);
    expect(r.breakdown.sprintRaw).toBe(210.64);
    expect(r.breakdown.averageRaw).toBeNull();
    expect(r.writesRadarAxis).toBe(false);
    expect(r.score).toBeNull();

    const ladder = resolveExplosiveLadderScoreBundle(profile, {
      explosivePower: { sprintSeconds: r.persisted.sprintSeconds },
    });
    expect(ladder.sprint).toBe(200);
    expect(ladder.composite).toBeNull();
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

  it('uses fixed /2 jump composite (only vertical: raw / 2); sprint excluded', () => {
    const stdRow = VERTICAL_JUMP_STANDARDS_MALE['21-30'];
    const vjOnly = calculateVjumpScore(50, stdRow);
    const r = calculateExplosivePowerFinalRaw({
      verticalJumpCm: 50,
      standingLongJumpCm: null,
      sprintSeconds: null,
      profile: male25,
    });
    const expected = Math.round((vjOnly / 2) * 100) / 100;
    expect(r).toBe(expected);
  });

  it('breakdown lists null for skipped branches; averageRaw ignores sprint', () => {
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
      b.verticalJumpRaw != null ? Math.round((b.verticalJumpRaw / 2) * 100) / 100 : null
    );
  });

  it('sprint alone yields breakdown with null averageRaw (no radar axis)', () => {
    const b = calculateExplosivePowerBreakdown({
      verticalJumpCm: null,
      standingLongJumpCm: null,
      sprintSeconds: 14,
      profile: male25,
    });
    expect(b).not.toBeNull();
    if (!b) return;
    expect(b.sprintRaw).toBeGreaterThan(0);
    expect(b.averageRaw).toBeNull();
    expect(
      calculateExplosivePowerFinalRaw({
        verticalJumpCm: null,
        standingLongJumpCm: null,
        sprintSeconds: 14,
        profile: male25,
      })
    ).toBeNull();
  });

  it('averages both jumps /2 and ignores sprint in composite', () => {
    const b = calculateExplosivePowerBreakdown({
      verticalJumpCm: 50,
      standingLongJumpCm: 220,
      sprintSeconds: 11,
      profile: male25,
    });
    expect(b).not.toBeNull();
    if (!b) return;
    expect(b.sprintRaw).toBeGreaterThan(0);
    expect(b.verticalJumpRaw).toBeGreaterThan(0);
    expect(b.standingLongJumpRaw).toBeGreaterThan(0);
    const expected = Math.round(((b.verticalJumpRaw! + b.standingLongJumpRaw!) / 2) * 100) / 100;
    expect(b.averageRaw).toBe(expected);
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
      expect(r.writesRadarAxis).toBe(true);
      expect(r.score).toBeGreaterThan(0);
      expect(r.persisted).toEqual({ verticalJumpCm: 50 });
      expect(r.breakdown.verticalJumpRaw).toBeGreaterThan(0);
      expect(r.breakdown.standingLongJumpRaw).toBeNull();
      expect(r.breakdown.sprintRaw).toBeNull();
      expect(r.breakdown.averageRaw).toBe(
        Math.round((r.breakdown.verticalJumpRaw! / 2) * 100) / 100
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

  it('clears stale axis when only specialty sprint remains', () => {
    const merged = mergeScoreMapWithResolvedExplosivePower({ explosivePower: 77 }, profile, {
      explosivePower: { sprintSeconds: 14 },
    });
    expect(merged.explosivePower).toBe(0);
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

  it('returns null for sprint-only specialty (no radar fallback)', () => {
    const profile: PhysicalProfile = {
      gender: 'male',
      age: 25,
      heightCm: 175,
      weightKg: 75,
      updatedAt: '',
    };
    expect(
      resolveExplosivePowerScoreForDisplay(profile, {
        explosivePower: { sprintSeconds: 12 },
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
    const expectedComposite = b.broad != null ? Math.round((b.broad / 2) * 100) / 100 : 0;
    expect(b.composite).toBeCloseTo(expectedComposite, 5);
  });

  it('preserves elite SLJ separation on broad shard (370 cm warp, not flat 200)', () => {
    const b = resolveExplosiveLadderScoreBundle(profile, {
      explosivePower: { standingLongJumpCm: 370 },
    });
    expect(b.broad).toBe(185);
    expect(b.broad).toBeLessThan(200);
  });

  it('clamps world-record-class capped SLJ at 390 cm to broad shard 200', () => {
    const b = resolveExplosiveLadderScoreBundle(profile, {
      explosivePower: { standingLongJumpCm: 390 },
    });
    expect(b.broad).toBe(200);
  });
});

describe('invertVjumpScoreToCm / invertSljScoreToCm', () => {
  const maleVj2130 = VERTICAL_JUMP_STANDARDS_MALE['21-30'];
  const maleSlj2130 = STANDING_LONG_JUMP_STANDARDS_MALE['21-30'];

  it('returns null for non-positive targets', () => {
    expect(invertVjumpScoreToCm(0, maleVj2130)).toBeNull();
    expect(invertSljScoreToCm(-1, maleSlj2130)).toBeNull();
  });

  it('inverts linear-band anchors (male 21–30)', () => {
    expect(invertVjumpScoreToCm(50, maleVj2130)).toBe(50);
    expect(invertVjumpScoreToCm(100, maleVj2130)).toBe(70);
    expect(invertSljScoreToCm(50, maleSlj2130)).toBe(220);
    expect(invertSljScoreToCm(100, maleSlj2130)).toBe(270);
  });

  it('round-trips overflow checkpoints (forward(invert(score)) >= score)', () => {
    for (const score of [100, 133.44, 175]) {
      const cm = invertVjumpScoreToCm(score, maleVj2130);
      expect(cm).not.toBeNull();
      expect(calculateVjumpScore(cm!, maleVj2130)).toBeGreaterThanOrEqual(score);
    }
    for (const score of [100, 122.81, 185]) {
      const cm = invertSljScoreToCm(score, maleSlj2130);
      expect(cm).not.toBeNull();
      expect(calculateSljScore(cm!, maleSlj2130)).toBeGreaterThanOrEqual(score);
    }
  });

  it('returns null when target exceeds score at input ceiling', () => {
    const ceiling = calculateVjumpScore(135, maleVj2130);
    expect(invertVjumpScoreToCm(ceiling + 1, maleVj2130, 135)).toBeNull();
  });
});

describe('resolveExplosiveMilestoneRawGap', () => {
  const profile: PhysicalProfile = {
    gender: 'male',
    age: 25,
    heightCm: 175,
    weightKg: 75,
    updatedAt: '',
  };

  it('exposes dual or-path deltas toward the next decade gate', () => {
    const currentVjCm = 50;
    const currentSljCm = 220;
    const breakdown = calculateExplosivePowerBreakdown({
      verticalJumpCm: currentVjCm,
      standingLongJumpCm: currentSljCm,
      sprintSeconds: null,
      profile,
    });
    expect(breakdown?.averageRaw).toBe(50);
    const { nextMilestone } = resolveScoreMeaningMilestone(
      'explosivePower',
      breakdown!.averageRaw!
    );
    expect(nextMilestone).toBe(60);

    const gap = resolveExplosiveMilestoneRawGap({
      targetCompositeScore: nextMilestone!,
      currentVjCm,
      currentSljCm,
      profile,
    });
    expect(gap).not.toBeNull();
    expect(gap!.unit).toBe('cm');
    expect(gap!.vJumpDeltaCm).toBeGreaterThanOrEqual(0.1);
    expect(gap!.bJumpDeltaCm).toBeGreaterThanOrEqual(0.1);

    const std = getPowerStandardsForProfile(profile)!;
    const clearedViaVj = calculateVjumpScore(
      currentVjCm + gap!.vJumpDeltaCm!,
      std.vjump
    );
    expect((clearedViaVj + 50) / 2).toBeGreaterThanOrEqual(60);
    const clearedViaSlj = calculateSljScore(
      currentSljCm + gap!.bJumpDeltaCm!,
      std.slj
    );
    expect((50 + clearedViaSlj) / 2).toBeGreaterThanOrEqual(60);
  });

  it('still offers a path when one jump is missing (counts as 0)', () => {
    const gap = resolveExplosiveMilestoneRawGap({
      targetCompositeScore: 40,
      currentVjCm: 50,
      currentSljCm: null,
      profile,
    });
    expect(gap).not.toBeNull();
    // Composite is 25; need 40 → VJ-only or fill SLJ from zero.
    expect(gap!.vJumpDeltaCm).toBeGreaterThanOrEqual(0.1);
    expect(gap!.bJumpDeltaCm).toBeGreaterThanOrEqual(0.1);
  });

  it('returns null when both jumps are empty', () => {
    expect(
      resolveExplosiveMilestoneRawGap({
        targetCompositeScore: 50,
        currentVjCm: null,
        currentSljCm: null,
        profile,
      })
    ).toBeNull();
  });

  it('returns null when already past required cm on both paths', () => {
    const gap = resolveExplosiveMilestoneRawGap({
      targetCompositeScore: 50,
      currentVjCm: 70,
      currentSljCm: 270,
      profile,
    });
    // Average is already 100 — both single-path requirements are already met.
    expect(gap).toBeNull();
  });

  it('keeps the reachable path when the other leg alone cannot clear the gate', () => {
    // needScore = 2*150 − 50 = 250 each side; SLJ@390 ≈ 241 < 250, VJ@135 ≈ 273 ≥ 250.
    const gap = resolveExplosiveMilestoneRawGap({
      targetCompositeScore: 150,
      currentVjCm: 50,
      currentSljCm: 220,
      profile,
    });
    expect(gap).not.toBeNull();
    expect(gap!.bJumpDeltaCm).toBeNull();
    expect(gap!.vJumpDeltaCm).toBeGreaterThanOrEqual(0.1);
  });
});
